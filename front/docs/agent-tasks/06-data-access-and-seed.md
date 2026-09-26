# Task 06 — Data access layer, generated types, and seed

**Read [`00-CONTEXT.md`](./00-CONTEXT.md) first.**
**Depends on:** Task 01, applied 2026-09-06. The ground truth is the
migrations under `supabase/migrations/`, not the Task 01 brief: the header of
`20260906155856_identity_core.sql` holds the decision record for the four mock
inconsistencies and the deliberate deviation that puts birth date, phone and
guardian email in `profiles_private`, not `profiles`.
**Can run in parallel with:** Task 02, Task 04.

## Goal

Give every later task a typed, consistent way to read and write data, and seed
the database with the mock content so the app has something realistic to render.

This task is mostly about **reconciliation**. The mock data grew organically and
the same concept is modelled differently on the student and teacher sides. If
those contradictions reach the query layer, every later task inherits them.

## Part one, generated types

The types were generated right after Task 01 with the Supabase MCP tool
`generate_typescript_types` into `src/lib/supabase/database.types.ts`
(`Database`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `Constants`).
The file is committed but unused: pass `Database` as the generic to
`createBrowserClient` in `client.ts`, `createServerClient` in `server.ts` and
the supabase-js `createSupabaseClient` call inside `createAdminClient` in
`admin.ts`, all still untyped. This is yours alone: Tasks 02, 03 and 04 must
not edit those files. Re-generating after a schema change must be a
one-command habit, so document it in the README you touch.

The four other files in `src/lib/supabase/` are client and environment plumbing
only.

## Part two, the reconciliation

This is the real work. A survey of every mock file found the same concept
modelled two ways. Pick **one** shape per row, write it down, and make the query
layer speak only that shape.

One reconciliation is already done. `subjects`, `levels` and `languages` are
reference tables seeded by `20260906155947_reference_vocabularies.sql`: eleven
subjects with `SES` folded into `Économie` and `Maths` treated as
`Mathématiques`, ASCII slugs such as `mathematiques`, `physique-chimie`,
`histoire-geo`, `economie`; levels `college`, `lycee`, `prepa`, `sup`;
languages `francais`, `arabe`, `anglais`, `espagnol`, `amazigh`. Free-text
subject strings in the mocks (`"Maths sup"`) must be mapped by the seed to a
subject slug plus a level. Reference these rows by slug, never by id.

| Concept | Student side | Teacher side |
|---|---|---|
| Session counterparty | `teacher: string` plus `teacherInitials` | `teacher: { name, initials }` |
| Session time | `when` holds a display label | `when` holds ISO, `whenLabel` holds the label |
| Review counterparty | `teacher`, and `date` as display text | `student: {...}`, and `dateISO` |
| Application | `price`, `rating`, `subject` | `offeredPrice`, `referencePrice`, `targetKind`, `postedAgo` |
| Request author | `author: string` plus `authorInitials` plus `level` | `author: { name, initials, level }` |
| Request body | `description`, `deadline` | `snippet`, `deadlineLabel` |
| Transaction | `title`, `teacher`, `amount` | `sessionTitle`, `student`, `gross`/`fee`/`net` |
| Balance | a bare `balance` number in component state | `{ available, month, ytd, pendingPayouts }` |

Four traps inside that table.

**`when` means two different things.** On the student dashboard it is a French
display label. In `SessionDetailData` it is an ISO timestamp. There are adapter
functions in `student/page.tsx` bridging them, and one of them fabricates a
timestamp with `new Date().toISOString()` because the source has no real date.

**The session counterparty field is named for one role.** Teacher pages reuse
`SessionDetailData.teacher` to hold the **student's** name. Model both
participants explicitly and let each view pick the other one.

**Status vocabularies collide in gendered French.** The shared invoice body uses
masculine `payé`, while both row wrappers use feminine `payée`. Every mock
consequently stores the status twice in two spellings. Transaction status is
worse: the student side says `payé` and `échoué` where the teacher side says
`encaissé` and `annulé`, overlapping only on `en attente` and `remboursé`. These
are the same underlying states seen from two sides. Model the state once and
map to role-specific French at render.

**Notification preference categories diverge by one member.** The student union
has `message`, the teacher union has `reminder`, and both share `session`,
`payment` and `marketing`. The teacher UI also relabels shared categories, so
`session` displays as "Demandes" and `system` as "Séances". The same literal
means different things per role.

## Part three, the query layer

Build typed query functions the pages can call, replacing the mock imports.
Group them by domain rather than by page.

The identity domain after Task 01: `profiles` (public-safe; teacher rows
readable by anyone, own row by the owner, who may update only `full_name`,
`city`, `avatar_path`, `ui_locale`; `role` is immutable), `profiles_private`
(owner-only, never anon), `teacher_profiles` with `teacher_subjects` /
`teacher_levels` / `teacher_languages` (public read, owner write),
`student_profiles` with `student_subjects` (owner-only), `user_devices`
(owner-only), and the `teacher_public_profiles` view for
`/teacher/preview/[username]`. Read the caller's role from their own
`profiles.role` row; `private.user_role()` is a policy helper in the unexposed
`private` schema and cannot be called through the API.

Two rules from the RLS performance guide, both non-obvious:

**Always add an explicit filter, even when a policy already enforces it.**
Write the equivalent of `where user_id = $1` in the query as well as in the
policy. Duplicating the policy's own condition lets Postgres build a better
plan. The measured difference is 171 milliseconds against 9.

**Never select the whole row when a policy is doing the filtering.** Name the
columns. Public teacher profiles in particular: read them from the
`teacher_public_profiles` view (`security_invoker`, safe columns only, readable
signed out). Birth date, phone and guardian email are not on `profiles`; they
live in `profiles_private`, owner-only and never anon. Never join that table
into a public read, since it is the only place a query can leak birth dates,
phone numbers or guardian emails.

## Part four, the seed

Write a seed script that loads the mock content into the database so the app
renders realistically in development.

Rules that matter:

**Create people through auth, never by inserting profile rows.** `profiles`,
`profiles_private` and the role row (`teacher_profiles` with a trigger-generated
`username` such as `youssef-amrani`, or `student_profiles`) are created by the
`on_auth_user_created` trigger on `auth.users`. Seed each person with the
service-role client: `auth.admin.createUser({ email, password, email_confirm:
true, user_metadata: { full_name, role, birth_date, guardian_email } })`, where
`role` is `student` or `teacher` and `birth_date` is `YYYY-MM-DD`. A birth date
must be 10 to 100 years ago and a minor must carry `guardian_email`, or the
insert fails. Then update the rows the trigger created (`city`, `avatar_path`,
`phone`, `guardian_name`, `tagline`, `bio`, `hourly_rate_minor`,
`years_experience`, and `username` if the mock slug must win) and insert the
join rows. Find an existing auth user by email before creating one.

**Do not seed derived values.** No counts, no averages, no initials, no
formatted French date strings, no computed fee and net. If a value can be
computed, computing it wrong in the seed will mask bugs later. The rating
average is a good example of why: it currently disagrees with itself across four
files, reading 4.9, 4.8, 4.8 and 4.9.

**Convert every French display string to a real timestamp.** The mocks are full
of `"il y a 4 min"`, `"hier"`, `"fin trim."` and `"Actif maintenant"`. Pick an
anchor date and derive real timestamps that would render back to roughly those
strings. The message mocks already do something like this, anchored at
2026-09-02, and their helper module documents the format functions.

**Money becomes integer minor units with an explicit currency.** The mocks store
bare numbers in major units and never record a currency at all. See the currency
note in `00-CONTEXT.md` before writing a single amount. One mock value is a
float, the invoice line unit price, and it is the only float money in the
codebase.

**Generate real UUIDs.** Mock ids are hand-authored strings such as `app-01`,
`req-01`, `pmt-1` and `ts-sara`. Message ids are only unique **within a thread**,
so `m1` appears many times. Keep the human-facing document numbers, which look
deliberately business-meaningful: `TC-9182`, `FT-2026-0912`, `PO-2026-0089`.

The seed must be **idempotent**. Running it twice must not duplicate rows.

## A live bug to fix while you are here

`src/app/(app)/student/page.tsx:164` reads:

```js
status: s.joinable ? "upcoming" : "upcoming"
```

Both branches are identical, so the `joinable` flag never affects the derived
status. Decide what it was meant to do. Elsewhere in the codebase `joinable` is
computed as "starts within ten minutes, or is already live", which is probably
the intent.

## Definition of done

- Generated database types are committed, with the regeneration command documented.
- A written decision record resolves every row in the reconciliation table.
- Query functions exist for the identity domain and are used by at least one real page.
- The student profile page edits a `username` field with no backing column:
  `username` exists only on `teacher_profiles`. Drop that field from the student
  page or leave it disabled with a note. Do not move the column: Task 04 and the
  `teacher_public_profiles` view build on `teacher_profiles.username`, so
  relocating it is a later migration after 04 lands. Do not fake it in the
  query layer.
- The seed runs twice in a row without duplicating anything.
- No derived value is stored anywhere in the seed.
- `npx tsc --noEmit` is clean.

Report the reconciliation decisions. Those choices constrain every later task,
so they matter more than the code.

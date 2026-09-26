# Shared context — read this first

Every agent task in this folder assumes this document. Read it before your own
brief. Do not re-derive any of it; it has already been verified against the
running project.

## The product

`darso` is a French-language tutoring marketplace for Algeria. Students post
lesson requests and browse teachers; teachers apply, run sessions, and get paid.
The entire frontend already exists and is visually finished. **Your job is never
to redesign it.** You are replacing mock data with real data behind a UI that
already works.

## Stack, as actually installed

| Thing | Version | Note |
|---|---|---|
| Next.js | 16.3.4 | App Router, `src/app` |
| React | 19.2.8 | |
| Tailwind | 4 | via `@tailwindcss/postcss` |
| `@supabase/supabase-js` | 2.115.0 | |
| `@supabase/ssr` | 0.12.6 | |
| Postgres | 17.6 | Supabase project ref `kodqghpawpfvnchbngrn` |

## This is NOT the Next.js you know

The repo's `AGENTS.md` says this and it is not boilerplate. Read the relevant
guide in `node_modules/next/dist/docs/` before writing code. Two traps already
confirmed to bite:

1. **`middleware.ts` is dead.** Next 16 renamed the convention to `proxy.ts`,
   exporting a named `proxy` function. A file named `middleware.ts` silently
   never runs. Ours lives at `src/proxy.ts`.
2. **`cookies()` is async.** `const store = await cookies()`. Every call site
   must be awaited.

Relevant guides, all present locally:

- `01-app/02-guides/authentication.md`
- `01-app/01-getting-started/07-mutating-data.md` — Server Actions
- `01-app/02-guides/forms.md` — `useActionState` form patterns
- `01-app/03-api-reference/03-file-conventions/proxy.md`
- `01-app/03-api-reference/04-functions/cookies.md`

## Supabase wiring that already exists

Do not recreate these. Import them.

- `src/lib/supabase/client.ts` — `createClient()` for Client Components.
- `src/lib/supabase/server.ts` — `async createClient()` for Server Components,
  Server Actions and Route Handlers. **Must be awaited.**
- `src/lib/supabase/admin.ts` — `createAdminClient()`, service role, bypasses
  RLS. Throws if reached from the browser. Use only where the caller is already
  authorised: webhooks, admin review, payout jobs.
- `src/lib/supabase/env.ts` — environment reader with readable failures.
- `src/lib/supabase/database.types.ts` — generated from the live schema after
  Task 01 (`Database`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`,
  `Constants`). Not yet passed as the generic to the three client factories
  above, so they still return untyped clients. Never edit it by hand:
  regenerate with the Supabase MCP `generate_typescript_types` tool after
  every schema change.
- `src/proxy.ts` — refreshes the auth session on every request. It deliberately
  contains **no route guards yet**.

Environment lives in `.env.local`, gitignored. `.env.example` documents the
names.

## Database state after Task 01

Task 01 is **applied** to project `kodqghpawpfvnchbngrn` (2026-09-06) as five
migrations under `supabase/migrations/`, `20260906155856_identity_core`
through `20260906160528_composite_fk_indexes`, with the same versions in the
project's migration history. The decision record, including one deliberate
deviation from the Task 01 brief, is the header comment of `identity_core`.
Read the migrations for exact columns and policies. The facts every later task
depends on:

- `profiles` (`id` = `auth.users.id`, `role`, `full_name`, `city`,
  `avatar_path`, `ui_locale`) holds **public-safe columns only**. Teacher rows
  are readable by everyone, signed out included; a user additionally reads
  their own row, updates only their own row, and cannot change `role`. No client insert: the `auth.users` trigger creates it.
- `profiles_private` (`user_id`, `birth_date`, `phone`, `guardian_name`,
  `guardian_email`) is owner-only, never anon. **Birth date, phone and guardian
  live here, not on `profiles`.** A minor must have a `guardian_email`; birth
  dates must be 10 to 100 years ago.
- `teacher_profiles` (`username` unique slug, the `[username]` route
  parameter; `tagline`, `bio`, `hourly_rate_minor` integer centimes,
  `currency` char(3) default `DZD`, `years_experience`): public read, owner
  write, **no availability column**. `student_profiles` (`class_label`,
  `school`, `bio`, `level_id`): owner-only.
- `subjects`, `levels`, `languages` are seeded, read-only through the API.
  Reference them by `slug` (`mathematiques`, `lycee`, `francais`), never by id.
  `teacher_subjects` / `teacher_levels` / `teacher_languages`: public read,
  owner insert and delete. `student_subjects`: owner-only.
- `user_devices` is owner-only. `current` is not stored: it is
  `auth_session_id = ((select auth.jwt())->>'session_id')::uuid`.
  "Déconnecter" must delete the row **and** revoke the auth session through
  the admin API.
- The view `teacher_public_profiles` (`security_invoker`, readable signed out)
  is the source for `/teacher/preview/[username]`.
- Enums: `user_role` is exactly `student | teacher`; `verification_status`,
  `verification_step` and `device_kind` exist. No money, invoice, payout or
  notification enums yet.
- **Sign-up contract.** The AFTER INSERT trigger on `auth.users`
  (`private.handle_new_user()`) creates `profiles`, `profiles_private` and the
  role row. It reads `raw_user_meta_data` once: `full_name`, `role`
  (`student` | `teacher`, anything else becomes `student`), `birth_date`
  (`YYYY-MM-DD`) and `guardian_email` (dropped server-side when the birth date
  says 18 or over). Pass exactly those keys in
  `supabase.auth.signUp({ options: { data } })`. Never insert profile rows
  from the app; update them afterwards. A constraint failure makes the whole
  auth insert fail loudly, so validate first and produce the French messages
  in the action.

## Database conventions — non-negotiable

These come from the Supabase RLS guide and the database linter. Violating them
produces either a security hole or a table scan.

1. **RLS on every table in `public`, without exception.** A table in an exposed
   schema without RLS is world-readable.
2. **Wrap auth helpers in a subselect.** Write `(select auth.uid()) = user_id`,
   never `auth.uid() = user_id`. Unwrapped, the function runs once per row.
   Benchmarks show this alone taking a query from 179ms to 9ms, and far worse
   for `security definer` functions.
3. **Always name the role.** `create policy ... to authenticated using (...)`.
   Without a `TO` clause the policy is also evaluated for anonymous users.
4. **Index every column a policy references.** An unindexed policy column is the
   single largest RLS performance cost measured.
5. **Role checks go in a `security definer` function in a `private` schema**,
   never a join inside the policy. `private` must not be an exposed schema.
   Both exist since Task 01: schema `private` (not exposed; default `execute`
   is revoked from `public`, so every new function there needs an explicit
   `grant execute`) and `private.user_role()`, which returns `public.user_role`
   or null when signed out. Do not write another student/teacher helper; the
   one sanctioned sibling is Task 05's `private.is_reviewer()`, built the same
   way and backed by a reviewers table. Call it wrapped, exactly
   `(select private.user_role()) = 'teacher'`. It is a policy helper,
   not an API: it cannot be called through `supabase.rpc()`.
6. **Never read authorisation from `raw_user_meta_data`.** The user can edit it.
   Use `raw_app_meta_data`, or better, a real table.
   That table exists: `profiles.role`, immutable once the row exists. The one
   sanctioned reader of `raw_user_meta_data` is the sign-up trigger, which
   copies the whitelisted `role` key into `profiles.role` once at creation.
   That whitelist stays `student | teacher`; Task 05 adds reviewers as a
   separate table, never as a `user_role` member.
7. **`auth.uid()` is null when signed out**, and `null = x` is false, not an
   error. Failures are therefore silent. Write the null check explicitly.
8. **Money is integer minor units.** Store centimes, never floats. Store the
   currency code on the row. See the currency note below.
9. Timestamps are `timestamptz`, always. The mock data is full of pre-formatted
   French strings like `"il y a 2h"`. Those are presentation, not storage.

## Extensions

Installed already: `pgcrypto`, `uuid-ossp`, `pg_stat_statements`,
`supabase_vault`, and since Task 01 `citext` (schema `extensions`; declare the
type as `extensions.citext`, as `profiles_private.guardian_email` does).

Available but not yet enabled, likely wanted: `pg_trgm` for fuzzy search,
`unaccent` for accent-insensitive French search. Enable them in a migration if
you need them; do not assume they are on. Slugs do not need `unaccent`:
`private.slugify(text)` already folds French accents with `translate()`.

## Currency — a decision that is still open

The mock data throughout says `MAD`, references Casablanca, and lists CIH Bank
as a payout method. That is Morocco. But the intended payment gateway is
**Chargily, which is Algeria-only and settles in Algerian dinars**.

**Assume Algeria and `DZD` unless told otherwise.** Make this cheap to reverse:

- Never hardcode a currency symbol in the schema.
- Every money column gets a sibling `currency` column, `char(3)`, default `DZD`.
- Amounts are integers in centimes.

If your task does not touch money, you can ignore this entirely.

## Working agreement

- **Migrations, not dashboard clicks.** Every schema change is a numbered SQL
  file under `supabase/migrations/`. It must be idempotent-safe to review and
  must include its RLS policies in the same file as the table it creates.
  Apply it with the Supabase MCP `apply_migration` tool, which records a
  version timestamp, then rename the local file to `<version>_<name>.sql` so
  `supabase/migrations/` mirrors the project's history, and regenerate
  `src/lib/supabase/database.types.ts`. The five Task 01 migrations are
  applied: never edit or renumber them; add a new file.
- **Do not touch the visual design.** No changes to spacing, colour, typography,
  or component structure unless your brief explicitly says so. If wiring real
  data forces a layout change, flag it rather than redesigning.
- **The mock files are your specification.** `src/lib/mock/` encodes months of
  product decisions. Read the shape before you invent one. Where a mock field is
  clearly derived, such as a count or an average or a formatted date, do not
  store it; compute it.
  Where Task 01 already modelled a mock field, the migration's column is the
  contract: `hourly_rate_minor` plus `currency`, `avatar_path` (a storage path,
  not a URL), `class_label`, and `username` on `teacher_profiles` only. Ratings,
  review counts and `availabilityHours` have no column by design.
- **French is the product language.** All user-facing strings stay French. Match
  the tone already in the UI.
- **Report honestly.** If you could not finish something, say so plainly and say
  why. A half-wired feature reported as done is worse than an unstarted one.

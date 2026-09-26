# Task 01 — Database schema, identity core

**Read [`00-CONTEXT.md`](./00-CONTEXT.md) first.**
**Depends on:** nothing. This is the root task.
**Blocks:** every other task. Land this before anyone starts 02, 04 or 06.

> **Outcome (applied 2026-09-06).** This task is done. Do not re-run it; every
> further schema change is a new migration on top of these.
>
> - Applied to project `kodqghpawpfvnchbngrn` as `20260906155856_identity_core`,
>   `20260906155947_reference_vocabularies`, `20260906160019_user_devices`,
>   `20260906160039_new_user_bootstrap` and `20260906160528_composite_fk_indexes`,
>   with matching files under `supabase/migrations/`.
> - **Deliberate deviation:** birth date, phone, guardian name and guardian
>   email are not on `profiles`. They live in `profiles_private`, owner-only and
>   never anon, because RLS is row-level and teacher rows must be readable by
>   non-owners; a definer view was rejected (Supabase lint 0010 is an ERROR).
> - **Decision record:** the four inconsistencies and the deviation are in the
>   header of `identity_core`; the subject merge and seeds in
>   `reference_vocabularies`; the sign-up metadata contract for Task 02 in
>   `new_user_bootstrap`.
> - Also landed: `private.user_role()`, the `on_auth_user_created` trigger, the
>   `teacher_public_profiles` view, `citext`, and generated types at
>   `src/lib/supabase/database.types.ts`. `00-CONTEXT.md` summarises the schema.
> - Everything below is the original brief, kept as the historical spec. Where
>   it disagrees with this note or with `00-CONTEXT.md`, this note wins.

## Goal

Create the identity half of the schema: who a user is, which role they hold,
and what a teacher's professional profile contains. Plus the reference tables
that everything later joins against.

You are **not** modelling the marketplace here. No sessions, requests,
applications, payments, messages or reviews. Those come later and several are
blocked on decisions that have not been made.

## Read the mocks before you design

`src/lib/mock/` is the specification. It encodes real product decisions. Three
files matter most for this task: `teacher-profile.ts`, `teacher-verification.ts`,
and `teacher.ts`.

## Ground truth already extracted

A survey of every mock file has already been done. Use it; do not redo it.

### Almost nothing in the mocks is storable data

The mock objects are render payloads, not rows. These fields are **derived and
must not become columns**:

- Every count: `proposalsCount`, `reviewsCount`, `unread`, `count`
- Every average: `avgRating`, `rating`, `avg`, and the `breakdown` histogram
- Every `initials` field, every `fullName`, every `snippet`
- `mockTeacher.subjectSpecialty` and `.level`, which are two other fields joined with a middle dot
- All `dot` and `color` hex values, which are pure presentation
- `joinable`, `online`, `isNew`, `current`, `bucket`
- `fee` and `net`, both computed from gross at a 15 percent commission

### Most timestamps are not timestamps

Only these hold real dates: `Thread.lastMessageTime` and `Message.time` as full
ISO 8601, and `TeacherTransaction.date`, `TeacherReview.dateISO`,
`TeacherProfileMock.dob`, `IdentityData.dob` as ISO calendar dates.

Everything else is a pre-rendered French display string. `postedAgo` holds
`"il y a 4 min"`. `deadlineLabel` holds `"fin trim."`. `lastSeen` holds
`"en ligne"`. `TeacherSessionEntry.last` holds `"Actif maintenant"`. **Store a
`timestamptz` and format at render.** Never store the French string.

### Four data inconsistencies you must resolve, not copy

These are genuine contradictions in the mocks. Pick one answer for each and
write it down in the migration as a comment.

1. **Two competing subject vocabularies.** `AVAILABLE_SUBJECTS_TAUGHT` in
   `teacher-profile.ts` has ten entries including `Économie`. `mockSubjectPool`
   in `teacher-verification.ts` has eleven including `Espagnol` and `SES` but
   not `Économie`. A third, free-text vocabulary is used in
   `TeacherTransaction.subject`. Build **one `subjects` reference table** and
   make everything point at it.

2. **The average rating disagrees with itself** across four files: 4.9 in
   `mockTeacher`, 4.8 in `mockTeacherProfile`, 4.8 in `mockRatingSummary`, and
   `"4,9"` in `mockKpis`. This is proof it should be computed, never stored.

3. **A broken foreign key.** `mockPayoutSettings.defaultMethodId` is `"iban-1"`,
   but the only payout method ids that exist are `"pmt-1"` and `"pmt-2"`.

4. **`SessionRowProps.teacher` holds the student's name** on teacher pages. The
   field is named for one role and used for both. Do not carry this into the
   schema; model the two participants explicitly.

### Reference vocabularies, verbatim

```
AVAILABLE_LEVELS    = ["Collège", "Lycée", "Prépa", "Sup"]
AVAILABLE_LANGUAGES = ["Français", "Arabe", "Anglais", "Espagnol", "Amazigh"]
```

Nationalities in `teacher-verification.ts` include an `"Autre"` escape hatch,
which tells you the list is a convenience, not a constraint.

## What to build

### Enums

Create Postgres enums for the closed unions this task touches:

| Enum | Members, verbatim |
|---|---|
| user role | `student`, `teacher` |
| verification status | `pending`, `in-progress`, `approved`, `rejected` |
| verification step | `identity`, `diplomas`, `bio`, `final` |
| device kind | `desktop`, `mobile` |

Leave the money, invoice, payout and notification enums alone. They belong to
later tasks and several have unresolved spelling conflicts.

### Tables

**`profiles`** — one row per `auth.users` row, same primary key.
Holds identity common to both roles: full name, city, avatar path and
`ui_locale`. Birth date (a real `date`), phone, guardian name and guardian email
are **not** here: as applied, they live in `profiles_private`, owner-only (see
the Outcome note).

Two things the sign-up flow needs that the mocks do not model. The birth date
arrives as three separate strings and must be composed server-side. And the
minor threshold is `age < 18` with **no lower bound today**, so an age of 3
passes validation. Add a sane check constraint.

**`teacher_profiles`** — one row per teacher, foreign key to `profiles`.
Username slug, which is already the `[username]` route parameter and must be
unique. Tagline, bio, hourly rate, years of experience.

Note `availabilityHours` in the mock is the free-text string `"Lun-Ven 14-20h"`.
Do **not** store that. Real structured availability is Task 04's problem; leave
a column out rather than putting a string placeholder in.

**`student_profiles`** — one row per student. Thin for now: school level and
anything the student dashboard genuinely persists.

**Reference tables** — `subjects`, `levels`, `languages`. Seed them from the
verbatim vocabularies above, after resolving inconsistency 1.

**Join tables** — `teacher_subjects`, `teacher_levels`, `teacher_languages`.

**`user_devices`** — the profile pages list active devices with a "Déconnecter"
control that currently only mutates local React state. Model device, location,
last-seen `timestamptz`, and the `desktop` / `mobile` kind.

### The role helper

Role checks appear in nearly every future policy. Do it once, correctly:

- A `security definer` function in a **`private` schema**, never in `public`.
- `private` must not be an exposed schema.
- Call it wrapped: `(select private.user_role()) = 'teacher'`.

Benchmarks in the Supabase docs show an unwrapped `security definer` call in a
policy taking 178 seconds where the wrapped form takes 12 milliseconds. This is
not a micro-optimisation.

### Row level security

Every table. No exceptions. Re-read the rules in `00-CONTEXT.md` before writing
a single policy.

The one nuance specific to this task: **teacher profiles are publicly readable**
because `/teacher/preview/[username]` is a public shop window, but only the
owning teacher may write. Student profiles are not public. Do not accidentally
expose birth dates, phone numbers or guardian emails through the public teacher
read policy. Select the columns explicitly rather than exposing the whole row.

## How to apply migrations

Author real migration files under `supabase/migrations/`. The directory already
holds the five applied Task 01 migrations; add new files next to them. The Supabase CLI is available through `npx supabase` at
version 2.116.0, and `npx supabase migration new <name>` gives you a correctly
timestamped file.

Apply them with the Supabase MCP tool `apply_migration`, which records them in
the migration history. Do not apply schema changes by clicking in the dashboard,
and do not use `execute_sql` for DDL.

The project is `kodqghpawpfvnchbngrn`. It is no longer a blank slate: the five
migrations in the Outcome note above are applied and recorded in its migration
history. Any further change is a new migration on top of them; never edit or
re-apply the applied files.

## Extensions

`pgcrypto` and `uuid-ossp` are already installed. `citext` is enabled since Task
01 (schema `extensions`; declare columns as `extensions.citext`, as
`profiles_private.guardian_email` does) and is the right type for email columns. `unaccent` and `pg_trgm` are
available and will matter for accent-insensitive French search later; enable
them now only if you actually use them.

## Definition of done

- Migration files exist under `supabase/migrations/` and are applied.
- `list_tables` shows the tables; `get_advisors` with type `security` returns
  **no** RLS findings.
- `get_advisors` with type `performance` returns no unindexed-policy findings.
- Every policy names a role with `TO` and wraps its auth calls in a subselect.
- A teacher's public preview is readable while signed out; private columns are not.

Report the four inconsistencies above and which way you resolved each. That
decision record matters more than the DDL.

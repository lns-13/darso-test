# Task 04 — Teacher profile and onboarding

**Read [`00-CONTEXT.md`](./00-CONTEXT.md) first.**
**Depends on:** Task 01, applied 2026-09-06. Read the "Database state after
Task 01" section of `00-CONTEXT.md` and the header of
`supabase/migrations/20260906155856_identity_core.sql`. Row types are generated
at `src/lib/supabase/database.types.ts` (`Tables<'teacher_profiles'>` and so
on); regenerate it after any migration you add.
**Can run in parallel with:** Task 02, Task 06.
**Blocks:** Task 05, which attaches verification documents to these profiles.

## Goal

Make a teacher's professional profile real: editable by its owner, readable by
the public, and actually driving the public preview page.

## The public preview ignores its own route parameter

`src/app/(app)/teacher/preview/[username]/page.tsx:15` reads:

```ts
const p = mockTeacherProfile;
```

The `[username]` segment is captured by the router and then **never used**. Every
username renders the same hardcoded teacher. This page is the product's public
shop window, so wiring it to a real lookup by username slug is the centrepiece of
this task.

The slug is already modelled. `mockTeacherProfile.username` is
`"youssef-amrani"`, and the profile page builds its "view public profile" link
from it. Task 01 already made it unique (`teacher_profiles_username_key`,
format `^[a-z0-9]+(-[a-z0-9]+)*$`, 3 to 40 chars) and generates it from
`full_name` in the sign-up trigger (`youssef-amrani`, then
`youssef-amrani-3f9c` on collision). Do not re-implement either. The
`teacher_profiles` row therefore already exists when onboarding starts, with
`tagline`, `bio`, `hourly_rate_minor` and `years_experience` null: onboarding
**updates** that row, never inserts one. The owner may rename the slug; mirror
the format check client-side.

## Two teacher records are live at once

Every teacher page except one builds the shell user from `mockTeacher`, whose
`level` field reads `"Prof vérifié · Casablanca"`. The profile page alone uses
`mockTeacherProfile.tagline` instead. Same person, two identities, differing by
which page you are on.

`mockTeacher` is also derived rather than stored. Its `subjectSpecialty` is a
subject and a level list joined with a middle dot, and `discover/page.tsx:40`
literally splits that string back apart on the dot to recover a subject filter.
Do not reproduce that. Store the parts, compose for display.

If Task 03 is running concurrently it also touches the shell user. Coordinate,
or let Task 03 own the shell and confine yourself to profile content.

## What the profile holds

From `src/lib/mock/teacher-profile.ts`:

Names, username slug, email, phone, birth date as a real ISO date, city,
tagline, bio, subjects taught, levels taught, languages spoken, hourly rate,
years of experience, diploma highlights, and an avatar URL that is currently
`null`.

Where each lives after Task 01, split across three profile tables and three
join tables on purpose:
`profiles` holds `full_name` (one column, no first/last), `city` and
`avatar_path` (a storage object path, never a URL); `profiles_private` holds
`birth_date` and `phone`, owner-only, never joined into a public read;
`teacher_profiles` holds `username`, `tagline` (max 120), `bio` (max 2000),
`hourly_rate_minor` plus `currency` (integer centimes, default `DZD`: the mock's
220 per hour is stored as 22000; divide by 100 for display and print the row's
currency, not the hardcoded `MAD`), and `years_experience` (0 to 60);
`teacher_subjects`, `teacher_levels` and `teacher_languages` are keyed by
`subject_id`, `level_id` and `language_id` (public read, owner insert and
delete, no update: replace the set). Email is only on `auth.users` and changes
through `supabase.auth.updateUser`. Diploma highlights have no column; they
belong to Task 05.

Derived and **never stored**: `initials`, and both `rating` and `reviewsCount`,
which are aggregates. The name is not split: Task 01 stores a single
`profiles.full_name` column and the profile page already edits it as one field;
`initials` is computed from it at render. The rating in particular disagrees with itself across four files,
reading 4.9 in one and 4.8 in another, which is the clearest possible argument
for computing it.

## Availability is not modelled

`availabilityHours` is the free-text string `"Lun-Ven 14-20h"`. That is a label,
not a schedule. Nothing can be booked against it.

Real structured availability is required before sessions can exist, and it does
not exist anywhere in the mocks. There is a `WeekSlot` type on the teacher
sessions page, so start there rather than inventing a shape. Model recurring
weekly availability with a timezone. **Algeria does not observe daylight saving,
which simplifies this considerably, but store the timezone explicitly anyway.**

Task 01 deliberately created no availability column, so modelling it is a new
table in a new migration. Reuse `private.user_role()` in its policies rather
than writing a second helper, apply with the Supabase MCP `apply_migration`
tool, rename the file to the recorded version, and regenerate
`src/lib/supabase/database.types.ts`.

If you judge availability too large for this task, say so and stop at the
profile. Do not leave a free-text placeholder pretending to be a schedule.

## Two vocabularies for the same list

`AVAILABLE_SUBJECTS_TAUGHT` in `teacher-profile.ts` has ten entries including
`Économie`. `mockSubjectPool` in `teacher-verification.ts` has eleven including
`Espagnol` and `SES` but not `Économie`. A third free-text vocabulary appears in
transaction records.

Task 01 resolved this into one `subjects` reference table, seeded with eleven
rows: Mathématiques, Physique-Chimie, SVT, Français, Anglais, Arabe, Espagnol,
Histoire-Géo, Philosophie, Économie, Informatique. `SES` was folded into
`Économie`; `Maths` is an abbreviation, not a subject. Slugs are ASCII and
stable (`mathematiques`, `physique-chimie`, `histoire-geo`, `economie`);
reference slugs in code, never ids. The table is read-only through the API.
Use it. Do not add a third list.

Levels and languages are cleaner and were taken verbatim by Task 01 into
`levels` (slugs `college`, `lycee`, `prepa`, `sup`) and `languages`
(`francais`, `arabe`, `anglais`, `espagnol`, `amazigh`), both read-only through
the API. Read them from the tables instead of these constants:

```
AVAILABLE_LEVELS    = ["Collège", "Lycée", "Prépa", "Sup"]
AVAILABLE_LANGUAGES = ["Français", "Arabe", "Anglais", "Espagnol", "Amazigh"]
```

## Two known defects in the avatar path

**The avatar component cannot render an image.**
`src/components/app/avatar.tsx` is initials-only, with no image prop. Extend it.

**The image picker leaks object URLs.**
`src/components/library/img-ripple-effect.tsx:53` calls `URL.createObjectURL`
for a local preview and never revokes it. There is no cleanup effect. Fix it
while you are in there.

Both profile pages already show "Prêt à uploader" with the chosen filename, and
the real `File` object reaches component state and then goes nowhere. The picker
is genuinely wired; only the upload is missing.

Avatar **storage** belongs to Task 05, which owns buckets and policies.
Coordinate rather than creating a bucket here. The column already exists:
`profiles.avatar_path`, a nullable storage object path, never a URL, in the
owner update grant. Once the bucket exists the upload only has to write the
object path back to it. Extend `Avatar` with an image prop and derive the URL
from `avatar_path`.

## The profile page structure to preserve

The teacher profile page runs a section machine with eight sections synced to a
`?section=` query parameter: profile, teaching, account, security, payout,
notifications, public preview, and a danger zone. Keep that structure and the URL
sync intact.

Within it, several controls are handler-less today. The password change form
holds local state with no submit. The two-factor toggle is local state, and note
it defaults to **on** for teachers and **off** for students, which is probably
unintentional. The danger zone offers "deactivate" and "delete" with no handlers
at all.

Wire the ones that belong to profile identity. Writes go through RLS as the
owner and are column-limited by Task 01's grants: `profiles` allows
`full_name`, `city`, `avatar_path`, `ui_locale`; `profiles_private` allows
`birth_date`, `phone`, `guardian_name`, `guardian_email`; `teacher_profiles`
allows `username`, `tagline`, `bio`, `hourly_rate_minor`, `currency`,
`years_experience`; the join tables allow insert and delete only. Naming any
other column in an update is refused by the grant, a permission error rather
than an empty RLS result. **Leave account deletion alone**
unless you implement it properly, including what happens to that teacher's past
sessions, invoices and reviews. A delete button that half works is worse than one
that does nothing.

Payout settings render from `mockPayoutSettings`, which contains a **broken
foreign key**: its `defaultMethodId` is `"iban-1"` while the only method ids that
exist are `"pmt-1"` and `"pmt-2"`. Payouts are out of scope here, and the
underlying bank rails depend on the unresolved currency question. Leave that
section on mocks and say so.

## Definition of done

- A teacher can edit their profile and the changes persist.
- The public preview resolves a **real** teacher by the username slug in the URL.
  Read it through the `teacher_public_profiles` view (`security_invoker`,
  readable signed out) with the normal server client:
  `.from('teacher_public_profiles').select(...).eq('username', slug)`, then the
  join tables keyed by `teacher_id`. Do not use `createAdminClient()` here.
  Every view column is typed nullable in `database.types.ts`; narrow after the
  fetch.
- A nonexistent username renders a proper not-found, not the hardcoded teacher.
- Public preview exposes no private data. Birth date, phone and email must not leak.
- Subjects, levels and languages come from reference tables.
- Rating and review count are computed, never stored.
- The object URL leak is fixed.
- `npx tsc --noEmit` is clean.

Report whether you modelled availability or deferred it, and confirm exactly
which columns the public preview exposes. The Task 01 baseline is the
`teacher_public_profiles` view (`user_id`, `username`, `full_name`, `city`,
`avatar_path`, `tagline`, `bio`, `hourly_rate_minor`, `currency`,
`years_experience`, `created_at`) plus the public join tables; anon can also
read every `profiles` column of a teacher row and every `teacher_profiles`
column, none of which is private. That is a privacy boundary, so name any
column you add to it rather than saying it is fine.

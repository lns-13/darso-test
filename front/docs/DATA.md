# Working with data

Everything below assumes `.env.local` exists. Copy `.env.example` and fill it
in; it is gitignored and must stay that way, because it holds the service role
key.

## The one-command habits

```bash
npm run db:seed          # idempotent: safe to run any number of times
npm run db:seed:reset    # delete every seeded account first, then reseed
npm run db:verify        # 34 checks against the live policies
```

All three run on Node's native TypeScript loader, so there is no build step.
They need Node 20.6+ for `--env-file`; the project is developed on Node 24.

## Regenerating the database types

`src/lib/supabase/database.types.ts` is generated and must never be edited by
hand. **Regenerate it after every migration**, in the same change as the
migration, or the types silently describe a schema that no longer exists.

Use the Supabase MCP tool:

```
generate_typescript_types(project_id: "kodqghpawpfvnchbngrn")
```

and write the result over `src/lib/supabase/database.types.ts`, keeping the
header comment. This is an MCP action rather than a shell command because the
working agreement in `docs/agent-tasks/00-CONTEXT.md` applies migrations through
the same MCP server, so the two steps stay together.

With the Supabase CLI installed, the equivalent is:

```bash
npx supabase gen types typescript --project-id kodqghpawpfvnchbngrn \
  > src/lib/supabase/database.types.ts
```

The generated `Database` type is passed as the generic to all three client
factories in `src/lib/supabase/`, so a stale types file surfaces as a
compile error rather than a runtime surprise. `npx tsc --noEmit` is the check.

## Applying a migration

1. Write the SQL under `supabase/migrations/`, RLS policies in the same file as
   the table they protect.
2. Apply it with the MCP `apply_migration` tool, which records a version.
3. Rename the local file to `<version>_<name>.sql` so the directory mirrors the
   project's history.
4. Regenerate the types, as above.
5. Run `npm run db:verify`.

Never edit or renumber a migration that has been applied. Add a new one.

## The query layer

`src/lib/data/`, grouped by domain rather than by page.

| Module | Covers |
|---|---|
| `types.ts` | `DarsoClient`, and the `DataError` / `unwrap` convention |
| `reference.ts` | `subjects`, `levels`, `languages` — readable signed out |
| `profiles.ts` | `profiles` and `profiles_private` |
| `teachers.ts` | `teacher_profiles`, its join tables, the public view |
| `students.ts` | `student_profiles`, `student_subjects` |
| `devices.ts` | `user_devices`, and the derived "this device" flag |
| `derive.ts` | the values the schema deliberately does not store |
| `use-reference.ts` | the one client-only entry point |

Four rules hold throughout, and breaking any of them is a bug even when the
code appears to work.

**Pass a client, do not create one.** Every function takes a
`SupabaseClient<Database>` as its first argument. That keeps `next/headers` out
of client bundles, makes the privilege level visible at the call site, and lets
the scripts exercise the same code path the app uses.

**Filter explicitly, even when a policy already does.** Write the equivalent of
`where user_id = $1` in the query as well as in the policy. The RLS performance
guide measures 171ms against 9ms for exactly this, because the duplicated
predicate is what lets Postgres use the index.

**Never `select *` under a filtering policy.** Column lists are named
constants. Besides the plan, an explicit list means a column added to a table
later cannot silently widen a payload already going to a browser.

**Never join `profiles_private` into a public read.** It is the only table that
can leak a birth date, a phone number or a guardian's email address. Public
teacher data comes from the `teacher_public_profiles` view, whose columns are
fixed.

## What the seed creates

24 accounts: 10 teachers and 14 students, drawn from the names in
`src/lib/mock/`. Every one is created through `auth.admin.createUser` so the
`on_auth_user_created` trigger builds the profile rows; the seed then updates
them. That is what makes a second run a no-op.

Sign in as any of them with the password in `scripts/seed-data.ts`:

```
youssef-amrani@darso.test     teacher, Mathématiques and Physique-Chimie
sara-bencheikh@darso.test     student, Terminale S, 18
omar-zeroual@darso.test       student, Seconde, 15 — exercises the minor gate
```

The seed loads the **identity domain only**. Sessions, applications, requests,
transactions, invoices, payouts, reviews, messages and notifications have no
tables yet, so none of that mock content is loaded. The shapes they must take
are recorded in [`decisions/06-data-reconciliation.md`](./decisions/06-data-reconciliation.md).

## Why `db:verify` exists

An RLS mistake does not crash. A policy that fails to deny returns rows; a
policy that over-denies returns an empty array. Both look like working code
from the outside, so most of the checks assert the **deny** path explicitly.

Every signed-in check runs through the anon key carrying a real session, so the
policies exercised are exactly the ones that govern the app. Nothing uses the
service role except the fixture lookup.

Run it after any migration, any policy edit, and any change to the query layer.

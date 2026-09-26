# Foundation agent tasks

Six briefs that take `darso` from a mock-data frontend to a real Supabase
backend. Each file is a self-contained prompt: hand one to an agent as-is.

**Every brief assumes [`00-CONTEXT.md`](./00-CONTEXT.md).** Tell the agent to
read that first. It carries the stack facts, the Next.js 16 traps, the RLS rules,
and the currency decision, so the individual briefs do not repeat them.

## Before you run anything in parallel

**Give every concurrent agent its own git worktree.** One agent per working
tree, no exceptions.

This is not a style preference. On 2026-09-07 four sessions ran concurrently in
a single shared tree. At 10:45 one git command wiped two of them at once. The
Task 02 agent lost eight tracked files plus three directories; the Task 04 agent
lost four tracked files plus ten untracked ones. None of it was recoverable:
nothing had been staged, so the stash was empty and `git fsck` found nothing
dangling. Hours of work from two agents, gone in one command.

The confirmed cause was `git checkout --` with explicit pathspecs, followed by
`rm -rf`. **Neither writes a reflog entry.** The reflog did show a branch switch
fifteen minutes earlier, which looked like the obvious culprit and was not: both
branches pointed at the same commit, so the switch changed nothing on disk, and
a checkout does not delete untracked files anyway. When a shared tree loses
work, expect the reflog to be silent and do not trust the first plausible entry
in it.

**Why it happened is the part that generalises.** The agent that ran those
commands was not being careless. It had a workflow running whose subagents were
instructed not to write files. It then watched files appear across two other
tasks' territory and a migration land on the live database, concluded its own
subagents had gone rogue, and reverted what it read as their damage. It had no
way to know three other sessions shared the checkout.

That is the real hazard of a shared tree, and no ownership table fixes it: **a
well-behaved agent cannot distinguish another session's legitimate work from its
own tooling malfunctioning.** Cleaning up what looks like your own mess is
correct behaviour, and in a shared tree it destroys other people's work. Isolate
the trees and the ambiguity disappears.

The work was recovered only because that agent archived everything before
deleting it. Do not count on that next time.

A shared tree has one checkout. **Any branch switch reverts every agent's
tracked edits, and any clean deletes every agent's new files**, no matter how
carefully the tasks divide up file ownership. The per-task ownership boundaries
below prevent two agents editing the same file. They do nothing against a git
command that rewrites the whole tree.

Two rules that follow:

- One worktree per concurrent agent, each on its own branch. Merge when a task
  finishes.
- No agent runs `checkout`, `restore`, `clean` or `stash` in a tree it shares.
  If sharing is unavoidable, commit early and often, because uncommitted work is
  one command away from gone.

## The tasks

| # | Brief | Produces |
|---|---|---|
| 01 | [Database schema — identity](./01-database-schema-identity.md) | Core tables, enums, RLS, role helper |
| 02 | [Auth flows](./02-auth-flows.md) | Sign-up, sign-in, reset, email confirm |
| 03 | [Session and route protection](./03-session-and-route-protection.md) | Proxy guards, role routing, sign-out |
| 04 | [Teacher profile and onboarding](./04-teacher-profile-onboarding.md) | Teacher profile, subjects, availability |
| 05 | [Storage and verification](./05-storage-and-verification.md) | Buckets, uploads, verification review |
| 06 | [Data access and seed](./06-data-access-and-seed.md) | Generated types, query layer, seed |

## Order

Task 01 is a hard prerequisite for everything. Nothing else can start until the
schema exists. It does now: Task 01 is **applied** (2026-09-06) as five
migrations under `supabase/migrations/`, `20260906155856_identity_core` through
`20260906160528_composite_fk_indexes`. The decision record, including the
deliberate move of birth date, phone and guardian fields into an owner-only
`profiles_private` table instead of `profiles`, is the header comment of
`20260906155856_identity_core.sql`; the sign-up metadata contract Task 02 must
honour is the header of `20260906160039_new_user_bootstrap.sql`. All of it is committed on the
`foundation/task-01-identity-schema` branch; merge that before fanning out.

```
01  database schema
     |
     +---> 02  auth flows -----> 03  session + route protection
     |
     +---> 04  teacher profile -+
     |                          +--> 05  storage + verification
     +---> 06  types + seed ----+
```

After 01 lands, tasks **02, 04 and 06 can run in parallel** without touching each
other's files. Task 03 needs 02 finished, because guards are meaningless before
sign-in works. Task 05 needs 04 because its avatar upload plugs into the
profile pages and `src/components/app/avatar.tsx` that Task 04 owns, and 06
for the typed query layer; the `teacher_profiles` row itself already exists
from the Task 01 sign-up trigger.

Running 02, 04 and 06 concurrently is the intended path. They were scoped to
avoid file collisions on purpose.

**One thing to pull forward.** Task 06 opens by generating TypeScript types from
the schema, but tasks 02 and 04 both want those types. Generate them yourself
immediately after 01 lands, using the Supabase `generate_typescript_types` tool,
and commit the result before fanning out. It takes a minute and saves the other
two agents from either guessing at row shapes or writing their own.

**Status: generated and committed, not yet wired.**
`src/lib/supabase/database.types.ts` exists, but `client.ts` / `server.ts` /
`admin.ts` still create untyped clients. **Task 06 owns adding the
`<Database>` generic to those three files**; 02, 03 and 04 must not edit them
and type their own results locally with `Tables<'...'>` until then.

**One boundary that matters.** Task 04 owns
`src/components/app/avatar.tsx`, which today renders initials only and needs an
image prop. Tasks 03 and 05 both consume avatars but must not edit that
component. It is the one file where two agents could collide destructively.

## What "foundation" excludes

These briefs deliberately stop before the marketplace itself. Not included:
requests and applications, session booking and video, payments and Chargily,
payouts, messaging realtime, reviews, stats, disputes, or the agency surface.

Those depend on decisions that should be made after auth and profiles are real,
and at least one of them, payments, is still blocked on the currency question in
`00-CONTEXT.md`.

## Two rules worth repeating

**The frontend is finished. Do not redesign it.** Every brief is about replacing
mock data behind UI that already works. A brief that tempts you into restyling a
component has been misread.

**The mock files are the specification.** `src/lib/mock/` encodes real product
decisions about what a teacher, a session, and an invoice are. Read the shape
before inventing one. For the identity domain the applied schema now outranks
the mocks where they disagree: subjects are the eleven-row `subjects` table
(`SES` folded into `Économie`, `Maths` is `Mathématiques`), ratings and
`availabilityHours` are never stored, `username` exists only on
`teacher_profiles`, and birth date, phone and guardian fields live in
`profiles_private`. The reasoning is in the migration headers.

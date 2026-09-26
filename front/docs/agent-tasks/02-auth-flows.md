# Task 02 — Auth flows

**Read [`00-CONTEXT.md`](./00-CONTEXT.md) first.**
**Depends on:** Task 01, applied 2026-09-06. Read the "Database state after
Task 01" section of `00-CONTEXT.md` and the header of
`supabase/migrations/20260906160039_new_user_bootstrap.sql` before starting.
**Can run in parallel with:** Task 04, Task 06.

## Goal

Replace the entirely-faked auth with real Supabase auth, behind the existing UI.
Every screen already exists and looks finished. You are filling in the middle.

## What is fake right now

All of it. Verified line by line.

| File | Line | What it fakes |
|---|---|---|
| `sign-in-form.tsx` | 42 | `setTimeout(700)` standing in for a network call |
| `sign-in-form.tsx` | 45 | `setMagicSent(true)` with no email sent |
| `sign-in-form.tsx` | 49-50 | a console log, then an unconditional push to `/student` |
| `sign-up-flow.tsx` | 127, 133 | `setTimeout(350)` between steps |
| `sign-up-flow.tsx` | 135 | push to `/student`, no account created, identity discarded |
| `forgot-password-form.tsx` | 32-33 | `setTimeout(700)` then a "sent" view, no email |
| `step-teacher-next.tsx` | 75 | push to `/teacher`, no API call |
| `social-button.tsx` | 59-60 | a console log, then a spinner that resolves to nothing |

Consequences worth naming plainly. **Any eight-character password signs you in.**
A teacher who signs in always lands on the student dashboard. Sign-up never
creates a user.

## Five traps specific to this codebase

Each of these will cost you an hour if you find it the hard way.

**1. There is no callback route, and no route handlers exist at all.**
No `route.ts` file exists anywhere under `src/app`. You must create
`src/app/auth/callback/route.ts` to exchange the code for a session. Magic link,
password reset and any future social login all land there.

**2. The success animation is decoupled from submission.**
In `src/components/library/stateful-button.tsx` the click handler runs its
loading animation, then awaits an optional `onClick` prop, then runs its success
animation. On sign-in and forgot-password the button is a bare submit with **no
`onClick` prop at all**, so the awaited call is undefined and the green
checkmark fires unconditionally. **Today it shows success even when validation
fails.** Wiring a real action that can fail makes this actively deceptive. Drive
the button from the action's pending and error state instead of its internal
timer.

**3. The sign-up identity step has nowhere to show a server error.**
Its button stays disabled until the form is locally valid, which makes the
`setErrors` call at line 124 effectively unreachable. So "this email is already
registered" coming back from Supabase has no render slot. You must add one.
`sign-in-form.tsx` already declares an unused `errors.form` key with styling at
line 227. Copy that pattern rather than inventing a new one.

**4. Going back a step preserves collected data.**
The back handler only decrements an index; identity and role live in the parent
component. So a user can reach the role step and return. **Do not create the
Supabase user until the flow terminates.** The alternative, idempotent
re-entry, is gone: the Task 01 trigger fixes `profiles.role` from the sign-up
metadata at creation and the client cannot change it afterwards, so a user
created at the identity step is a student for good. Call `signUp` once, with
`role` in the metadata.

**5. The guardian email is never cleared.**
If someone enters a minor's birth date, fills the guardian email, then corrects
the birth date to an adult one, the stale value survives in state and gets
submitted. Clear it client-side, and ignore it server-side when the computed age
is 18 or over. Do not trust the client on this.

## The contract the UI already expects

Honour it exactly. Do not rename fields or restyle errors.

**The email regex is duplicated in three files**, byte-identical in each:

```js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

It sits at `sign-in-form.tsx:11`, `sign-up-flow.tsx:38` and
`forgot-password-form.tsx:10`. Lift it into one shared module and import it in
all three. Mirror it server-side and never trust the client copy.

**The identity payload**, from `sign-up-flow.tsx:17-25`:

```ts
type IdentityState = {
  fullName: string; email: string; password: string;
  dobD: string; dobM: string; dobY: string; parentEmail: string;
};
```

Birth date is three separate strings, never a date. Compose it server-side as
`${dobY}-${dobM.padStart(2,"0")}-${dobD.padStart(2,"0")}`. That string is
the `birth_date` key of the sign-up metadata (contract below); the trigger
parses it into `profiles_private.birth_date`. You never write that column
yourself at sign-up.

**Roles** are exactly `student` and `teacher`, with `null` a valid unselected
third state that blocks the button.

**Validation messages, verbatim.** These are what the UI shows today. Reuse them
so a server-side failure reads identically to a client-side one.

| Condition | Message |
|---|---|
| empty email | `Entrez votre email.` |
| bad email format | `Format d'email invalide.` |
| empty password | `Entrez votre mot de passe.` |
| password under 8 | `8 caractères minimum.` |
| name under 2 characters | `Entrez au moins 2 caractères.` |
| unparseable birth date | `Date de naissance invalide.` |
| minor without guardian email | `Requis pour les moins de 18 ans.` |

Password policy today is **length eight, nothing else**. No case, digit or
symbol rule. Match that in the Supabase Auth settings so the two cannot
disagree and produce an error the UI has no string for.

## Age and minors

The age helper at `sign-up-flow.tsx:40-62` rejects years that are not exactly
four digits, impossible calendar dates such as 31 February, and future dates.
The minor threshold is under 18.

Two gaps to close server-side. There is **no lower bound**, so an age of 3 or
120 passes. And the computed age is never stored, only the three raw strings.
The database already closes both gaps: `profiles_private.birth_date`, written
by the sign-up trigger, carries a plausibility check (10 to 100 years ago) and
a check that anyone under 18 has a `guardian_email`. Your job is to enforce the
same two rules **before** calling `signUp`: a violated constraint makes the
`auth.users` insert itself fail with a raw Postgres error, no account exists,
and the UI has no string for it. Use `Date de naissance invalide.` for the age
range and `Requis pour les moins de 18 ans.` for the guardian rule.
A tutoring product with real minors on it needs the guardian relationship
recorded deliberately, not as an incidental form field.

## What to build

1. **A shared validation module.** One email regex, one password rule, one age
   computation, importable from both client and server. Note that `zod` is
   **not installed**. Either add it or hand-roll validation that produces the
   exact messages above.

2. **Server Actions**, in a file with `"use server"` at the top. The signature
   is `(prevState, formData)` because the forms will consume them through
   `useActionState`, which returns a tuple of state, action and pending. See
   `node_modules/next/dist/docs/01-app/02-guides/forms.md`.
   Build `signUp`, `signIn`, `signInWithOtp` for the magic-link mode the
   segmented control already offers, `requestPasswordReset`, `updatePassword`
   and `signOut`.

   **How `signUp` creates the profile rows.** Do **not** insert into
   `profiles`, `profiles_private`, `teacher_profiles` or `student_profiles`
   yourself: `profiles` has no client insert policy, and the
   `on_auth_user_created` trigger creates all of them from the sign-up
   metadata. It reads `raw_user_meta_data` once, so pass exactly these keys:

   ```ts
   supabase.auth.signUp({
     email, password,
     options: { data: {
       full_name: fullName,          // fallback: email local part
       role,                         // "student" | "teacher"; anything else -> student
       birth_date: composedDob,      // "YYYY-MM-DD"; unparseable -> null
       guardian_email: parentEmail,  // dropped server-side when 18 or over
     } },
   });
   ```

   Omit `role` and every account becomes a student, permanently. `phone` and
   `guardian_name` are later updates on `profiles_private` from a signed-in
   screen, never part of sign-up. A teacher gets a `teacher_profiles` row with
   a generated `username` (`youssef-amrani`, hex suffix on collision).

   **`signInWithOtp` must not create accounts.** Pass
   `options: { shouldCreateUser: false }`. The default creates an `auth.users`
   row for an unknown email, and the trigger then turns it into a student
   profile named after the email local part, with no birth date. Surface the
   failure through the existing `errors.form` slot.

3. **`src/app/auth/callback/route.ts`** for the code exchange, then a
   role-correct redirect.

4. **A reset-password landing page.** The forgot-password form sends a link but
   **there is nowhere for that link to land**. This page is missing entirely and
   is not optional.

5. **Wire the four existing forms** to the actions, removing every fake timeout
   and console log in the table above.

6. **Role-correct redirects.** Teachers to `/teacher`, students to `/student`.
   Sign-in hardcodes the student route for everyone today. Read the role from
   `profiles.role` (`from('profiles').select('role').eq('id', user.id)`; a
   signed-in user can always read their own row), never from
   `user.user_metadata.role`, which the user can rewrite. The
   `private.user_role()` helper is not callable through `supabase.rpc()`.

7. **An email-confirmation state.** The project has auto-confirm **off**, so
   sign-up returns a user with no session and the person must confirm by email.
   The UI has no screen for this. Add one, matching the existing "magic link
   sent" view pattern rather than inventing a new layout.

## Out of scope

Do not build route guards. That is Task 03. Do not touch `src/proxy.ts`.

**Do not wire the Google and Apple buttons.** No social provider is enabled on
the Supabase project; the auth settings confirm every one of them is off. Leave
them visibly disabled with a short French note rather than leaving a button that
spins and does nothing.

## Definition of done

- A real account can be created, confirmed by email, signed out and signed back in.
- After sign-up, `profiles`, `profiles_private` and exactly one of
  `teacher_profiles` / `student_profiles` exist for the user, created by the
  trigger and not by your code. `profiles.role` matches the chosen role, a
  teacher has a generated `username`, a minor's `guardian_email` is stored and
  an adult's is null.
- A wrong password shows a French error, and the success checkmark does not fire.
- A teacher lands on the teacher dashboard, a student on the student dashboard.
- The full password-reset round trip works end to end.
- `npx tsc --noEmit` is clean.
- No fake timeout and no console-log submission remains under `src/app/(auth)/`.

Report which of the five traps you hit and how you resolved each.

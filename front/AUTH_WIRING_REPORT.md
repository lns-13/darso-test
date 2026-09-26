# Task 02 — Auth flows, wiring report

Every screen listed in the brief now talks to Supabase. No `setTimeout` stand-in
and no console-log submission remains anywhere under `src/app/(auth)/`.

## The five traps

**1. No callback route, and no route handlers at all.**
Hit as described. `src/app/auth/callback/route.ts` is the first route handler in
the app. It accepts both link shapes rather than only the one the current email
templates produce: `?code=` for the PKCE flow that `@supabase/ssr` uses by
default, and `?token_hash=&type=` for when the templates are switched to
`{{ .TokenHash }}`. Supporting both cost four lines and means the templates can
change later without breaking confirmation. It also handles the `?error=` that
Supabase appends when it rejects a link before the app ever sees it. Every
failure path redirects to a form with a short opaque code, which the page turns
into a French sentence.

**2. The success animation is decoupled from submission.**
Hit, and it was worse than an animation bug: on a bare submit button the awaited
`onClick` was `undefined`, so the green checkmark fired on validation failures
too. `StatefulButton` now takes an optional `status` prop. Left off, it behaves
exactly as before, which matters because sixteen other files use it. The auth
forms pass `status={pending ? "loading" : "idle"}`, driven by the pending flag
from `useActionState`. The checkmark cannot fire on a failure because nothing
ever sets it to success: on every success path the view is replaced, by a
redirect or by a confirmation card. Two of the passing checks assert exactly
this, one on a validation failure and one on a wrong password.

**3. The sign-up identity step had nowhere to show a server error.**
Hit. The slot is now under the CTA, copied from the styling `sign-in-form.tsx`
already declared but never used. It carries "this address is already
registered", which needed a second fix to be reachable at all: with email
confirmations on, Supabase does not return an error for a registered address. It
returns a decoy user with an empty `identities` array. The action checks for
that and maps it to the French string.

**4. Going back a step preserves collected data.**
Hit. `signUp` is called once, on leaving the role step, with the role in the
metadata. One consequence the brief did not mention: the back button stays
available on the teacher's third step, so after the account existed a person
could walk back and submit again, earning only an "already used" error against
their own new account. The back button is now hidden once the account exists,
for the same reason the brief gives — the role is fixed at creation and cannot
be changed afterwards.

**5. The guardian email is never cleared.**
Hit, and closed on both sides. Client-side it clears the moment the birth date
says 18 or over, but only then: clearing whenever the age is not a minor would
wipe what someone just typed while their date is still half-entered.
Server-side the value is dropped whenever the computed age is 18 or over,
whatever the form submitted. The trigger drops it a third time. A check asserts
the value is genuinely cleared and not merely hidden, by returning the date to a
minor one and reading the field back empty.

## Two things the brief did not list

**Supabase rejects some addresses itself**, `@example.com` among them, with
`email_address_invalid`. That fell through to the generic "une erreur est
survenue". It now maps to `Format d'email invalide.`, a string the design
already has.

**"Se souvenir de moi" is not wired**, deliberately. `@supabase/ssr` always
writes persistent auth cookies, and the session refresh in `src/proxy.ts` would
restore the long max-age on the first rotation regardless of what the sign-in
action did. Honouring the checkbox means changing how that file writes cookies,
and the brief says not to touch it. There is a comment at the checkbox saying
so. It belongs to Task 03.

## Definition of done

| Requirement | State |
|---|---|
| Account created, confirmed, signed out, signed back in | Verified, except the mail send itself |
| Trigger creates `profiles`, `profiles_private` and exactly one role row | Verified |
| `profiles.role` matches the chosen role, teacher gets a username | Verified |
| Minor's guardian email stored, adult's null | Verified |
| Wrong password shows French, checkmark does not fire | Verified |
| Teacher lands on `/teacher`, student on `/student` | Verified |
| Password reset round trip | Verified end to end |
| `npx tsc --noEmit` clean | Yes |
| No fake timeout or console-log submission under `src/app/(auth)/` | Yes |

`node scripts/auth-e2e.mjs` runs 46 checks against a real browser and the real
project. All pass. It creates its own throwaway users and deletes them at the
end.

## What is not verified, and why

**One check is skipped: sign-up through the form.** Supabase's built-in mail
service is capped at roughly two messages an hour, and the cap was already spent
when the suite ran. The suite records the French message the user would see,
`Trop de tentatives. Réessayez dans quelques minutes.`, and continues. The rest
of that path is covered without sending anything: the metadata contract is
asserted against a user created with exactly the keys the action sends, and the
confirmation round trip is driven through `/auth/callback` with a link minted by
`generateLink`, which does not mail. Re-run the suite an hour later, or point
the project at real SMTP, and the skip becomes a pass.

**PKCE links only work in the browser that asked for them.** The code verifier
lives in a cookie set when the flow starts. Opening a confirmation link on a
different device fails, cleanly and in French, rather than silently. Switching
the email templates to `{{ .TokenHash }}` removes the limitation, and the
callback already handles that shape.

## Dashboard settings to check

- **Redirect URLs.** `NEXT_PUBLIC_SITE_URL` is documented in `.env.example` and
  optional in development. Whatever it is set to must be allowed under
  Authentication → URL Configuration, or Supabase silently falls back to the
  site URL and the code never reaches `/auth/callback`.
- **Minimum password length** must stay at or below 8. Above it, Supabase
  rejects a password the UI has already accepted, with an English string the
  design has no slot for.

## Out of scope, as instructed

No route guards, `src/proxy.ts` untouched. The Google and Apple buttons are
visibly disabled with a one-line French note, because no provider is enabled on
the project. There is no sign-out control anywhere in the signed-in design —
the only `LogOut` icon disconnects *other* devices — so the `signOut` action is
reachable through `POST /auth/sign-out`, which is origin-checked and refuses
GET. A form can post to it the moment a control is designed.

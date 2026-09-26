# Task 03 — Session, route protection, and current user

**Read [`00-CONTEXT.md`](./00-CONTEXT.md) first.**
**Depends on:** Task 02. Guards are meaningless before sign-in works.

## Goal

Three things. Stop unauthenticated people reaching the app. Replace the
hardcoded mock user with the real session everywhere. Give people a way to sign
out, which the product currently does not have at all.

## The single most important fact

**There is no sign-out anywhere in this application.** The `LogOut` icon appears
in exactly two files, and in both it is the "disconnect other devices" button
inside the security settings, not an actual sign-out.

Specifically, there is no sign-out in the sidebar, where the user card at
`sidebar.tsx:88-113` is a static `div` with no click handler. None in the mobile
nav drawer, whose user card is equally static. None in the mobile header, where
the avatar is a plain link to the profile page. None in either navigation
config. And no route handler or server action for it.

A user who signs in currently cannot sign out. Fix that first.

## Where the guard goes

`src/app/(app)/layout.tsx` is a pure passthrough that returns its children with
no auth check, no session fetch and no role resolution. **This is your insertion
point** for a server-side session read.

`src/proxy.ts` is the other half. Its own docstring records that route
protection was deliberately deferred until sign-in landed. Sign-in has now
landed, so add the redirect. Two cautions:

- The proxy **short-circuits and returns early when the environment variables
  are missing**, so the app still boots unconfigured. Keep that property. Do not
  make a missing variable produce an infinite redirect loop.
- Its matcher already excludes static assets and images. Do not widen it.

Guard in the proxy for the cheap redirect, and verify again in the layout or the
page for the real decision. A proxy alone is not an authorisation boundary.

## Role detection is currently a URL sniff

`src/components/app/mobile-header.tsx:22-25` decides the role like this:

```ts
const role = pathname?.startsWith("/teacher") ? "teacher" : "student";
```

Everything that is not a teacher path is treated as a student. That drives the
home link, the profile link and a student-only shortcut. **Replace this with the
real role from `profiles.role`.** The session's `user.user_metadata.role` is
the user-editable sign-up input and must never be read. Read the caller's own
row server-side; `private.user_role()` is a policy helper in a non-exposed
schema and is not callable from the app. A teacher visiting a shared route
currently gets student navigation.

Related: `AppShell` takes **no role prop at all**. Its user type is
`{ fullName, level?, initials }` with no role field. Role is implicit in which
navigation constant each page happened to import.

## The mock user is duplicated in twenty-nine places

This is the bulk of the mechanical work.

**Student side has no mock module at all.** The same literal, Sara Bencheikh
with initials SB, is re-declared in **fourteen separate page files**: the
dashboard, discover, favorites, sessions, payments, reviews, messages,
notifications, notification settings, help, help contact, help dispute, and
profile. The profile file holds the richest version, including a birth date and
a computed age. It also carries `username: "sara-b"` and an editable username
field, but no student username column exists (only
`teacher_profiles.username`): leave that field unbacked with a note rather
than inventing a source. Task 06 drops or disables it; the column is not
moving while Task 04 builds on `teacher_profiles.username`.

**Teacher side reads `mockTeacher`** in fifteen call sites. Note that
`teacher/discover/page.tsx` has **two separate shell instances in one file**, at
lines 449 and 538, which is easy to miss.

**Two different teacher records are live at once.** Every teacher page uses
`mockTeacher.level`, which reads `"Prof vérifié · Casablanca"`. The profile page
alone uses `mockTeacherProfile.tagline` instead. Same person, two identities,
depending on the page.

Introduce one `getCurrentUser()` for the server and one `useCurrentUser()` for
the client, then delete all twenty-nine literals. Both read `auth.getUser()`
and then the caller's own `profiles` row (`id`, `role`, `full_name`, `city`,
`avatar_path`, `ui_locale`; own-row select is allowed). Profile rows are
created by the `on_auth_user_created` trigger at sign-up: never insert one
here. Do not add the `Database` generic to `client.ts` / `server.ts` /
`admin.ts`; Task 06 owns that. If the clients are still untyped when you get
here, type your own results locally with `Tables<'profiles'>` from
`src/lib/supabase/database.types.ts` and leave a note. The prop plumbing through
`AppShell`, `Sidebar`, `MobileHeader` and `MobileNavDrawer` is **already
correct**; only the sources are mocks. This is a mechanical edit repeated many
times, not a redesign.

## Four things that will block you

**1. The avatar component cannot display an image.**
`src/components/app/avatar.tsx` renders initials only. There is no `src` or
`avatarUrl` prop. Real avatars require extending it. Both profile mocks already
carry `avatarUrl: null`, but the real column is `profiles.avatar_path`, a
storage object path, never a URL. Build the public URL at render time; the
bucket and its policies are Task 05's.

**2. Navigation badge counts are hardcoded literals.**
`src/lib/nav.ts` sets the student messages badge to 2 and the notifications
badge to 4, as constants in a static module. They cannot reflect a real unread
count without either making these functions or moving badges to props. Decide
which, and say so; do not leave a real session showing a fake count of 2.

**3. The device session lists have two different shapes, one unusable.**
The teacher version is clean: a `kind` field discriminating `desktop` from
`mobile`, resolved to an icon at render. The student version **embeds a Lucide
component reference directly in the data**, which cannot come off the wire.
Standardise on the teacher shape, mapped to `user_devices` from Task 01:
`device` is `device_label`, `where` is `city` plus `country_code` joined at
render, `last` is `last_seen_at` (timestamptz, format at render), `kind` is
the `device_kind` enum. `current` is not stored: it is true when
`auth_session_id` equals the `session_id` claim of the caller's JWT.

Both lists currently revoke by filtering local state, so a "disconnected" device
returns on refresh. Back them with `user_devices`. Nothing populates that
table: on each sign-in insert a row (owner insert policy) keyed by
`auth_session_id` = the JWT `session_id` claim, and bump `last_seen_at` on
later requests. "Déconnecter" must delete the row **and** revoke that auth
session through the service-role client (`createAdminClient().auth.admin`);
deleting the row alone does not sign the device out.

**4. The minor gate reads the mock birth date.**
The student profile page shows a parental section only when the age is under 18,
filters it from the menu otherwise, and snaps back if someone deep-links to it.
That gate must read the real birth date from `profiles_private.birth_date`
(owner-only; use the server client), never from `user.user_metadata.birth_date`,
which is the user-editable sign-up copy and therefore trivially bypassable.
`birth_date` can be null when it was unparseable at sign-up, so decide what null
means for the gate. The parental section's fields are
`profiles_private.guardian_name` and `guardian_email`.

## What to build

1. **A sign-out action**, plus controls in the sidebar user card and the mobile
   nav drawer. Both are static markup today and need to become interactive.
   Task 02 ships a `signOut` server action; reuse it rather than adding a
   second one. Before `auth.signOut()`, delete the caller's own `user_devices`
   row (`auth_session_id` = the current JWT `session_id`); nothing cascades it
   and the "Sessions actives" list would otherwise keep a dead device.
2. **Route guards**, in the proxy for the redirect and in the app layout for the
   real check.
3. **Role-based access.** A student must not reach teacher routes, and the
   reverse. Redirect rather than error.
4. **`getCurrentUser()` and `useCurrentUser()`**, then remove all twenty-nine
   hardcoded literals.
5. **Real role detection**, replacing the URL sniff.
6. **An onboarding gate.** Every teacher already has a `teacher_profiles` row:
   the `on_auth_user_created` trigger creates it at sign-up with a generated
   `username`, so an existence check never fires. Gate on completeness instead,
   for example `hourly_rate_minor is null` or no `teacher_subjects` rows. Such
   a teacher should land somewhere sensible rather than an empty dashboard.

**Avatar image support is not yours.** Task 04 owns extending
`src/components/app/avatar.tsx` to accept an image. Consume that prop; do not
edit the component. If Task 04 has not landed when you get here, pass initials
only and leave a note rather than editing it yourself. Two agents rewriting the
same component is the one collision this plan cannot absorb.

## Do not

Do not redesign navigation or the shell. Do not touch spacing, colour or
typography. Do not remove the proxy's missing-environment short-circuit.

Note `/teacher/stats` exists as a page but is absent from the navigation config,
and `/teacher/preview/[username]` is likewise unlisted. Leave both alone, but
note the preview is public by schema design: Task 01 grants `anon` select on
`teacher_public_profiles`, `teacher_profiles` and the teacher join tables so it
renders signed out. Exclude it from every guard below. Otherwise they are out
of scope and the orphan routes are somebody's product decision.

## Definition of done

- A signed-out visitor hitting `/teacher` or `/student` is redirected to sign-in,
  except `/teacher/preview/[username]`, which stays readable signed out.
- A student cannot reach teacher routes, other than the public
  `/teacher/preview/[username]`, and a teacher cannot reach student routes.
- Sign-out works from both desktop and mobile, and clears the session.
- No mock user literal remains under `src/app/(app)/`. Grep to prove it.
- The real name and initials appear in the shell for a signed-in user. The
  avatar image too, if Task 04 has already extended the component.
- Device revocation survives a page refresh.
- `npx tsc --noEmit` is clean.

Report what you did about the hardcoded badge counts, since that one has no
obviously right answer.

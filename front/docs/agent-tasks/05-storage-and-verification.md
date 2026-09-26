# Task 05 — Storage and teacher verification

**Read [`00-CONTEXT.md`](./00-CONTEXT.md) first.**
**Depends on:** Task 04 and Task 06. Since Task 01 every teacher already has
a `teacher_profiles` row (PK `user_id`, created by the sign-up trigger), so FK
your document rows to `teacher_profiles(user_id)`. The dependency on Task 04
is about the profile pages and `avatar.tsx` it owns, which your upload plugs
into; the one on Task 06 is the typed query layer you extend.

## Goal

Make file upload real, and make teacher verification a genuine review workflow
rather than a set of status badges that never change.

This is the task where an unwatched mistake leaks someone's identity document.
Read the storage policy section twice.

## The verification model that already exists

`src/lib/mock/teacher-verification.ts`, rendered by
`src/app/(app)/teacher/verification/page.tsx`.

**Four steps**, in order: `identity`, `diplomas`, `bio`, `final`.
**Four statuses**, shared by steps and by individual diplomas:
`pending`, `in-progress`, `approved`, `rejected`. Both unions already exist in
Postgres since Task 01 as `public.verification_step` and
`public.verification_status`, and in `Enums` / `Constants` of
`src/lib/supabase/database.types.ts`. Use them as column types; do not
`create type` them again.

The identity payload:

```ts
type IdentityData = {
  fullName: string;
  dob: string;              // ISO yyyy-mm-dd, a real date
  nationality: string;
  cinNumber: string;        // formatted with spaces, "BE 847 231"
  cinFront?: IdentityFile | null;
  cinBack?: IdentityFile | null;
};
type IdentityFile = { fileName: string; previewUrl?: string };
```

Note `cinFront` and `cinBack` are **triple-state**: `undefined`, `null`, or a
file. Whatever that distinction was meant to encode, decide it explicitly and
collapse it to something a database column can hold. `fullName` and `dob`
already have columns from Task 01: `profiles.full_name` and
`profiles_private.birth_date` (a `date`, owner-only, checked to be 10 to 100
years ago; minors must have a guardian email). Read and update those; if the
verification row keeps a copy, it is a snapshot of what the document says, not
a second source of truth. `nationality` and the card number have no column yet.

Diplomas carry a title, institution, a bare integer `year` rather than a date,
an optional file name with **no URL**, and their own status. The bio step holds
free text, a subject list, and an `approvedByAdmin` boolean. The free text and
the subject list already live in `teacher_profiles.bio` and `teacher_subjects`
(reference subjects by slug, e.g. `mathematiques`); the bio step reviews
those, it does not store a second copy. Only the approval state is new.

## Three things that are wrong before you start

**1. The identity document is Moroccan.** `cinNumber` is a Moroccan national
identity card number, the sample nationality list leads with `Marocaine`, and
the format `"BE 847 231"` follows that scheme. If this product is for Algeria,
as the Chargily choice in `00-CONTEXT.md` implies, then **the identity field is
modelling the wrong country's document**. Raise this before building the upload
around it. Do not silently keep a Moroccan field name for an Algerian document.

**2. There is no admin surface anywhere in the repo.** No admin route, no
reviewer role, no queue. But verification is meaningless without a human
approving it, and three of the four statuses can only be set by a reviewer.
Building the teacher-facing upload without the review side produces documents
that are uploaded and then never looked at.

Task 01 fixed the `user_role` enum at exactly `student | teacher`, and the
sign-up trigger whitelists those two values from `raw_user_meta_data`; keep
that whitelist as it is. Model the reviewer as a separate table written only by
migrations or the service role, for example `public.reviewers(user_id)`, never
as something a user can pick at sign-up.

**3. Nothing is actually uploaded today.** The mock stores a `fileName` and an
optional `previewUrl` with no storage behind either. Diplomas store a file name
with no URL at all.

## What to build

### Storage buckets

At minimum, one bucket for avatars and one for verification documents. **These
have opposite security postures and must not share a bucket.**

Avatars are public. A teacher's photo appears on a public profile preview. The
column already exists: `profiles.avatar_path` holds the storage object path,
never a URL; its comment names the `avatars` bucket, the owner may update it,
and the `teacher_public_profiles` view exposes it to anon. Name the bucket
`avatars`, write the object path back after upload, and build the public URL
at render. No bucket or storage policy exists yet.

**Verification documents are the most sensitive data in the product.** They are
government identity documents belonging to real people, some of whom are minors.
The bucket must be private. Access is the owning teacher and an authorised
reviewer, nobody else. There is no product reason for an identity document to
ever be publicly readable, and no URL to one should be long-lived.

Write storage policies with the same rigour as table policies: name the role
with `TO`, wrap auth calls in a subselect, and test the negative case. A policy
that grants correctly but fails to deny is not done.

### Upload handling

Validate server-side, never only in the browser. Constrain file type and size.
Reject anything that is not an image or a PDF. Generate the storage path
server-side from the authenticated user id, so a client cannot choose where its
file lands or overwrite someone else's.

### The verification state machine

Model the four steps and four statuses as real rows with real transitions.
Record who changed a status and when. A rejection needs a reason the teacher can
read, and the current UI has no field for one, so add it.

The teacher may resubmit after rejection. Make sure the machine allows it.

### A minimal admin review surface

Not a product, just enough to do the job: a queue of pending submissions, a
document viewer using short-lived signed URLs, and approve or reject with a
reason.

Gate it on a real reviewer role stored in the database, checked through a
`security definer` helper in the `private` schema built like Task 01's
`private.user_role()`: `set search_path = ''`, execute revoked from `public`
and granted explicitly, called wrapped as `(select private.is_reviewer())`.
`private.user_role()` itself returns only `student | teacher` and cannot
answer the reviewer question; add a sibling beside it rather than repurposing
it. **Do not gate it on a client-side check,
an email allowlist in an environment variable, or anything in
`raw_user_meta_data`, which the user can edit themselves.**

### Other upload surfaces

Search the repo for the rest before you finish. Message attachments are already
modelled with a `kind` union of `pdf`, `image`, `link` and `audio`, and the
refund request modal accepts a single file name. Wire the ones that fall
naturally out of the bucket work, and list the ones you leave for later.

## Definition of done

- Avatar upload works end to end and appears on the public profile.
- Verification documents upload to a **private** bucket.
- A signed-out user cannot read a verification document by any URL. Prove it.
- A teacher cannot read another teacher's documents. Prove that too.
- A reviewer can approve or reject with a reason, and the teacher sees the outcome.
- Signed URLs are short-lived.
- `src/lib/supabase/database.types.ts` is regenerated with the Supabase MCP
  `generate_typescript_types` tool after your migrations, not edited by hand.
- `get_advisors` with type `security` returns no RLS findings and nothing new.
  Baseline after Task 01: two pre-existing WARNs (lints 0028 and 0029) on
  `public.rls_auto_enable()`, a Supabase-managed function that is not ours.
  Leave it alone; add nothing to that list.

Report your answer on the Moroccan identity field, whether you built the admin
surface or stopped short, and the exact negative tests you ran. For this task,
"I verified the deny path" is the part that matters.

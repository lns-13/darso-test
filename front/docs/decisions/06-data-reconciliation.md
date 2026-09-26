# Data reconciliation — the decision record

**Task 06.** Written 2026-09-07 against the applied schema, which is the six
migrations under `supabase/migrations/`.

The mock data grew organically and the same concept is modelled two ways on the
student and teacher sides. This document picks **one** shape per concept. Where
the table exists today the decision is implemented; where it does not, the
decision is a contract that binds whoever creates it.

Read the header of `20260906155856_identity_core.sql` first. It resolved four
earlier inconsistencies and this continues that record rather than restating it.

## What is implemented and what is a contract

Task 01 built the identity domain only. There are no tables for sessions,
applications, requests, transactions, invoices, payouts, reviews, messages or
notifications, and the task README lists the marketplace as deliberately out of
scope for these six briefs.

| Decisions | Status |
|---|---|
| 8, 9, 10, 11, 12 | **Implemented.** Identity domain, live in the schema and the query layer. |
| 1, 2, 3, 4, 5, 6, 7 | **Contract.** No table yet. Binding on whoever writes the migration. |

Nothing below was seeded into a table that does not exist. The seed loads the
identity domain and stops, rather than inventing a shape to hold the rest.

---

## The four principles

Every decision follows from these, so they are stated once.

1. **Store the fact, derive the presentation.** A French label, a formatted
   date, a count, an average, a set of initials and a "joinable" flag are all
   outputs. Storing them is what let the average rating for one teacher read
   4.9, 4.8, 4.8 and 4.9 in four files at once.
2. **Name both participants.** No column is ever called `teacher` on a row that
   sometimes holds a student. Each side of a relationship gets its own explicit
   foreign key and each view picks the other one.
3. **One state, two vocabularies.** Where the student UI and the teacher UI use
   different French words for the same underlying condition, the condition is
   stored once and the words are chosen at render from the viewer's role.
4. **Money is an integer plus a currency.** Minor units, never floats, and the
   currency code travels on the row. `00-CONTEXT.md` keeps the country decision
   open, so no symbol is ever hardcoded.

---

## 1. Session counterparty

**Student side** `teacher: string` plus `teacherInitials` on the dashboard;
`teacher: { name, initials }` in `SessionDetailData`.
**Teacher side** reuses `SessionDetailData.teacher` to hold the **student's**
name.

**Decision.** A session row carries `student_id` and `teacher_id`, both
non-null foreign keys to `profiles`. There is no counterparty column anywhere.

Each surface selects the other participant relative to the viewer. `initials`
is never stored; it is computed from `profiles.full_name` by
`initialsFromFullName` in `src/lib/data/derive.ts`.

**Why.** `SessionRowProps.teacher` already holds a student's name on every
teacher page, so the field name is actively false half the time it is read. The
identity_core header recorded this as inconsistency 4 and refused to carry a
counterparty column forward; this is the same decision applied to the session
table when it is written.

A side effect worth naming: the mocks reuse several **people** on both sides.
Karim El Fassi is an SVT teacher in the student mocks and a Prépa PCSI student
applicant in the teacher mocks; Nadia Cherkaoui, Chloé Bernard, Emma Whitfield
and Rachid Benhaddou each teach in one file and appear as the student on a
transaction in another. `profiles.role` is a single value made immutable by the
composite foreign key, so one human cannot be both. The seed resolves each to
the role in which the mocks give them the most substance and lists every case
it resolved; see `ROLE_CONFLICTS` in `scripts/seed-data.ts`.

## 2. Session time

**Student side** `when` holds a French display label.
**Teacher side** `when` holds ISO, `whenLabel` holds the label.

**Decision.** One column, `starts_at timestamptz`, plus `duration_minutes
smallint`. No label column, ever. `whenLabel` and `"60 min"` are produced by
`formatSessionWhen` and `formatDuration` at render.

**Why.** The same key meant two different things one import apart, which is
what forced `student/page.tsx` to invent a timestamp with
`new Date().toISOString()` when adapting its own rows into `SessionDetailData`.
A label cannot be compared, sorted, or used to decide whether a session has
started.

**Implemented on the dashboard already.** `src/app/(app)/student/page.tsx` now
stores `startsAt` and `durationMinutes` and derives the rest. See decision 12.

## 3. Review counterparty

**Student side** `teacher`, and `date` as display text ("12 juil. 2026").
**Teacher side** `student: { name, initials, level }`, and `dateISO`.

**Decision.** `reviews(id, session_id, author_id, subject_id, rating smallint
check 1..5, title, body, created_at timestamptz, teacher_response,
responded_at)`.

`author_id` is the student who wrote it. The teacher is reached through
`session_id`. The author's level is read from their `student_profiles` row, not
copied onto the review: a review written in Première must still show the right
level when the author reaches Terminale, and the level of the person is not a
property of the review.

Derived and never stored: `date` (from `created_at`), `initials`, and `isNew`,
which is a comparison between `created_at` and the viewer's last-seen marker,
not a flag on the row.

**The aggregate rule.** `mockRatingSummary` stores `avg`, `count` and a
five-bucket `breakdown`. None of them is ever stored. They are
`avg(rating)`, `count(*)` and a `group by rating` over the review rows. The
identity_core header already recorded this as inconsistency 2 and created no
rating column; that holds for the review table too. A materialised aggregate
for performance is allowed later, but only as a cache that can be rebuilt from
the rows, never as the source of truth.

## 4. Application

**Student side** `price`, `rating`, `subject` on the applicant card.
**Teacher side** `offeredPrice`, `referencePrice`, `targetKind`, `postedAgo`.

**Decision.** `applications(id, applicant_id, target_type, target_id,
offered_price_minor integer, currency char(3), message, status, created_at)`.

- `applicant_id` is role-neutral on purpose. On the student dashboard the
  applicant is a **teacher** applying to the student's request; on the teacher
  dashboard the applicant is a **student** applying to the teacher's course.
  The same table serves both, which it cannot do if the column is named for a
  role.
- `referencePrice` is **not** stored. It belongs to the target: the course's
  own price, or the teacher's `hourly_rate_minor`. Copying it onto the
  application freezes it, and the UI renders "260 vs 220" as a live comparison.
- `rating` is the applicant's computed aggregate, per decision 3.
- `subject` comes from the target, not the application.
- `postedAgo` derives from `created_at`.

## 5. Request author

**Student side** `author: string` plus `authorInitials` plus `level`.
**Teacher side** `author: { name, initials, level }`.

**Decision.** `requests.author_id`, a foreign key to `profiles`. Name, initials
and level are all joined or computed. Nothing about the author is denormalised
onto the request, for the reason given in decision 3: the level is a property of
the person at a point in time, and the person outlives the request.

## 6. Request body

**Student side** `description`, `deadline`.
**Teacher side** `snippet`, `deadlineLabel`.

**Decision.** One `body text` column. `snippet` is a render-time truncation and
has no column: two stored copies of the same prose drift, and the teacher-side
snippet is already a hand-written paraphrase rather than a prefix of anything.

The deadline needs two columns because the mock values are not all dates:

| Mock value | Stored as |
|---|---|
| `"30 sept."`, `"6 sept."`, `"9 sept."`, `"20 sept."` | `deadline_at date` |
| `"juin 2026"` | `deadline_at date`, the last day of the month |
| `"récurrent"` | `is_recurring boolean = true`, `deadline_at` null |
| `"fin trim."` | `deadline_at date`, an explicit end-of-term date |

`"fin trim."` is the interesting one: it is a real deadline expressed in school
vocabulary, so the seed must choose the actual date rather than storing the
phrase. `proposalsCount` is `count(*)` over applications and is not stored.

## 7. Transaction

**Student side** `title`, `teacher`, `amount`, `method`, `status`, `date` plus
`dateLabel`.
**Teacher side** `sessionTitle`, `student`, `gross` / `fee` / `net`, `subject`,
`dateLabel`, `status`.

**Decision.** One `payments` row per session payment, seen from both sides:

| Column | Note |
|---|---|
| `session_id` | supplies title and subject; no `title` or `sessionTitle` column |
| `payer_id`, `payee_id` | explicit, per decision 2 |
| `amount_minor`, `currency` | what the student paid |
| `fee_minor` | what the platform kept |
| `status` | one enum, per decision 9 |
| `reference` | the human-facing document number, preserved verbatim |
| `created_at` | `dateLabel` derives from it |

**One argued refinement of the brief.** The brief lists "computed fee and net"
among the values not to store. `net` is never stored: it is always
`amount_minor - fee_minor`. `fee_minor` **is** stored, and that is deliberate.
The mocks compute it as `Math.round(gross * 0.15)`, but the fee is not a
derivation of the amount, it is a record of what the platform actually took at
the time. When the rate moves from 15%, every historical row must keep the fee
it was charged; recomputing from a current rate would silently rewrite the past.
Storing the integer centimes rather than a rate also avoids two surfaces
rounding the same percentage differently.

Document numbers `TC-9182`, `FT-2026-0912` and `PO-2026-0089` are kept exactly
as written. They look deliberately business-meaningful and are the only ids in
the mocks that a human would ever quote. Every other hand-authored id
(`app-01`, `req-01`, `pmt-1`, `ts-sara`) becomes a real UUID; message ids are
unique only **within** a thread, so `m1` appears many times and cannot survive
as a key.

## 8. Balance

**Student side** a bare `balance` number in component state.
**Teacher side** `{ available, month, ytd, pendingPayouts }`.

**Decision.** None of the four is stored. Each is an aggregate:

| Figure | Definition |
|---|---|
| `available` | net of captured payments, less payouts not refused |
| `month` | the same, restricted to the current month |
| `ytd` | the same, restricted to the current year |
| `pendingPayouts` | sum of payouts still in flight |

**Why this one matters most.** A stored balance that disagrees with the
transactions beneath it is not a display bug, it is a financial discrepancy. If
the aggregate becomes too slow, cache it in a table that can be rebuilt from
the payment rows and reconciled on a schedule; never let it be authored.

---

## 9. Trap: status vocabularies collide in gendered French

Six separate unions describe overlapping states:

| Where | Values |
|---|---|
| `InvoiceData.status` (shared invoice body) | `payé`, `en attente`, `échoué`, `remboursé` |
| student `InvoiceRow.status` | `payée`, `en attente`, `échouée` |
| `TeacherInvoiceStatus` | `payée`, `en attente`, `annulée` |
| student `TxStatus` | `payé`, `en attente`, `échoué`, `remboursé` |
| `TeacherTxStatus` | `encaissé`, `en attente`, `annulé`, `remboursé` |
| `PayoutStatus` | `en cours`, `versé`, `refusé` |

Two separate problems are tangled here.

**Gender.** The invoice body says masculine `payé` (agreeing with *paiement*)
while both row wrappers say feminine `payée` (agreeing with *facture*). Every
mock therefore stores the status twice in two spellings, and they can disagree.

**Role.** The student says `payé` and `échoué` where the teacher says
`encaissé` and `annulé`. `payé` and `encaissé` are **the same state** seen from
two sides: the student paid, the teacher was credited. `échoué` and `annulé`
are **different** states that each side happens to surface only on its own
screens.

**Decision.** One `payment_status` enum, five values, with French chosen at
render:

| Stored | Student sees | Teacher sees |
|---|---|---|
| `pending` | en attente | en attente |
| `captured` | payé | encaissé |
| `failed` | échoué | *(not surfaced)* |
| `cancelled` | *(not surfaced)* | annulé |
| `refunded` | remboursé | remboursé |

Invoices reuse the same stored state and select the feminine form, because the
subject of the sentence is *la facture*:

| Stored | as an invoice | as a payment |
|---|---|---|
| `captured` | payée | payé |
| `pending` | en attente | en attente |
| `failed` | échouée | échoué |
| `cancelled` | annulée | annulé |
| `refunded` | remboursée | remboursé |

Payouts keep their **own** enum. `en cours` / `versé` / `refusé` describe a
transfer from the platform to a teacher's bank, which is a different lifecycle
from a student's payment, and collapsing them would force one enum to mean two
things — the exact mistake this section exists to undo.

The renderer therefore takes `(state, role, grammaticalSubject)`. No French
status string is ever stored.

## 10. Trap: notification categories diverge

Three unions, not two:

| Source | Values |
|---|---|
| student settings page | `session`, `payment`, `message`, `marketing` |
| teacher settings page | `session`, `payment`, `reminder`, `marketing` |
| `NotificationCategory` in `notification-row.tsx` | `session`, `payment`, `message`, `system` |

And the teacher UI relabels shared values: `session` displays as **"Demandes"**
and `system` as **"Séances"**. The mock's own header comment admits the tab
labels come from "the combination of category + intent", which is the tell: the
stored category is not the real category.

**Decision.** One `notification_category` enum of six values, with a per-role
label map at render:

| Stored | Student label | Teacher label | Absorbs |
|---|---|---|---|
| `application` | Candidatures | Demandes | teacher `session` |
| `session` | Séances | Séances | teacher `system` when it is a reminder or a schedule change; teacher `reminder` |
| `payment` | Paiements | Paiements | — |
| `message` | Messages | Messages | — |
| `marketing` | Nouveautés | Nouveautés | — |
| `system` | Système | Système | teacher `system` when it is genuinely a system notice |

Two consequences. `reminder` is not a category at all — it is a `session`
notification with a reminder trigger, so it folds in. And the teacher mock's
`system` is overloaded and must be **split by intent** when seeded: "Rappel —
Aujourd'hui à 14h" and "Séance déplacée" become `session`, while "Ton profil a
été vu 42 fois" and "Ta vérification finale est approuvée" stay `system`.

Labels live in a render-time map keyed by role. The same stored literal
legitimately displays differently to the two roles, which is exactly why the
label cannot be the stored value.

---

## 11. The student username field

`src/app/(app)/student/profile/page.tsx` edited a `username` against no column.
`username` exists only on `teacher_profiles`, where it is the
`/teacher/preview/[username]` route parameter.

**Decision: the field is removed from the student page. The column does not
move.**

Moving `username` onto `profiles` is a coherent design, and if students ever get
public profiles it is the right migration. It is wrong *now*: Task 04 is
concurrently building the public teacher profile on `teacher_profiles.username`,
`teacher_public_profiles` selects it, and the sign-up trigger generates it. A
relocation mid-flight breaks all three for a field no student surface reads. The
migration stays available and is purely additive whenever it is wanted.

The alternative — leaving the input on screen but disabled — was rejected: a
control that can never be enabled is debt with a UI cost.

## 12. The live `joinable` bug

`src/app/(app)/student/page.tsx` read:

```js
status: s.joinable ? "upcoming" : "upcoming"
```

Both branches identical, so the flag never affected the derived status.

**Decision.** `joinable` was not a broken branch, it was a stored derivation.
It is now computed, along with the status, from the timestamp:

- `sessionLifecycle(startsAt, durationMinutes, now)` returns `live` while the
  session is running, `past` after it ends, `upcoming` before.
- `isJoinable` is true while live, or within ten minutes of the start. Ten
  minutes is the rule already used on the student sessions page.

Three defects closed at once. The identical branches are gone. The fabricated
`when: new Date().toISOString()` is gone, replaced by the real `startsAt`. And
the frozen strings around it now follow the clock: `nextSessionIn = "4 h 12
min"` was a module constant that stayed 4 h 12 min for ever, and the header read
`"Mardi 1 septembre"` when the anchor date, 2 September 2026, is a Wednesday.

The page seeds its clock from the constant `2026-09-02T14:00:00+01:00` — the
same instant the message mocks and the sessions page use — so the server and
first client renders match, then ticks real time from that offset. One session
literal moved from 17:00 to 14:05 so that the demo still shows a joinable row at
the anchor, which is what the old `joinable: true` was expressing.

---

## Rules the seed follows

- **People are created through auth**, never by inserting profile rows. The
  `on_auth_user_created` trigger builds `profiles`, `profiles_private` and the
  role row; everything after is an update.
- **Validation happens before the call.** A CHECK violation surfaces from the
  auth API as an opaque `Database error creating new user` 500 with no row left
  behind, so every constraint is mirrored in the seed and a bad row is named
  before anything is sent.
- **No derived value is stored.** No ratings, counts, initials, formatted dates,
  fees, nets or balances.
- **French display strings become real timestamps**, anchored at
  `2026-09-02T14:00:00+01:00`.
- **Money becomes integer centimes plus a currency.** 220 becomes 22000 DZD. The
  one float in the codebase, the invoice line unit price, has no table yet; when
  invoices exist it becomes an integer like every other amount.
- **Country.** The mocks are Moroccan throughout — MAD, Casablanca, +212, CIH
  and BMCE — while the intended gateway is Chargily, which is Algeria-only.
  Following `00-CONTEXT.md`, the seed uses Algerian cities and +213 numbers.
  This is expressed only in `scripts/seed-data.ts` and is one edit to reverse.

## Two findings worth acting on

**Sara Bencheikh is 18, so the parental section is unreachable for her.** Her
mock birth date is 2008-05-14, and the student profile page shows the guardian
section only when the age is under 18. She passed that threshold on 2026-05-14.
Anyone demoing the minor gate with the obvious account sees nothing. The seed
therefore includes real minors — Omar Zeroual in Seconde, aged 15 — so the gate
is exercisable. Her guardian data is retained: the schema permits an adult to
keep a guardian on file.

**A birth date that is null must not be read as "adult".** `birth_date` is
nullable because the sign-up trigger writes null when it cannot parse the date.
`isMinor` in `src/lib/data/derive.ts` treats null as a minor, so a malformed
sign-up keeps the guardian section rather than silently dropping the guardian
relationship for exactly the accounts whose data was bad.

# Student-side wiring — report

Branch: `student/wire-real-actions` (5 commits, off `main` — teacher side untouched)

## What was hollow before

The Playwright audit passes zero dead buttons because its heuristic ("did any DOM mutation follow the click?") accepts a popover with a placeholder inside. The list below is what actually did **nothing observable** to the user before this pass.

| Surface | Item | Before | After |
|---|---|---|---|
| /student | Calendar icon (top) | no handler | Link → /student/sessions |
| /student | "Nouvelle demande" button | no handler | Opens `NewRequestModal` |
| /student | "Besoin d'un prof précis" card | wrapping `<button>`, no onClick | Opens `NewRequestModal` |
| /student | "Trouve un prof par matière" card | no onClick | `<Link>` → /student/discover |
| /student | Course cards in Tendances | no href | `<Link>` → /teacher/preview/{slug} |
| /student | SessionRow "Rejoindre" | pulsed animation, no action | Opens `JoinSessionModal` for that session |
| /student | SessionRow "Détails" | pulsed animation, no action | Opens `SessionDetailModal` (agenda + notes + actions) |
| /student | SessionRow entire row | not focusable | Enter/Space/click → same detail modal |
| /student rail | "Voir les 3 candidatures" | no onClick | Opens `CandidatesDrawer` (accept/refuse/message per applicant) |
| /student mobile hero | Prochaine session card | pulse only | Opens Join or Detail based on `joinable` |
| /student mobile hero | "Poste une demande" card | no onClick | Opens `NewRequestModal` |
| /student/discover | 4 filter dropdowns (Matière/Niveau/Tarif/Jours) | opened `<details>` but popover was clipped by wrapper's `overflow-x-auto` → invisible | Wrapper switched to `flex-wrap`; dropdowns render |
| /student/discover | Note-filter stars | invisible in rest state (`text-*` classes had no effect with `strokeWidth={0}` and no fill) | `fill-*` classes so stars render as light-grey outlines |
| /student/discover | Mobile "Recherche" icon | `console.log` | Opens FilterDrawer |
| /student/sessions | "Vue calendrier" | ComingSoon flash | Switches tab to Upcoming |
| /student/sessions | "Salle d'attente" | ComingSoon flash | Opens `JoinSessionModal` for the next live/pulsing session, or toast "Aucune séance dans les 10 min" |
| /student/sessions detail | "Rejoindre la séance" | no onJoin passed | Opens `JoinSessionModal` |
| /student/sessions detail | "Annuler" | no onCancel passed | Removes session from state + toast |
| /student/sessions detail | "Message" | no onMessage passed | Router push → /student/messages |
| /student/sessions detail | "Reprogrammer" | no onReschedule passed | Toast "Reprogrammation — bientôt via l'app" |
| /student/sessions past sessions | (no download) | — | "Télécharger le récap PDF" (real PDF) |
| /student/payments | "Recharger" | no handler | Opens `PaymentTopUpModal`; balance state updates |
| /student/payments | "Ajouter une carte" (both spots) | no handler | Opens `AddCardModal`; card list state updates |
| /student/payments | "Filtrer" | no handler | Opens a status-filter popover; narrows the table |
| /student/payments | Invoice PDF download | `console.log` | Real PDF via new `downloadTextPdf` helper |

## New shared components (all under `src/components/app/`)

- `new-request-modal.tsx` — subject/level/title/description/budget/deadline; success state.
- `candidates-drawer.tsx` — right side drawer; Accept/Refuse/Message per candidate; per-row status.
- `join-session-modal.tsx` — lobby → connecting → connected phases; mic/cam toggles.
- `payment-topup-modal.tsx` — quick-amount chips + custom input + method picker.
- `add-card-modal.tsx` — holder/PAN/expiry/CVC with formatters and brand detection.
- `src/lib/download-pdf.ts` — builds a minimal-but-valid PDF blob client-side.

## Non-standard-breakpoint fixes

The layout is decent at Tailwind defaults; it broke in the in-between zones:

- **AppShell**: sidebar-expand threshold moved 1180 → 1280 (was squeezing main between an expanded sidebar and a right aside at 1180–1279).
- **AppShell**: right rail auto-collapses below 1100px unless the user has toggled it — was eating ~30% of viewport at 900–1099 and forcing "Bonjour," / "Sara" line breaks + mid-word CourseCard wraps.
- **Payments tables**: explicit `whitespace-nowrap` + `headerClassName` widths on date/status/amount so columns don't fold ("1 sept." → "1 / sept.", "MONTANT" → "MONT…").
- **Payments layout**: aside split moved 1180 → 1360; below that the tables get the full main width.
- **CourseCard**: bookmark is now controllable (`bookmarked` + `onBookmarkToggle`), so `/student/favorites` uses the internal top-right bookmark instead of stacking an absolute overlay that was covering "MAD/h" at 500–620px viewports.

## Verification

**`scripts/audit-clickables.mjs`** — 33 routes: `dead=0  404=0  console=0  page=0` (unchanged; the audit was never the guarantee).

**`scripts/student-e2e.mjs`** — real interactive walkthrough of every wired action:

```
24/24 passed

student · calendar icon → /student/sessions
student · Nouvelle demande → NewRequestModal
student · QuickAction lime → NewRequestModal
student · QuickAction dark → /student/discover
student · CourseCard → /teacher/preview/*
student · Voir les 3 candidatures → CandidatesDrawer
student · Candidate Accept flips label to Accepté
student · Rejoindre → JoinSessionModal
student · Join lobby → Connected
student · Détails → SessionDetailModal
discover · Matière dropdown opens
discover · Matière filter narrows list
discover · Note filter clicks
sessions · Vue à venir switches tab (URL ?tab=upcoming)
sessions · Salle d'attente reacts
sessions · Drawer Rejoindre la séance → JoinSessionModal
sessions · Annuler flashes toast
sessions · Message → /student/messages
payments · Recharger → PaymentTopUpModal
payments · Recharger 200 MAD updates balance
payments · Ajouter une carte → AddCardModal
payments · Filtrer popover opens with statuses
payments · Filter narrows to Payés (chip labels active)
payments · Télécharger le PDF triggers download  (Darso — F-4821.pdf)
```

**Responsive sweep** — `scripts/responsive-sweep.mjs` runs 16 widths × 8 pages; zero horizontal overflow anywhere.

## Branch

```
main
 └── student/wire-real-actions
       (from polish/mobile-buttons-cleanup ancestry)
       6e5b3ce  fix(filter-bar): visible stars + non-clipped dropdowns
       + 4 feature commits (dashboard, sessions, payments, responsive)
       + this report
```

Teacher side untouched.

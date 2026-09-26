/**
 * Values the database deliberately does NOT store, computed here instead.
 *
 * Every function in this file exists because the mock data stored its result
 * and the stored copies disagreed with each other. `initials` was written out
 * by hand in twenty-nine places; the average rating appears as 4.9, 4.8, 4.8
 * and 4.9 in four files describing the same teacher; ages were frozen at
 * authoring time. Deriving them is the whole point.
 *
 * See docs/decisions/06-data-reconciliation.md for the rule and its rationale.
 */

/* ---------------------------------------------------------------------------
   Identity
--------------------------------------------------------------------------- */

/**
 * "Youssef Amrani" -> "YA", "Sara" -> "SA", "Jean-Luc Le Goff" -> "JL".
 *
 * Two letters, uppercased. Takes the first letter of the first two whitespace-
 * or hyphen-separated words, falling back to the first two letters of a single
 * word. The mocks are inconsistent here — Yasmine Alaoui is "YA" in one file
 * and "YAl" in another, colliding with Youssef Amrani — which is exactly why
 * this is computed from one stored `full_name` rather than authored.
 */
export function initialsFromFullName(fullName: string): string {
  const words = fullName
    .split(/[\s\-–—]+/u)
    .map((w) => w.trim())
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) {
    return words[0].slice(0, 2).toLocaleUpperCase("fr");
  }
  return (words[0][0] + words[1][0]).toLocaleUpperCase("fr");
}

/** First name for greetings ("Bonjour, Sara"). */
export function firstNameFromFullName(fullName: string): string {
  const first = fullName.trim().split(/\s+/u)[0];
  return first ?? fullName;
}

/* ---------------------------------------------------------------------------
   Age and the minor gate
--------------------------------------------------------------------------- */

/**
 * Whole years between a `date` column (YYYY-MM-DD) and `on`.
 *
 * `birth_date` is a Postgres `date`, so supabase-js hands it back as the plain
 * string "2008-05-14" with no timezone. Parsing it with `new Date(...)` would
 * read it as UTC midnight and shift it a day backwards west of Greenwich, which
 * flips the age for anyone whose birthday is today. The parts are read
 * directly instead.
 */
export function ageOn(birthDate: string, on: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  let age = on.getFullYear() - year;
  const hadBirthdayThisYear =
    on.getMonth() + 1 > month ||
    (on.getMonth() + 1 === month && on.getDate() >= day);
  if (!hadBirthdayThisYear) age -= 1;

  return age;
}

/**
 * Whether the parental section applies.
 *
 * `birth_date` is nullable: the sign-up trigger writes null when the three
 * date fields could not be parsed. Null means "we do not know", and the
 * product cannot claim someone is an adult on the strength of a field it
 * failed to read — so an unknown birth date is treated as a minor and the
 * guardian section stays visible. The alternative silently drops the guardian
 * relationship for exactly the accounts whose data was malformed.
 */
export function isMinor(birthDate: string | null, on: Date): boolean {
  if (birthDate === null) return true;
  const age = ageOn(birthDate, on);
  if (age === null) return true;
  return age < 18;
}

/* ---------------------------------------------------------------------------
   Money
--------------------------------------------------------------------------- */

/**
 * Integer minor units to a display string, in the row's own currency.
 *
 * Never hardcode a symbol: `00-CONTEXT.md` records that the currency decision
 * is still open, the mocks say MAD throughout, and the schema defaults to DZD.
 * Every money row carries its own currency code and it is printed from the row.
 */
export function formatMoneyMinor(
  amountMinor: number,
  currency: string,
  locale = "fr-DZ",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

/** "220 DZD/h" for an hourly rate held as 22000 centimes. */
export function formatHourlyRate(
  hourlyRateMinor: number | null,
  currency: string,
  locale = "fr-DZ",
): string | null {
  if (hourlyRateMinor === null) return null;
  return `${formatMoneyMinor(hourlyRateMinor, currency, locale)}/h`;
}

/* ---------------------------------------------------------------------------
   Session timing
--------------------------------------------------------------------------- */

/** A session may be joined from ten minutes before it starts. */
export const JOIN_WINDOW_MINUTES = 10;

export type SessionLifecycle = "upcoming" | "live" | "past";

/**
 * The stored facts are `startsAt` and `durationMinutes`. Everything the UI
 * shows about *when* a session is — its status, whether the join button is
 * live, the French label — is derived from those two and the current clock.
 *
 * The mocks stored `status` and `joinable` as authored booleans, which is why
 * `student/page.tsx` contained `status: s.joinable ? "upcoming" : "upcoming"`:
 * once the flag is data rather than a function of time, nothing keeps the two
 * in agreement and the branch decays into a no-op.
 */
export function sessionLifecycle(
  startsAt: Date,
  durationMinutes: number,
  now: Date,
): SessionLifecycle {
  const start = startsAt.getTime();
  const end = start + durationMinutes * 60_000;
  const t = now.getTime();
  if (t >= end) return "past";
  if (t >= start) return "live";
  return "upcoming";
}

/** True while the session is live, or within the join window before it. */
export function isJoinable(
  startsAt: Date,
  durationMinutes: number,
  now: Date,
): boolean {
  const phase = sessionLifecycle(startsAt, durationMinutes, now);
  if (phase === "past") return false;
  if (phase === "live") return true;
  return minutesUntil(startsAt, now) <= JOIN_WINDOW_MINUTES;
}

export function minutesUntil(when: Date, now: Date): number {
  return Math.round((when.getTime() - now.getTime()) / 60_000);
}

/* ---------------------------------------------------------------------------
   French display labels
--------------------------------------------------------------------------- */

const WEEKDAY_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function calendarDaysBetween(a: Date, b: Date): number {
  const dayA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const dayB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((dayA - dayB) / 86_400_000);
}

function hhmm(d: Date): string {
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * The label the session rows show: "Aujourd'hui · 17:00", "Demain · 16:00",
 * "Jeu. · 17:00", "Ven. 4 sept · 17:00".
 *
 * This replaces the stored `when`/`whenLabel` pair. The mocks stored both, and
 * they drifted: on the student dashboard `when` held the French label, while
 * in `SessionDetailData` the same key held an ISO timestamp.
 */
export function formatSessionWhen(startsAt: Date, now: Date): string {
  const days = calendarDaysBetween(startsAt, now);
  const time = hhmm(startsAt);

  if (sameCalendarDay(startsAt, now)) return `Aujourd'hui · ${time}`;
  if (days === 1) return `Demain · ${time}`;
  if (days === -1) return `Hier · ${time}`;
  if (days > 1 && days < 7) {
    const label = WEEKDAY_SHORT[startsAt.getDay()];
    return `${label[0].toLocaleUpperCase("fr")}${label.slice(1)} · ${time}`;
  }
  const label = WEEKDAY_SHORT[startsAt.getDay()];
  const capitalised = `${label[0].toLocaleUpperCase("fr")}${label.slice(1)}`;
  return `${capitalised} ${startsAt.getDate()} ${MONTH_SHORT[startsAt.getMonth()]} · ${time}`;
}

/** "60 min" from a stored integer. */
export function formatDuration(durationMinutes: number): string {
  return `${durationMinutes} min`;
}

const WEEKDAY_LONG = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
];
const MONTH_LONG = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** "Mercredi 2 septembre" — the dashboard's page-header eyebrow. */
export function formatLongDate(d: Date): string {
  return `${WEEKDAY_LONG[d.getDay()]} ${d.getDate()} ${MONTH_LONG[d.getMonth()]}`;
}

/** "Mer. 2 sept." — the mobile header's subtitle. */
export function formatShortDate(d: Date): string {
  const label = WEEKDAY_SHORT[d.getDay()];
  const capitalised = `${label[0].toLocaleUpperCase("fr")}${label.slice(1)}`;
  return `${capitalised} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/**
 * "4 h 12 min", "12 min", "maintenant".
 *
 * Replaces the hardcoded `nextSessionIn = "4 h 12 min"`, which was a string
 * constant in a module and so stayed 4 h 12 min for ever, including while the
 * session it referred to was already under way.
 */
export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "maintenant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/**
 * "Actif maintenant", "il y a 4 min", "il y a 2 h", "Il y a 3 jours".
 * Backs the device list's `last` field and every "postedAgo" style string.
 */
export function formatRelativePast(at: Date, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - at.getTime()) / 60_000));
  if (minutes < 2) return "Actif maintenant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = calendarDaysBetween(now, at);
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} jours`;

  return `${at.getDate()} ${MONTH_SHORT[at.getMonth()]}`;
}

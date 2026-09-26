/**
 * Recurring weekly availability, shared by server reads and client editors.
 *
 * The shape is deliberately `WeekSlot` from `src/components/app/week-grid.tsx`
 * (`{ id, day, start, end }`, `day` 0 = Monday) so a row from
 * `public.teacher_availability` can be handed to the existing grid with no
 * adapter. The database column `weekday` carries the same 0 = Monday order,
 * which is NOT Postgres `extract(dow)`.
 *
 * Pure functions only: no database import, so client components can use it.
 */

export type AvailabilitySlot = {
  id: string;
  day: number; // 0 = Monday .. 6 = Sunday
  start: string; // "HH:MM"
  end: string; // "HH:MM"
};

export const WEEKDAY_LABELS_SHORT = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
] as const;

export const WEEKDAY_LABELS_LONG = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

/**
 * Postgres renders a `time` column as "14:00:00". The UI works in "HH:MM".
 * 24:00:00 is a legal value and means midnight closing that weekday.
 */
export function toHHMM(time: string): string {
  return time.slice(0, 5);
}

/** "HH:MM" -> "HH:MM:00", the form Postgres accepts for a `time` column. */
export function toPgTime(hhmm: string): string {
  return `${hhmm}:00`;
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => Number.parseInt(n, 10));
  if (!Number.isFinite(h)) return Number.NaN;
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

const HHMM_RE = /^([01]\d|2[0-4]):([0-5]\d)$/;

/**
 * Mirrors the database constraints client-side so the teacher gets a French
 * message instead of a raw Postgres error: shape, ordering, 15-minute
 * granularity, and a weekday in range. Overlap is checked separately because
 * it needs the whole set.
 */
export function validateSlot(slot: AvailabilitySlot): string | null {
  if (!Number.isInteger(slot.day) || slot.day < 0 || slot.day > 6) {
    return "Jour de la semaine invalide.";
  }
  if (!HHMM_RE.test(slot.start) || !HHMM_RE.test(slot.end)) {
    return "Heure invalide (format attendu HH:MM).";
  }
  const start = hhmmToMinutes(slot.start);
  const end = hhmmToMinutes(slot.end);
  if (end <= start) {
    return "La fin d'un créneau doit suivre son début.";
  }
  if (end > 24 * 60) {
    return "Un créneau ne peut pas dépasser minuit.";
  }
  if (start % 15 !== 0 || end % 15 !== 0) {
    return "Les créneaux se règlent par tranches de 15 minutes.";
  }
  return null;
}

/**
 * The same rule as the `teacher_availability_no_overlap` exclusion constraint,
 * checked before the round trip. Two slots on the same weekday may touch
 * (14:00-16:00 then 16:00-18:00) but not overlap.
 */
export function findOverlap(slots: AvailabilitySlot[]): string | null {
  const byDay = new Map<number, AvailabilitySlot[]>();
  for (const slot of slots) {
    const list = byDay.get(slot.day);
    if (list) list.push(slot);
    else byDay.set(slot.day, [slot]);
  }

  for (const [day, list] of byDay) {
    const sorted = [...list].sort(
      (a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start),
    );
    for (let i = 1; i < sorted.length; i += 1) {
      if (hhmmToMinutes(sorted[i].start) < hhmmToMinutes(sorted[i - 1].end)) {
        return `Deux créneaux se chevauchent le ${WEEKDAY_LABELS_LONG[day].toLowerCase()}.`;
      }
    }
  }
  return null;
}

export type DayAvailability = {
  day: number;
  label: string;
  shortLabel: string;
  ranges: string[]; // ["14:00 – 16:00", "17:00 – 19:00"]
};

/** Days that carry at least one slot, in week order, each range sorted. */
export function groupByDay(slots: AvailabilitySlot[]): DayAvailability[] {
  const days: DayAvailability[] = [];
  for (let day = 0; day < 7; day += 1) {
    const ranges = slots
      .filter((s) => s.day === day)
      .sort((a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start))
      .map((s) => `${s.start} – ${s.end}`);
    if (ranges.length > 0) {
      days.push({
        day,
        label: WEEKDAY_LABELS_LONG[day],
        shortLabel: WEEKDAY_LABELS_SHORT[day],
        ranges,
      });
    }
  }
  return days;
}

/**
 * One-line summary for the places that used to print the free-text
 * `availabilityHours` label, e.g. "Lun, Mar, Jeu · 12 h par semaine".
 * Returns null when the teacher has published nothing, so the caller can show
 * a real empty state instead of an invented one.
 */
export function summariseWeek(slots: AvailabilitySlot[]): string | null {
  const days = groupByDay(slots);
  if (days.length === 0) return null;

  const minutes = slots.reduce(
    (total, s) => total + (hhmmToMinutes(s.end) - hhmmToMinutes(s.start)),
    0,
  );
  const hours = Math.round((minutes / 60) * 10) / 10;
  const hoursLabel = Number.isInteger(hours)
    ? String(hours)
    : hours.toFixed(1).replace(".", ",");

  return `${days.map((d) => d.shortLabel).join(", ")} · ${hoursLabel} h par semaine`;
}

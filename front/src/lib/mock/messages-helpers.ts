/**
 * Date formatting helpers for messages.
 * Mock today = 2026-09-02 (Wed).
 */

// Mock "now" anchor — used everywhere for deterministic relative labels.
const MOCK_NOW = new Date("2026-09-02T14:00:00+01:00");

const DAY_LABELS_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH_LABELS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysBetween(a: Date, b: Date) {
  const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((aDay - bDay) / (1000 * 60 * 60 * 24));
}

/** "14h05" style time */
export function formatTimeHM(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}h${m}`;
}

/** Short list label: "14h05" if today, "Hier", "mer.", or "27 août". */
export function formatRelativeShort(iso: string) {
  const d = new Date(iso);
  const diff = daysBetween(MOCK_NOW, d);
  if (diff === 0) return formatTimeHM(iso);
  if (diff === 1) return "Hier";
  if (diff > 1 && diff < 7) return DAY_LABELS_SHORT[d.getDay()];
  return `${d.getDate()} ${MONTH_LABELS_SHORT[d.getMonth()]}`;
}

/** Full day divider: "Aujourd'hui", "Hier", or "mer. 27 août". */
export function formatDayDivider(iso: string) {
  const d = new Date(iso);
  if (isSameDay(d, MOCK_NOW)) return "Aujourd'hui";
  const diff = daysBetween(MOCK_NOW, d);
  if (diff === 1) return "Hier";
  return `${DAY_LABELS_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_LABELS_SHORT[d.getMonth()]}`;
}

/** Group messages into (day-bucket, sender-run) chunks for rendering. */
export type MessageGroup<T> = {
  dayKey: string; // "2026-09-02"
  dividerLabel: string; // "Aujourd'hui"
  runs: Array<{
    from: string; // "me" or participant id
    items: T[];
  }>;
};

export function groupMessagesByDay<T extends { time: string; from: string }>(
  items: T[],
): MessageGroup<T>[] {
  const groups: MessageGroup<T>[] = [];
  for (const item of items) {
    const d = new Date(item.time);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let group = groups[groups.length - 1];
    if (!group || group.dayKey !== dayKey) {
      group = {
        dayKey,
        dividerLabel: formatDayDivider(item.time),
        runs: [],
      };
      groups.push(group);
    }
    const lastRun = group.runs[group.runs.length - 1];
    if (lastRun && lastRun.from === item.from) {
      lastRun.items.push(item);
    } else {
      group.runs.push({ from: item.from, items: [item] });
    }
  }
  return groups;
}

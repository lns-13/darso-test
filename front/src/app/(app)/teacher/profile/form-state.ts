/**
 * Shared shapes for the profile forms.
 *
 * These live outside `actions.ts` on purpose: a module carrying the
 * `"use server"` directive may only export async functions, so a constant or a
 * plain value exported from it is a build error.
 */

export type SaveState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; errors?: Record<string, string> };

export const idleSaveState: SaveState = { status: "idle" };

/**
 * The zones offered by the picker. `teacher_profiles.timezone` accepts any
 * name Postgres knows, validated by `private.assert_valid_timezone()`; a
 * stored value outside this list is preserved rather than silently reset.
 */
export const OFFERED_TIMEZONES: { value: string; label: string }[] = [
  { value: "Africa/Algiers", label: "Alger (UTC+1)" },
  { value: "Africa/Casablanca", label: "Casablanca (UTC+1)" },
  { value: "Africa/Tunis", label: "Tunis (UTC+1)" },
  { value: "Europe/Paris", label: "Paris (UTC+1/+2)" },
  { value: "UTC", label: "UTC" },
];

/**
 * Where a signed-in person belongs, and how we ask.
 *
 * The role comes from GET /api/accounts/profile/, resolved server-side
 * from the DRF token — never from anything the client sends.
 */

import { apiFetch } from "@/lib/api";

export type UserRole = "student" | "teacher";

export const STUDENT_HOME = "/student";
export const TEACHER_HOME = "/teacher";

export function homeForRole(role: UserRole | null | undefined): string {
  return role === "teacher" ? TEACHER_HOME : STUDENT_HOME;
}

/**
 * Reads the role of the currently signed-in user via the auth cookie.
 * Returns null when signed out or the request fails, which callers treat
 * as "send them to the student dashboard" rather than as an error.
 */
export async function readUserRole(): Promise<UserRole | null> {
  const res = await apiFetch("/api/accounts/profile/");
  if (!res.ok) return null;
  const data = (await res.json()) as { role?: string };
  return data.role === "teacher" || data.role === "student" ? data.role : null;
}

/** The dashboard path for the signed-in user, resolved from the database. */
export async function homeForUser(): Promise<string> {
  return homeForRole(await readUserRole());
}

/**
 * Only ever redirect to a path inside this app. Guards the `next` parameter
 * on /auth/callback, which arrives from an email link and is therefore
 * attacker-influenced: "//evil.com" is a protocol-relative URL, not a path.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

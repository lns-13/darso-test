import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api";

/**
 * Thin proxy so Client Components (teacher/page.tsx, student/page.tsx)
 * can fetch the real profile without needing next/headers themselves —
 * apiFetch() is server-only (reads the httpOnly cookie directly), so it
 * can't be called from "use client" code. This route is the bridge.
 *
 * Real shape from GET /api/accounts/profile/:
 *   { email, full_name, role, avatar_path, city, ui_locale }
 * Reduced here to just what the dashboard headers currently use.
 */
export async function GET() {
  const res = await apiFetch("/api/accounts/profile/");
  if (!res.ok) return NextResponse.json(null, { status: res.status });

  const data = (await res.json()) as { full_name?: string; role?: string };
  return NextResponse.json({ fullName: data.full_name, role: data.role });
}

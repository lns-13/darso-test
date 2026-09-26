import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE } from "@/lib/api";

/**
 * Guards /student and /teacher: no auth cookie, no entry.
 *
 * This only checks the cookie EXISTS — it does not verify the token
 * against Django (middleware runs on the Edge runtime, and adding a
 * round-trip to every navigation isn't worth it). A stale or revoked
 * token still reaches the page, but the first API call it makes gets a
 * 401 from Django, since apiFetch() sends it as the Authorization
 * header. That 401 is the real check; this is just the fast, cheap
 * front door so a signed-out visitor never sees the page shell at all.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/student") || pathname.startsWith("/teacher");

  if (isProtected) {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      const destination = new URL("/sign-in", request.nextUrl.origin);
      destination.searchParams.set("next", pathname);
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

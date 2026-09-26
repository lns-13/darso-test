import { NextResponse, type NextRequest } from "next/server";

import { signOut } from "@/lib/auth/actions";

/**
 * POST-only sign-out endpoint.
 *
 * The signed-in screens have no sign-out control anywhere in the design as it
 * stands — the only LogOut icon in the app disconnects *other* devices — so
 * the `signOut` action this wraps has no button to hang off yet. This gives
 * it a home a form can post to the moment one is designed, and lets the full
 * create → confirm → sign out → sign back in round trip be exercised today.
 *
 * GET is deliberately not implemented: a link or a prefetch must never be
 * able to end someone's session. The Origin check is there for the other way
 * to trigger it, a cross-site form post.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "bad origin" }, { status: 403 });
  }

  // Clears the Supabase session cookies, then redirects to /sign-in.
  await signOut();
}

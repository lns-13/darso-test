import { NextResponse, type NextRequest } from "next/server";

import { apiFetch } from "@/lib/api";
import { safeNextPath } from "@/lib/auth/routes";
import { AUTH_ERROR_PARAMS } from "@/lib/auth/validation";

/**
 * Where the sign-up confirmation email lands. Password-reset emails do
 * NOT come through here — accounts/email.py links those straight to
 * /reset-password?token=…, so this route only ever needs to handle one
 * case: ?token=…&type=confirm (the exact shape accounts/email.py's
 * send_confirmation_email() builds — see accounts/tokens.py for how
 * the token itself is signed).
 *
 * An expired or already-used link fails cleanly with a French message
 * rather than on a blank screen.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));

  const failure = new URL("/sign-in", request.nextUrl.origin);
  failure.searchParams.set("error", AUTH_ERROR_PARAMS.linkInvalid);

  if (!token || type !== "confirm") return NextResponse.redirect(failure);

  const res = await apiFetch("/api/accounts/confirm-email/", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return NextResponse.redirect(failure);

  // Confirming does not sign the person in (no token issued here) — send
  // them to sign in, unless an explicit next says otherwise.
  const destination = next ?? "/sign-in";
  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}

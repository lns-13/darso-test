import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { homeForUser, safeNextPath } from "@/lib/auth/routes";
import { AUTH_ERROR_PARAMS } from "@/lib/auth/validation";

/**
 * Where every email link lands: sign-up confirmation, magic link, password
 * recovery, and any social provider added later. No route handler existed
 * anywhere in this app before; this is the first.
 *
 * Two shapes are accepted, because the two Supabase email-template styles
 * produce different links:
 *
 *   ?code=…               the PKCE flow, which is what @supabase/ssr uses by
 *                         default and what the stock {{ .ConfirmationURL }}
 *                         template produces.
 *   ?token_hash=…&type=…  the token-hash flow, for when the templates are
 *                         switched to {{ .TokenHash }}.
 *
 * The PKCE exchange needs the code verifier cookie written when the flow
 * started, so it only succeeds in the browser that asked. A link opened on a
 * different device fails cleanly with a French message rather than on a blank
 * screen.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  // Supabase appends these when it refuses the link before we ever see it —
  // an expired confirmation, a recovery link used twice.
  const providerError =
    searchParams.get("error") ?? searchParams.get("error_code");

  const failureTarget =
    next === "/reset-password" ? "/forgot-password" : "/sign-in";
  const failure = new URL(failureTarget, request.nextUrl.origin);
  failure.searchParams.set("error", AUTH_ERROR_PARAMS.linkInvalid);

  if (providerError) return NextResponse.redirect(failure);
  if (!code && !tokenHash) return NextResponse.redirect(failure);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(failure);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) return NextResponse.redirect(failure);
  } else {
    return NextResponse.redirect(failure);
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.redirect(failure);

  // An explicit next wins — that is how the recovery link reaches the
  // set-a-new-password screen. Otherwise the role decides, read from
  // profiles.role and never from the user metadata.
  const destination = next ?? (await homeForUser());

  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}

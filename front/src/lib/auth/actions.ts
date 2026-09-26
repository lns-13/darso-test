"use server";

/**
 * Every auth mutation in the product. All of them run on the server, so
 * nothing the caller can rewrite is ever trusted.
 *
 * Validation is re-run here with the shared module, never taken on trust
 * from the client.
 */

import { redirect } from "next/navigation";

import { apiFetch, setAuthCookie, clearAuthCookie } from "@/lib/api";
import {
  AUTH_MESSAGES,
  composeBirthDate,
  computeAge,
  isMinor,
  validateEmail,
  validateIdentity,
  validatePassword,
  type FieldErrors,
} from "./validation";
import { homeForRole } from "./routes";
import type {
  OtpState,
  ResetRequestState,
  SignInState,
  SignUpState,
  UpdatePasswordState,
} from "./state";

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * DRF speaks field-keyed arrays of English strings; the product speaks
 * French and has a fixed set of slots. Anything unmapped becomes the
 * generic string rather than leaking a provider message into the UI.
 */
function messageForApiError(status: number, body: unknown): { field?: keyof FieldErrors; message: string } {
  if (status === 429) return { message: AUTH_MESSAGES.rateLimited };

  const data = (body ?? {}) as Record<string, unknown>;

  const emailErrors = data.email as string[] | undefined;
  if (emailErrors?.some((m) => /already registered/i.test(m)))
    return { field: "email", message: AUTH_MESSAGES.emailTaken };
  if (emailErrors?.length) return { field: "email", message: AUTH_MESSAGES.emailInvalid };

  const nonField = data.non_field_errors as string[] | undefined;
  if (nonField?.some((m) => /invalid email or password/i.test(m)))
    return { message: AUTH_MESSAGES.invalidCredentials };
  if (nonField?.some((m) => /not active/i.test(m)))
    return { message: AUTH_MESSAGES.emailNotConfirmed };

  const guardianErrors = data.guardian_email as string[] | undefined;
  if (guardianErrors?.length) return { field: "parentEmail", message: AUTH_MESSAGES.guardianRequired };

  return { message: AUTH_MESSAGES.unexpected };
}

/* ------------------------------------------------------------------ *
 * sign in — password
 * ------------------------------------------------------------------ */

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = readString(formData, "email").trim();
  const password = readString(formData, "password");

  const errors: FieldErrors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (hasErrors(errors)) return { status: "error", errors };

  const res = await apiFetch("/api/accounts/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { field, message } = messageForApiError(res.status, body);
    return { status: "error", errors: field ? { [field]: message } : { form: message } };
  }

  const data = (await res.json()) as { token: string; role: "student" | "teacher" };
  await setAuthCookie(data.token);

  // If proxy.ts bounced them here from a protected page, send them back to
  // it instead of always their role's default home. Requires the sign-in
  // form to forward `next` as a hidden field — see GUIDE.md.
  const next = readString(formData, "next");
  redirect(next || homeForRole(data.role));
}

/* ------------------------------------------------------------------ *
 * sign in — magic link
 *
 * TODO: no Django endpoint spec'd for this yet (not covered in the
 * register/login contract). Add POST /api/auth/otp/request/ on the
 * backend before wiring this — left as a clear failure rather than a
 * silent no-op.
 * ------------------------------------------------------------------ */

export async function signInWithOtp(
  _prevState: OtpState,
  formData: FormData,
): Promise<OtpState> {
  const email = readString(formData, "email").trim();

  const emailError = validateEmail(email);
  if (emailError)
    return { status: "error", email, errors: { email: emailError } };

  return {
    status: "error",
    email,
    errors: { form: AUTH_MESSAGES.unexpected },
  };
}

/* ------------------------------------------------------------------ *
 * sign up
 * ------------------------------------------------------------------ */

export async function signUp(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const identity = {
    fullName: readString(formData, "fullName"),
    email: readString(formData, "email"),
    password: readString(formData, "password"),
    dobD: readString(formData, "dobD"),
    dobM: readString(formData, "dobM"),
    dobY: readString(formData, "dobY"),
    parentEmail: readString(formData, "parentEmail"),
  };
  const email = identity.email.trim();

  const errors = validateIdentity(identity);
  if (hasErrors(errors)) return { status: "error", email, errors };

  const role =
    readString(formData, "role") === "teacher" ? "teacher" : "student";

  const age = computeAge(identity.dobD, identity.dobM, identity.dobY);
  const birthDate = composeBirthDate(identity.dobD, identity.dobM, identity.dobY);
  const guardianEmail = isMinor(age) ? identity.parentEmail.trim() : "";
  const fullName = identity.fullName.trim() || email.split("@")[0];

  const res = await apiFetch("/api/accounts/register/", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password: identity.password,
      role,
      birth_date: birthDate,
      guardian_email: guardianEmail || null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { field, message } = messageForApiError(res.status, body);
    return { status: "error", email, errors: field ? { [field]: message } : { form: message } };
  }

  // Register never returns a token (email confirmation required first).
  return { status: "confirm", email, errors: {} };
}

/* ------------------------------------------------------------------ *
 * password reset — request the link
 * ------------------------------------------------------------------ */

export async function requestPasswordReset(
  _prevState: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = readString(formData, "email").trim();

  const emailError = validateEmail(email);
  if (emailError)
    return { status: "error", email, errors: { email: emailError } };

  const res = await apiFetch("/api/accounts/password-reset/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  // Same as before: an unknown address should not distinguish itself from
  // a known one. Only real failures reach here.
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { message } = messageForApiError(res.status, body);
    return { status: "error", email, errors: { form: message } };
  }

  return { status: "sent", email, errors: {} };
}

/* ------------------------------------------------------------------ *
 * password reset — set the new password
 *
 * NOTE: the reset link's token must be passed through as a hidden form
 * field named "token" (the page reads it from the URL query string).
 * There is no server session to fall back on anymore.
 * ------------------------------------------------------------------ */

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = readString(formData, "password");
  const confirmation = readString(formData, "passwordConfirm");
  const token = readString(formData, "token");

  const passwordError = validatePassword(password, { isNew: true });
  if (passwordError)
    return { status: "error", errors: { password: passwordError } };
  if (confirmation !== password)
    return {
      status: "error",
      errors: { passwordConfirm: AUTH_MESSAGES.passwordsDiffer },
    };
  if (!token)
    return { status: "error", errors: { form: AUTH_MESSAGES.recoverySessionMissing } };

  const res = await apiFetch("/api/accounts/password-reset/confirm/", {
    method: "POST",
    body: JSON.stringify({ token, new_password: password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { message } = messageForApiError(res.status, body);
    return { status: "error", errors: { form: message } };
  }

  redirect("/sign-in");
}

/* ------------------------------------------------------------------ *
 * sign out
 * ------------------------------------------------------------------ */

export async function signOut(): Promise<void> {
  await apiFetch("/api/accounts/logout/", { method: "POST" }).catch(() => {});
  await clearAuthCookie();
  redirect("/sign-in");
}

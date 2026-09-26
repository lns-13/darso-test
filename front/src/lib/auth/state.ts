/**
 * The state shapes the auth forms consume through `useActionState`.
 *
 * Kept out of the "use server" module because a file with that directive may
 * only export async functions, and the Client Components need these types and
 * initial values at build time.
 */

import type { FieldErrors } from "./validation";

export type SignInState = {
  status: "idle" | "error";
  errors: FieldErrors;
};

export const SIGN_IN_INITIAL: SignInState = { status: "idle", errors: {} };

export type OtpState = {
  /** "sent" swaps the form for the "check your mail" card. */
  status: "idle" | "sent" | "error";
  /** Echoed back so the card can name the address the link went to. */
  email: string;
  errors: FieldErrors;
};

export const OTP_INITIAL: OtpState = { status: "idle", email: "", errors: {} };

export type ResetRequestState = {
  status: "idle" | "sent" | "error";
  email: string;
  errors: FieldErrors;
};

export const RESET_REQUEST_INITIAL: ResetRequestState = {
  status: "idle",
  email: "",
  errors: {},
};

export type SignUpState = {
  /**
   * "confirm" means the auth user exists and an email is on its way. The
   * project has auto-confirm off, so sign-up returns no session and there is
   * nothing to redirect to yet.
   */
  status: "idle" | "confirm" | "error";
  email: string;
  errors: FieldErrors;
};

export const SIGN_UP_INITIAL: SignUpState = {
  status: "idle",
  email: "",
  errors: {},
};

export type UpdatePasswordState = {
  status: "idle" | "error";
  errors: FieldErrors;
};

export const UPDATE_PASSWORD_INITIAL: UpdatePasswordState = {
  status: "idle",
  errors: {},
};

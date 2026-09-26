/**
 * The single copy of the auth validation rules.
 *
 * Imported by both the client components and the server actions, so a
 * server-side failure reads exactly like a client-side one. The email regex
 * used to be duplicated byte-for-byte in sign-in-form.tsx, sign-up-flow.tsx
 * and forgot-password-form.tsx; this module replaces all three.
 *
 * Nothing here touches the network or the database, so it is safe in a Client
 * Component. The server must still re-run every one of these checks: the
 * client copy is a convenience, never a guarantee.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Length is the entire password policy today — no case, digit or symbol rule.
 * Keep the Supabase Auth "minimum password length" setting at or below this,
 * otherwise Supabase rejects a password the UI has already accepted and
 * answers with an English string the UI has no slot for.
 */
export const PASSWORD_MIN_LENGTH = 8;

/** Under this age a guardian email is required. */
export const MINOR_AGE = 18;

/**
 * Mirrors profiles_private_birth_date_plausible from
 * 20260906155856_identity_core.sql:
 *   birth_date <= current_date - interval '10 years'  ->  age >= 10
 *   birth_date >  current_date - interval '100 years' ->  age <= 99
 * A violated check fails the auth.users insert itself, so this has to be
 * caught before calling signUp, not after.
 */
export const MIN_AGE = 10;
export const MAX_AGE = 99;

/**
 * Every user-facing auth string. The first block is verbatim what the forms
 * showed before this task; do not reword them, they are the contract the
 * screens were designed against.
 */
export const AUTH_MESSAGES = {
  emailRequired: "Entrez votre email.",
  emailInvalid: "Format d'email invalide.",
  /** Sign-in wording. */
  passwordRequired: "Entrez votre mot de passe.",
  /** Sign-up wording — deliberately different from the sign-in one. */
  passwordRequiredNew: "Entrez un mot de passe.",
  /** Literal on purpose: it must stay byte-identical to the designed copy. */
  passwordTooShort: "8 caractères minimum.",
  nameTooShort: "Entrez au moins 2 caractères.",
  dobInvalid: "Date de naissance invalide.",
  guardianRequired: "Requis pour les moins de 18 ans.",

  // Server-side outcomes. These have no client-side equivalent, so they are
  // new strings — all of them land in the shared `form` error slot.
  invalidCredentials: "Email ou mot de passe incorrect.",
  emailNotConfirmed:
    "Confirmez votre email avant de vous connecter. Le lien est dans votre boîte mail.",
  emailTaken: "Cet email est déjà utilisé. Connectez-vous plutôt.",
  unknownEmail: "Aucun compte darso n'est associé à cet email.",
  rateLimited: "Trop de tentatives. Réessayez dans quelques minutes.",
  linkInvalid: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.",
  recoverySessionMissing:
    "Votre lien de réinitialisation a expiré. Demandez-en un nouveau.",
  samePassword: "Choisissez un mot de passe différent de l'ancien.",
  passwordsDiffer: "Les deux mots de passe ne correspondent pas.",
  unexpected: "Une erreur est survenue. Réessayez.",
} as const;

/**
 * Query-string codes /auth/callback uses to hand a failure back to a form.
 * The code stays short and opaque in the URL; the French sentence is looked
 * up here, so the two cannot drift apart.
 */
export const AUTH_ERROR_PARAMS = {
  linkInvalid: "lien-invalide",
  sessionExpired: "session-expiree",
} as const;

export function messageForErrorParam(
  code: string | null | undefined,
): string | undefined {
  if (code === AUTH_ERROR_PARAMS.linkInvalid) return AUTH_MESSAGES.linkInvalid;
  if (code === AUTH_ERROR_PARAMS.sessionExpired)
    return AUTH_MESSAGES.recoverySessionMissing;
  return undefined;
}

export type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  dob?: string;
  parentEmail?: string;
  /** The whole-form slot the sign-in screen already styles. */
  form?: string;
};

export function validateEmail(raw: string): string | undefined {
  const email = raw.trim();
  if (!email) return AUTH_MESSAGES.emailRequired;
  if (!EMAIL_RE.test(email)) return AUTH_MESSAGES.emailInvalid;
  return undefined;
}

export function validatePassword(
  raw: string,
  options: { isNew?: boolean } = {},
): string | undefined {
  if (!raw)
    return options.isNew
      ? AUTH_MESSAGES.passwordRequiredNew
      : AUTH_MESSAGES.passwordRequired;
  if (raw.length < PASSWORD_MIN_LENGTH) return AUTH_MESSAGES.passwordTooShort;
  return undefined;
}

/**
 * Age from the three raw strings the sign-up form collects. Returns null for
 * anything that is not a real past calendar date: a year that is not exactly
 * four digits, 31 February, or a date in the future.
 */
export function computeAge(d: string, m: string, y: string): number | null {
  if (d.length < 1 || m.length < 1 || y.length !== 4) return null;
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year))
    return null;
  const dt = new Date(year, month - 1, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  )
    return null;
  const now = new Date();
  if (dt.getTime() > now.getTime()) return null;
  let age = now.getFullYear() - year;
  const beforeBirthday =
    now.getMonth() < month - 1 ||
    (now.getMonth() === month - 1 && now.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

/** True while the person is under 18. A null age is not a minor, it is invalid. */
export function isMinor(age: number | null): boolean {
  return age !== null && age < MINOR_AGE;
}

/** Inside the range the profiles_private check constraint accepts. */
export function isPlausibleAge(age: number | null): age is number {
  return age !== null && age >= MIN_AGE && age <= MAX_AGE;
}

/**
 * The `birth_date` key of the sign-up metadata. The trigger parses this into
 * profiles_private.birth_date; we never write that column ourselves.
 */
export function composeBirthDate(
  d: string,
  m: string,
  y: string,
): string | null {
  if (computeAge(d, m, y) === null) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export type IdentityInput = {
  fullName: string;
  email: string;
  password: string;
  dobD: string;
  dobM: string;
  dobY: string;
  parentEmail: string;
};

/**
 * The whole identity step, client and server. The two age rules the client
 * never had — a lower bound and an upper bound — are enforced here, so the
 * database check constraint is a backstop rather than the first line of
 * defence.
 */
export function validateIdentity(input: IdentityInput): FieldErrors {
  const errors: FieldErrors = {};

  if (input.fullName.trim().length < 2)
    errors.fullName = AUTH_MESSAGES.nameTooShort;

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password, { isNew: true });
  if (passwordError) errors.password = passwordError;

  const age = computeAge(input.dobD, input.dobM, input.dobY);
  if (!isPlausibleAge(age)) errors.dob = AUTH_MESSAGES.dobInvalid;

  if (isMinor(age)) {
    if (!input.parentEmail.trim())
      errors.parentEmail = AUTH_MESSAGES.guardianRequired;
    else if (!EMAIL_RE.test(input.parentEmail.trim()))
      errors.parentEmail = AUTH_MESSAGES.emailInvalid;
  }

  return errors;
}

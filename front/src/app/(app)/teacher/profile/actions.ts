"use server";

import { revalidatePath } from "next/cache";

import { serverDb, type Db } from "@/lib/data/db";
import { idsForSlugs } from "@/lib/data/reference";
import { getServerReferenceVocabularies } from "@/lib/data/reference-server";
import { parseMajorToMinor } from "@/lib/money";

import type { SaveState } from "./form-state";

/* ================================================================
   Action state · consumed through useActionState
   ================================================================ */

function fail(message: string, errors?: Record<string, string>): SaveState {
  return { status: "error", message, errors };
}

function ok(message: string): SaveState {
  return { status: "success", message };
}

const NOT_SIGNED_IN =
  "Session expirée. Reconnecte-toi pour enregistrer tes modifications.";
const NOT_A_TEACHER = "Ce compte n'est pas un compte prof.";
const GENERIC_FAILURE = "Enregistrement impossible. Réessaie dans un instant.";

/* ================================================================
   Authorisation
   ================================================================ */

/**
 * Every Server Action is reachable by direct POST, not only through the form,
 * so authorisation is re-checked here and never assumed from the page. The
 * role comes from `profiles.role`, the single source of truth, never from
 * `user.user_metadata.role`, which the user can rewrite.
 *
 * RLS would refuse a foreign write anyway; this exists so the refusal is a
 * French message instead of a silent zero-row update.
 */
async function requireTeacher(): Promise<
  { ok: true; db: Db; userId: string } | { ok: false; state: SaveState }
> {
  const db = await serverDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { ok: false, state: fail(NOT_SIGNED_IN) };

  const { data: profile } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "teacher") {
    return { ok: false, state: fail(NOT_A_TEACHER) };
  }
  return { ok: true, db, userId: user.id };
}

/* ================================================================
   Validation · mirrors the database constraints, in French
   ================================================================ */

const USERNAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PHONE_RE = /^\+?[0-9][0-9 .-]{5,24}$/;
const UI_LOCALES = ["fr", "ar", "en"];

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function slugs(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/**
 * Postgres speaks SQLSTATE. Turn the handful this form can actually provoke
 * into the message the teacher needs, and never leak a raw driver error.
 */
function messageForDbError(
  error: { code?: string; message: string },
  fieldByConstraint: Record<string, [string, string]> = {},
): SaveState {
  if (error.code === "23505") {
    if (error.message.includes("teacher_profiles_username_key")) {
      return fail("Ce nom d'utilisateur est déjà pris.", {
        username: "Déjà pris.",
      });
    }
  }
  if (error.code === "23514" || error.code === "22023") {
    for (const [constraint, [field, message]] of Object.entries(
      fieldByConstraint,
    )) {
      if (error.message.includes(constraint)) {
        return fail(message, { [field]: message });
      }
    }
  }
  // 42501 is the column-level grant refusing a column this action must not
  // touch. That is a bug in the action, not something the teacher can fix.
  if (error.code === "42501") {
    return fail("Modification refusée: colonne non autorisée.");
  }
  return fail(GENERIC_FAILURE);
}

/* ================================================================
   Join-table sets · public read, owner insert and delete, no update
   ================================================================ */

async function replaceSubjects(db: Db, teacherId: string, ids: number[]) {
  const { error: delError } = await db
    .from("teacher_subjects")
    .delete()
    .eq("teacher_id", teacherId);
  if (delError) return delError;
  if (ids.length === 0) return null;
  const { error } = await db
    .from("teacher_subjects")
    .insert(ids.map((subject_id) => ({ teacher_id: teacherId, subject_id })));
  return error;
}

async function replaceLevels(db: Db, teacherId: string, ids: number[]) {
  const { error: delError } = await db
    .from("teacher_levels")
    .delete()
    .eq("teacher_id", teacherId);
  if (delError) return delError;
  if (ids.length === 0) return null;
  const { error } = await db
    .from("teacher_levels")
    .insert(ids.map((level_id) => ({ teacher_id: teacherId, level_id })));
  return error;
}

async function replaceLanguages(db: Db, teacherId: string, ids: number[]) {
  const { error: delError } = await db
    .from("teacher_languages")
    .delete()
    .eq("teacher_id", teacherId);
  if (delError) return delError;
  if (ids.length === 0) return null;
  const { error } = await db
    .from("teacher_languages")
    .insert(ids.map((language_id) => ({ teacher_id: teacherId, language_id })));
  return error;
}

function revalidateProfile(username?: string) {
  revalidatePath("/teacher/profile");
  if (username) revalidatePath(`/teacher/preview/${username}`);
}

/* ================================================================
   1) Profil · identity and the public shop window
   ================================================================ */

export async function saveProfileSection(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.state;
  const { db, userId } = auth;

  const fullName = text(formData, "fullName");
  const username = text(formData, "username").toLowerCase();
  const tagline = text(formData, "tagline");
  const bio = text(formData, "bio");
  const city = text(formData, "city");
  const languageSlugs = slugs(formData, "languages");

  const errors: Record<string, string> = {};
  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = "Entrez entre 2 et 120 caractères.";
  }
  if (username.length < 3 || username.length > 40) {
    errors.username = "Entre 3 et 40 caractères.";
  } else if (!USERNAME_RE.test(username)) {
    errors.username = "Minuscules, chiffres et tirets uniquement.";
  }
  if (tagline.length > 120) errors.tagline = "120 caractères maximum.";
  if (bio.length > 2000) errors.bio = "2000 caractères maximum.";
  if (city.length > 80) errors.city = "80 caractères maximum.";
  if (Object.keys(errors).length > 0) {
    return fail("Corrige les champs signalés.", errors);
  }

  const { languages } = await getServerReferenceVocabularies();
  const languageIds = idsForSlugs(languages, languageSlugs);

  // profiles: only full_name, city, avatar_path and ui_locale are in the
  // column-level UPDATE grant. Naming anything else is a permission error.
  const { error: profileError } = await db
    .from("profiles")
    .update({ full_name: fullName, city: city === "" ? null : city })
    .eq("id", userId);
  if (profileError) {
    return messageForDbError(profileError, {
      profiles_full_name_len: ["fullName", "Nom complet invalide."],
      profiles_city_len: ["city", "Ville invalide."],
    });
  }

  const { error: teacherError } = await db
    .from("teacher_profiles")
    .update({
      username,
      tagline: tagline === "" ? null : tagline,
      bio: bio === "" ? null : bio,
    })
    .eq("user_id", userId);
  if (teacherError) {
    return messageForDbError(teacherError, {
      teacher_profiles_username_format: [
        "username",
        "Nom d'utilisateur invalide.",
      ],
      teacher_profiles_tagline_len: ["tagline", "120 caractères maximum."],
      teacher_profiles_bio_len: ["bio", "2000 caractères maximum."],
    });
  }

  const languageError = await replaceLanguages(db, userId, languageIds);
  if (languageError) return messageForDbError(languageError);

  revalidateProfile(username);
  return ok("Profil enregistré.");
}

/* ================================================================
   2) Enseignement · subjects, levels, rate, experience, timezone
   ================================================================ */

export async function saveTeachingSection(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.state;
  const { db, userId } = auth;

  const subjectSlugs = slugs(formData, "subjects");
  const levelSlugs = slugs(formData, "levels");
  const experienceRaw = text(formData, "experience");
  const rateRaw = text(formData, "hourlyRate");
  const timezone = text(formData, "timezone");

  const errors: Record<string, string> = {};

  let yearsExperience: number | null = null;
  if (experienceRaw !== "") {
    if (!/^\d{1,2}$/.test(experienceRaw)) {
      errors.experience = "Nombre entier d'années.";
    } else {
      yearsExperience = Number.parseInt(experienceRaw, 10);
      if (yearsExperience > 60) errors.experience = "60 ans maximum.";
    }
  }

  let hourlyRateMinor: number | null = null;
  const parsedRate = parseMajorToMinor(rateRaw);
  if (parsedRate === "invalid") {
    errors.hourlyRate = "Montant invalide.";
  } else {
    hourlyRateMinor = parsedRate;
  }

  if (timezone === "") {
    errors.timezone = "Choisis un fuseau horaire.";
  }

  if (Object.keys(errors).length > 0) {
    return fail("Corrige les champs signalés.", errors);
  }

  const { subjects, levels } = await getServerReferenceVocabularies();
  const subjectIds = idsForSlugs(subjects, subjectSlugs);
  const levelIds = idsForSlugs(levels, levelSlugs);

  // The currency stays whatever the row already carries. It is never taken
  // from the form and never hardcoded at a call site.
  const { error: teacherError } = await db
    .from("teacher_profiles")
    .update({
      hourly_rate_minor: hourlyRateMinor,
      years_experience: yearsExperience,
      timezone,
    })
    .eq("user_id", userId);
  if (teacherError) {
    return messageForDbError(teacherError, {
      teacher_profiles_experience_range: [
        "experience",
        "Entre 0 et 60 ans.",
      ],
      teacher_profiles_hourly_rate_nonneg: [
        "hourlyRate",
        "Le tarif ne peut pas être négatif.",
      ],
      "Fuseau horaire inconnu": ["timezone", "Fuseau horaire inconnu."],
    });
  }

  const subjectError = await replaceSubjects(db, userId, subjectIds);
  if (subjectError) return messageForDbError(subjectError);
  const levelError = await replaceLevels(db, userId, levelIds);
  if (levelError) return messageForDbError(levelError);

  const { data: row } = await db
    .from("teacher_profiles")
    .select("username")
    .eq("user_id", userId)
    .maybeSingle();

  revalidateProfile(row?.username);
  return ok("Enseignement enregistré.");
}

/* ================================================================
   3) Compte · phone and interface language
   ================================================================ */

export async function saveAccountSection(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.state;
  const { db, userId } = auth;

  const phone = text(formData, "phone");
  const uiLocale = text(formData, "uiLocale");

  const errors: Record<string, string> = {};
  if (phone !== "" && !PHONE_RE.test(phone)) {
    errors.phone = "Numéro invalide.";
  }
  if (!UI_LOCALES.includes(uiLocale)) {
    errors.uiLocale = "Langue non prise en charge.";
  }
  if (Object.keys(errors).length > 0) {
    return fail("Corrige les champs signalés.", errors);
  }

  // profiles_private is owner-only and never joined into a public read. The
  // birth date is not writable from this screen: it is set once at sign-up and
  // the UI already labels it "Non modifiable".
  const { error: privateError } = await db
    .from("profiles_private")
    .update({ phone: phone === "" ? null : phone })
    .eq("user_id", userId);
  if (privateError) {
    return messageForDbError(privateError, {
      profiles_private_phone_format: ["phone", "Numéro invalide."],
    });
  }

  const { error: profileError } = await db
    .from("profiles")
    .update({ ui_locale: uiLocale })
    .eq("id", userId);
  if (profileError) {
    return messageForDbError(profileError, {
      profiles_ui_locale_allowed: ["uiLocale", "Langue non prise en charge."],
    });
  }

  revalidateProfile();
  return ok("Compte enregistré.");
}

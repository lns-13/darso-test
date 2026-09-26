/**
 * Teacher identity: `teacher_profiles`, its three join tables, and the
 * `teacher_public_profiles` view.
 *
 * Two distinct reads live here and they must not be confused:
 *
 *   - `getPublicTeacherByUsername` is the shop window. It reads the view,
 *     which is `security_invoker` and exposes a fixed safe column list, and it
 *     works signed out. Nothing from `profiles_private` is reachable from it.
 *   - `getOwnTeacherProfile` is the owner reading their own record.
 *
 * The view exists so the public read cannot accidentally widen: adding a
 * column to `teacher_profiles` does not add it to the view.
 */

import type { DarsoClient, TeacherProfileRow } from "./types.ts";
import { unwrap, unwrapMaybe } from "./types.ts";

/* ---------------------------------------------------------------------------
   Public shop window
--------------------------------------------------------------------------- */

/**
 * Exactly the columns `/teacher/preview/[username]` may show. `timezone` is
 * included because published hours are meaningless without the zone they are
 * expressed in; it is not private.
 */
const PUBLIC_TEACHER_COLUMNS =
  "user_id, username, full_name, city, avatar_path, tagline, bio, hourly_rate_minor, currency, years_experience, timezone, created_at";

/**
 * The view's columns are all typed `| null` because Postgres cannot prove a
 * view column is non-null through a join, even when the underlying column is
 * `not null`. Rather than sprinkling `!` at every render site, the shape is
 * narrowed once here: a row missing `user_id`, `username`, `full_name` or
 * `currency` is not a teacher we can render, so it is treated as absent.
 */
export type PublicTeacher = {
  userId: string;
  username: string;
  fullName: string;
  city: string | null;
  avatarPath: string | null;
  tagline: string | null;
  bio: string | null;
  hourlyRateMinor: number | null;
  currency: string;
  yearsExperience: number | null;
  timezone: string | null;
  createdAt: string | null;
};

type PublicTeacherViewRow = {
  user_id: string | null;
  username: string | null;
  full_name: string | null;
  city: string | null;
  avatar_path: string | null;
  tagline: string | null;
  bio: string | null;
  hourly_rate_minor: number | null;
  currency: string | null;
  years_experience: number | null;
  timezone: string | null;
  created_at: string | null;
};

function narrowPublicTeacher(row: PublicTeacherViewRow): PublicTeacher | null {
  const { user_id, username, full_name, currency } = row;
  if (user_id === null || username === null || full_name === null || currency === null) {
    return null;
  }
  return {
    userId: user_id,
    username,
    fullName: full_name,
    city: row.city,
    avatarPath: row.avatar_path,
    tagline: row.tagline,
    bio: row.bio,
    hourlyRateMinor: row.hourly_rate_minor,
    currency,
    yearsExperience: row.years_experience,
    timezone: row.timezone,
    createdAt: row.created_at,
  };
}

/** Resolves the `[username]` route parameter. Readable signed out. */
export async function getPublicTeacherByUsername(
  client: DarsoClient,
  username: string,
): Promise<PublicTeacher | null> {
  const result = await client
    .from("teacher_public_profiles")
    .select(PUBLIC_TEACHER_COLUMNS)
    .eq("username", username)
    .maybeSingle();
  const row = unwrapMaybe("getPublicTeacherByUsername", result);
  return row === null ? null : narrowPublicTeacher(row);
}

/** The public teacher directory. Readable signed out. */
export async function listPublicTeachers(
  client: DarsoClient,
  limit = 50,
): Promise<PublicTeacher[]> {
  const result = await client
    .from("teacher_public_profiles")
    .select(PUBLIC_TEACHER_COLUMNS)
    .order("created_at", { ascending: true })
    .limit(limit);
  return unwrap("listPublicTeachers", result)
    .map(narrowPublicTeacher)
    .filter((t): t is PublicTeacher => t !== null);
}

/* ---------------------------------------------------------------------------
   Join tables — subjects, levels, languages taught
   ---------------------------------------------------------------------------
   Public read, owner insert and delete, no update: the set is replaced rather
   than edited. Each read embeds the reference row so callers get slugs and
   display names without a second round trip, and never has to map an id it
   should not be holding in the first place.
--------------------------------------------------------------------------- */

export type TaughtEntry = { slug: string; name: string };

function flattenEmbedded(
  rows: Array<{ subjects?: unknown; levels?: unknown; languages?: unknown }>,
  key: "subjects" | "levels" | "languages",
): TaughtEntry[] {
  const out: TaughtEntry[] = [];
  for (const row of rows) {
    const embedded = row[key] as { slug: string; name: string } | null | undefined;
    if (embedded && typeof embedded.slug === "string") {
      out.push({ slug: embedded.slug, name: embedded.name });
    }
  }
  return out;
}

export async function listTeacherSubjects(
  client: DarsoClient,
  teacherId: string,
): Promise<TaughtEntry[]> {
  const result = await client
    .from("teacher_subjects")
    .select("subject_id, subjects(slug, name, sort_order)")
    .eq("teacher_id", teacherId);
  const rows = unwrap("listTeacherSubjects", result);
  return flattenEmbedded(rows, "subjects");
}

export async function listTeacherLevels(
  client: DarsoClient,
  teacherId: string,
): Promise<TaughtEntry[]> {
  const result = await client
    .from("teacher_levels")
    .select("level_id, levels(slug, name, sort_order)")
    .eq("teacher_id", teacherId);
  const rows = unwrap("listTeacherLevels", result);
  return flattenEmbedded(rows, "levels");
}

export async function listTeacherLanguages(
  client: DarsoClient,
  teacherId: string,
): Promise<TaughtEntry[]> {
  const result = await client
    .from("teacher_languages")
    .select("language_id, languages(slug, name, sort_order)")
    .eq("teacher_id", teacherId);
  const rows = unwrap("listTeacherLanguages", result);
  return flattenEmbedded(rows, "languages");
}

export type PublicTeacherWithTaught = PublicTeacher & {
  subjects: TaughtEntry[];
  levels: TaughtEntry[];
  languages: TaughtEntry[];
};

/** The full public profile: the view plus the three public join tables. */
export async function getPublicTeacherProfile(
  client: DarsoClient,
  username: string,
): Promise<PublicTeacherWithTaught | null> {
  const teacher = await getPublicTeacherByUsername(client, username);
  if (teacher === null) return null;

  const [subjects, levels, languages] = await Promise.all([
    listTeacherSubjects(client, teacher.userId),
    listTeacherLevels(client, teacher.userId),
    listTeacherLanguages(client, teacher.userId),
  ]);

  return { ...teacher, subjects, levels, languages };
}

/* ---------------------------------------------------------------------------
   Owner-side read and write
--------------------------------------------------------------------------- */

const OWN_TEACHER_COLUMNS =
  "user_id, username, tagline, bio, hourly_rate_minor, currency, years_experience, timezone";

export type OwnTeacherProfile = Pick<
  TeacherProfileRow,
  | "user_id"
  | "username"
  | "tagline"
  | "bio"
  | "hourly_rate_minor"
  | "currency"
  | "years_experience"
  | "timezone"
>;

export async function getOwnTeacherProfile(
  client: DarsoClient,
  userId: string,
): Promise<OwnTeacherProfile | null> {
  const result = await client
    .from("teacher_profiles")
    .select(OWN_TEACHER_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  return unwrapMaybe("getOwnTeacherProfile", result);
}

/** Mirrors the column-level UPDATE grant. `user_id` and `role` are not in it. */
export type TeacherProfilePatch = Partial<
  Pick<
    TeacherProfileRow,
    | "username"
    | "tagline"
    | "bio"
    | "hourly_rate_minor"
    | "currency"
    | "years_experience"
  >
>;

export async function updateOwnTeacherProfile(
  client: DarsoClient,
  userId: string,
  patch: TeacherProfilePatch,
): Promise<OwnTeacherProfile> {
  const result = await client
    .from("teacher_profiles")
    .update(patch)
    .eq("user_id", userId)
    .select(OWN_TEACHER_COLUMNS)
    .single();
  return unwrap("updateOwnTeacherProfile", result);
}

/**
 * Replace a teacher's subject set.
 *
 * The join tables carry no UPDATE grant by design, so a change is a delete
 * followed by an insert. Not transactional from the client: a failure between
 * the two leaves the set empty. Acceptable for a settings screen the owner is
 * looking at, and the alternative is an RPC, which Task 01 deliberately did not
 * create. Noted here so the next person does not discover it at 2am.
 */
export async function replaceTeacherSubjects(
  client: DarsoClient,
  teacherId: string,
  subjectIds: number[],
): Promise<void> {
  const del = await client
    .from("teacher_subjects")
    .delete()
    .eq("teacher_id", teacherId);
  if (del.error) throw unwrapErr("replaceTeacherSubjects.delete", del.error);

  if (subjectIds.length === 0) return;

  const ins = await client
    .from("teacher_subjects")
    .insert(subjectIds.map((subject_id) => ({ teacher_id: teacherId, subject_id })));
  if (ins.error) throw unwrapErr("replaceTeacherSubjects.insert", ins.error);
}

function unwrapErr(
  operation: string,
  error: { message: string; code?: string; details?: string; hint?: string },
) {
  // Small local helper so the delete/insert pair reports which half failed.
  return Object.assign(new Error(`${operation}: ${error.message}`), {
    name: "DataError",
    code: error.code,
  });
}

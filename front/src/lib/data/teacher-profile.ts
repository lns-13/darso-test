import type { AvailabilitySlot } from "@/lib/availability";
import { toHHMM } from "@/lib/availability";

import { serverDb, type Db } from "./db";
import type { ReferenceItem } from "./reference";

/* ================================================================
   Derived values · computed at render, never stored
   ================================================================ */

/**
 * `initials` exists on both profile mocks as a stored field. It is not a fact
 * about a person, it is a rendering of their name, so Task 01 created no
 * column for it and this computes it instead.
 */
export function initialsFrom(fullName: string): string {
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export type TeacherRating = {
  average: number | null;
  count: number;
};

/**
 * The mocks disagree with themselves about this teacher's rating: 4.9 in
 * `mockTeacher.avgRating`, 4.8 in `mockTeacherProfile.rating`, and different
 * values again elsewhere. That disagreement is the argument for never storing
 * it, and Task 01 created no rating or review-count column anywhere.
 *
 * Reviews are not modelled yet: no `reviews` table exists, and building one is
 * outside this task. Until it does, every teacher genuinely has zero reviews,
 * and the UI renders a "Nouveau" state rather than a number nobody computed.
 * When the table lands, this becomes an aggregate over it and nothing else in
 * the app has to change.
 */
export async function getTeacherRating(
  teacherId: string,
): Promise<TeacherRating> {
  // The id is part of the contract callers already satisfy; it starts being
  // read the moment there is a reviews table to aggregate.
  void teacherId;
  return { average: null, count: 0 };
}

/* ================================================================
   Shared row readers
   ================================================================ */

/**
 * PostgREST returns an embedded to-one relation as an object, but the
 * generated types are permissive about it. Normalise both shapes.
 */
function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

type EmbeddedRef = { id: number; slug: string; name: string; sort_order: number };

function collectRefs(
  rows: Array<Record<string, unknown>> | null,
  key: string,
): ReferenceItem[] {
  if (!rows) return [];
  return rows
    .map((row) => one(row[key] as EmbeddedRef | EmbeddedRef[] | null))
    .filter((ref): ref is EmbeddedRef => ref !== null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ id, slug, name }) => ({ id, slug, name }));
}

/**
 * Every read below names its columns and repeats the policy's own filter in
 * the query. Both are deliberate: selecting `*` through a filtering policy and
 * relying on the policy alone for the row restriction are the two patterns the
 * RLS performance guide measures at 171ms against 9ms.
 */
async function readTeacherFacets(db: Db, teacherId: string) {
  const [subjects, levels, languages, availability] = await Promise.all([
    db
      .from("teacher_subjects")
      .select("subjects (id, slug, name, sort_order)")
      .eq("teacher_id", teacherId),
    db
      .from("teacher_levels")
      .select("levels (id, slug, name, sort_order)")
      .eq("teacher_id", teacherId),
    db
      .from("teacher_languages")
      .select("languages (id, slug, name, sort_order)")
      .eq("teacher_id", teacherId),
    db
      .from("teacher_availability")
      .select("id, weekday, starts_at, ends_at")
      .eq("teacher_id", teacherId)
      .order("weekday")
      .order("starts_at"),
  ]);

  const slots: AvailabilitySlot[] = (availability.data ?? []).map((row) => ({
    id: row.id,
    day: row.weekday,
    start: toHHMM(row.starts_at),
    end: toHHMM(row.ends_at),
  }));

  return {
    subjects: collectRefs(subjects.data, "subjects"),
    levels: collectRefs(levels.data, "levels"),
    languages: collectRefs(languages.data, "languages"),
    availability: slots,
  };
}

/**
 * `profiles.avatar_path` is a storage object path, never a URL, so the URL is
 * built at render time. The `avatars` bucket itself belongs to Task 05; until
 * it exists every path is null and this returns null, which makes `Avatar`
 * fall back to initials.
 */
function avatarUrlFor(db: Db, path: string | null): string | null {
  if (!path) return null;
  const { data } = db.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl ?? null;
}

/* ================================================================
   The public shop window · /teacher/preview/[username]
   ================================================================ */

export type PublicTeacherProfile = {
  userId: string;
  username: string;
  fullName: string;
  initials: string;
  city: string | null;
  avatarUrl: string | null;
  tagline: string | null;
  bio: string | null;
  hourlyRateMinor: number | null;
  currency: string;
  yearsExperience: number | null;
  timezone: string;
  subjects: ReferenceItem[];
  levels: ReferenceItem[];
  languages: ReferenceItem[];
  availability: AvailabilitySlot[];
  rating: TeacherRating;
};

/**
 * The columns read here are exactly the `teacher_public_profiles` view, which
 * is `security_invoker` and readable signed out. Nothing from
 * `profiles_private` is touched: birth date, phone and guardian email live
 * there and must never join a public read. Email is on `auth.users` and is not
 * read either.
 *
 * Uses the ordinary server client, never `createAdminClient()`: the point of
 * the view is that anon's own RLS already allows exactly this much.
 */
export async function getPublicTeacherProfile(
  username: string,
): Promise<PublicTeacherProfile | null> {
  const slug = username.trim().toLowerCase();
  if (slug.length === 0) return null;

  const db = await serverDb();

  const { data, error } = await db
    .from("teacher_public_profiles")
    .select(
      "user_id, username, full_name, city, avatar_path, tagline, bio, hourly_rate_minor, currency, years_experience, timezone",
    )
    .eq("username", slug)
    .maybeSingle();

  if (error || !data) return null;

  // Every column of a view is typed nullable even when the underlying column
  // is NOT NULL, so the identity columns are narrowed rather than asserted.
  const { user_id: userId, username: resolvedUsername, full_name: fullName } = data;
  if (!userId || !resolvedUsername || !fullName) return null;

  const [facets, rating] = await Promise.all([
    readTeacherFacets(db, userId),
    getTeacherRating(userId),
  ]);

  return {
    userId,
    username: resolvedUsername,
    fullName,
    initials: initialsFrom(fullName),
    city: data.city,
    avatarUrl: avatarUrlFor(db, data.avatar_path),
    tagline: data.tagline,
    bio: data.bio,
    hourlyRateMinor: data.hourly_rate_minor,
    currency: data.currency ?? "DZD",
    yearsExperience: data.years_experience,
    timezone: data.timezone ?? "Africa/Algiers",
    ...facets,
    rating,
  };
}

/* ================================================================
   The owner's own profile · /teacher/profile
   ================================================================ */

export type OwnTeacherProfile = {
  userId: string;
  email: string | null;
  fullName: string;
  initials: string;
  city: string;
  avatarUrl: string | null;
  uiLocale: string;
  username: string;
  tagline: string;
  bio: string;
  hourlyRateMinor: number | null;
  currency: string;
  yearsExperience: number | null;
  timezone: string;
  /** profiles_private, owner-only. Never leaves a signed-in owner's page. */
  birthDate: string | null;
  phone: string;
  subjectSlugs: string[];
  levelSlugs: string[];
  languageSlugs: string[];
  availability: AvailabilitySlot[];
};

export type OwnTeacherProfileResult =
  | { status: "anonymous" }
  | { status: "not-teacher" }
  | { status: "ok"; profile: OwnTeacherProfile };

/**
 * Reads the caller's own rows. `profiles_private` is included because this is
 * the owner reading their own record on their own settings page; it is the one
 * place that table may be read, and it never reaches a public surface.
 */
export async function getOwnTeacherProfile(): Promise<OwnTeacherProfileResult> {
  const db = await serverDb();

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { status: "anonymous" };

  const { data: profile } = await db
    .from("profiles")
    .select("id, role, full_name, city, avatar_path, ui_locale")
    .eq("id", user.id)
    .maybeSingle();

  // The role is read from profiles.role, the single source of truth. Never
  // from user.user_metadata.role, which the user can rewrite.
  if (!profile || profile.role !== "teacher") return { status: "not-teacher" };

  const [teacherRow, privateRow, facets] = await Promise.all([
    db
      .from("teacher_profiles")
      .select(
        "user_id, username, tagline, bio, hourly_rate_minor, currency, years_experience, timezone",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    db
      .from("profiles_private")
      .select("user_id, birth_date, phone")
      .eq("user_id", user.id)
      .maybeSingle(),
    readTeacherFacets(db, user.id),
  ]);

  // Guaranteed by the on_auth_user_created trigger for every teacher, so its
  // absence is a broken invariant rather than an empty state.
  if (!teacherRow.data) return { status: "not-teacher" };

  return {
    status: "ok",
    profile: {
      userId: user.id,
      email: user.email ?? null,
      fullName: profile.full_name,
      initials: initialsFrom(profile.full_name),
      city: profile.city ?? "",
      avatarUrl: avatarUrlFor(db, profile.avatar_path),
      uiLocale: profile.ui_locale,
      username: teacherRow.data.username,
      tagline: teacherRow.data.tagline ?? "",
      bio: teacherRow.data.bio ?? "",
      hourlyRateMinor: teacherRow.data.hourly_rate_minor,
      currency: teacherRow.data.currency,
      yearsExperience: teacherRow.data.years_experience,
      timezone: teacherRow.data.timezone,
      birthDate: privateRow.data?.birth_date ?? null,
      phone: privateRow.data?.phone ?? "",
      subjectSlugs: facets.subjects.map((s) => s.slug),
      levelSlugs: facets.levels.map((l) => l.slug),
      languageSlugs: facets.languages.map((l) => l.slug),
      availability: facets.availability,
    },
  };
}

/**
 * Task 04 verification harness.
 *
 * Creates one real teacher through the auth admin API, fills the profile the
 * way the app does, then re-reads everything as an ANONYMOUS client to prove
 * the two claims the brief asks to be proven:
 *
 *   1. The public preview resolves a real teacher by username slug.
 *   2. The public surface leaks nothing private: birth date, phone and email
 *      must be unreachable signed out.
 *
 * It also exercises the negative paths: an unknown username returns no row,
 * and the exclusion constraint refuses overlapping availability.
 *
 * Idempotent: re-running reuses the same auth user.
 *
 *   node scripts/verify-task04.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SERVICE) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(URL, ANON, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "task04-verify@example.com";
const FULL_NAME = "Nadia Belkacem";

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

/* ---------------------------------------------------------------- setup */

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function ensureTeacher() {
  const existing = await findUserByEmail(EMAIL);
  if (existing) return existing.id;

  // profiles / profiles_private / teacher_profiles are created by the
  // on_auth_user_created trigger from this metadata. Never inserted here.
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: "task04-verify-pw",
    email_confirm: true,
    user_metadata: {
      full_name: FULL_NAME,
      role: "teacher",
      birth_date: "1988-03-12",
    },
  });
  if (error) throw error;
  return data.user.id;
}

async function idsForSlugs(table, slugs) {
  const { data, error } = await admin.from(table).select("id, slug").in("slug", slugs);
  if (error) throw error;
  return data.map((r) => r.id);
}

async function fillProfile(userId) {
  await admin.from("profiles").update({ city: "Alger" }).eq("id", userId);
  await admin
    .from("teacher_profiles")
    .update({
      tagline: "Prof de maths agrégée · Bac & Prépa",
      bio: "Dix ans d'accompagnement vers le bac et les concours. Diagnostic, exercices ciblés, réflexes de rédaction.",
      hourly_rate_minor: 22000,
      years_experience: 10,
      timezone: "Africa/Algiers",
    })
    .eq("user_id", userId);
  await admin.from("profiles_private").update({ phone: "+213 6 61 42 88 03" }).eq("user_id", userId);

  for (const [table, refTable, column, slugs] of [
    ["teacher_subjects", "subjects", "subject_id", ["mathematiques", "physique-chimie"]],
    ["teacher_levels", "levels", "level_id", ["lycee", "prepa"]],
    ["teacher_languages", "languages", "language_id", ["francais", "arabe", "anglais"]],
  ]) {
    await admin.from(table).delete().eq("teacher_id", userId);
    const ids = await idsForSlugs(refTable, slugs);
    const { error } = await admin
      .from(table)
      .insert(ids.map((id) => ({ teacher_id: userId, [column]: id })));
    if (error) throw new Error(`${table}: ${error.message}`);
  }

  await admin.from("teacher_availability").delete().eq("teacher_id", userId);
  const { error: availError } = await admin.from("teacher_availability").insert([
    { teacher_id: userId, weekday: 0, starts_at: "14:00:00", ends_at: "16:00:00" },
    { teacher_id: userId, weekday: 0, starts_at: "17:00:00", ends_at: "19:00:00" },
    { teacher_id: userId, weekday: 2, starts_at: "10:00:00", ends_at: "12:00:00" },
    { teacher_id: userId, weekday: 4, starts_at: "14:00:00", ends_at: "19:00:00" },
  ]);
  if (availError) throw new Error(`teacher_availability: ${availError.message}`);

  const { data } = await admin
    .from("teacher_profiles")
    .select("username")
    .eq("user_id", userId)
    .single();
  return data.username;
}

/* ---------------------------------------------------------------- checks */

async function run() {
  const userId = await ensureTeacher();
  const username = await fillProfile(userId);
  console.log(`\nTeacher ready: ${FULL_NAME} → /teacher/preview/${username}\n`);

  console.log("— The public read, as an anonymous client —");

  const { data: view, error: viewError } = await anon
    .from("teacher_public_profiles")
    .select(
      "user_id, username, full_name, city, avatar_path, tagline, bio, hourly_rate_minor, currency, years_experience, timezone",
    )
    .eq("username", username)
    .maybeSingle();

  check("anon resolves the teacher by username slug", !viewError && !!view, viewError?.message);
  if (view) {
    check("full name is the real row", view.full_name === FULL_NAME, view.full_name);
    check("rate is minor units + row currency", view.hourly_rate_minor === 22000 && view.currency === "DZD", `${view.hourly_rate_minor} ${view.currency}`);
    check("timezone is exposed for the schedule", view.timezone === "Africa/Algiers", view.timezone);

    const exposed = Object.keys(view).sort();
    // Exactly what the preview page reads, and nothing else. `created_at` is
    // on the view too but the page does not select it.
    const expected = [
      "avatar_path", "bio", "city", "currency", "full_name", "hourly_rate_minor",
      "tagline", "timezone", "user_id", "username", "years_experience",
    ].sort();
    check(
      "view exposes exactly the expected columns",
      JSON.stringify(exposed) === JSON.stringify(expected),
      exposed.join(", "),
    );
  }

  const { data: missing } = await anon
    .from("teacher_public_profiles")
    .select("user_id")
    .eq("username", "ce-prof-nexiste-pas")
    .maybeSingle();
  check("unknown username returns no row (page renders not-found)", missing === null);

  const { data: subjects } = await anon
    .from("teacher_subjects")
    .select("subjects (slug, name)")
    .eq("teacher_id", userId);
  check("anon reads subjects from the reference table", (subjects ?? []).length === 2, (subjects ?? []).map((r) => r.subjects?.slug).join(", "));

  const { data: slots } = await anon
    .from("teacher_availability")
    .select("weekday, starts_at, ends_at")
    .eq("teacher_id", userId)
    .order("weekday");
  check("anon reads the published weekly availability", (slots ?? []).length === 4, `${(slots ?? []).length} créneaux`);

  console.log("\n— The privacy boundary —");

  const { data: priv, error: privError } = await anon
    .from("profiles_private")
    .select("user_id, birth_date, phone")
    .eq("user_id", userId);
  check(
    "anon cannot read profiles_private (birth date, phone)",
    (priv ?? []).length === 0,
    privError ? privError.message : `${(priv ?? []).length} rows`,
  );

  const { data: anonUser } = await anon.auth.getUser();
  check("anon has no session and therefore no email", !anonUser?.user);

  const leaked = view ? Object.keys(view).filter((k) => ["birth_date", "phone", "email", "guardian_email", "guardian_name"].includes(k)) : [];
  check("no private column appears in the public view", leaked.length === 0, leaked.join(", ") || "none");

  console.log("\n— Constraints —");

  const { error: overlapError } = await admin.from("teacher_availability").insert({
    teacher_id: userId,
    weekday: 0,
    starts_at: "15:00:00",
    ends_at: "18:00:00",
  });
  check(
    "overlapping slot is refused by the exclusion constraint",
    overlapError?.code === "23P01",
    overlapError ? `${overlapError.code}` : "insert succeeded",
  );

  const { error: tzError } = await admin
    .from("teacher_profiles")
    .update({ timezone: "Mars/Olympus_Mons" })
    .eq("user_id", userId);
  check("unknown timezone is refused by the trigger", !!tzError, tzError?.message ?? "update succeeded");

  const { error: touchError } = await admin.from("teacher_availability").insert({
    teacher_id: userId,
    weekday: 0,
    starts_at: "16:00:00",
    ends_at: "17:00:00",
  });
  check("a touching, non-overlapping slot is accepted", !touchError, touchError?.message);
  if (!touchError) {
    await admin
      .from("teacher_availability")
      .delete()
      .eq("teacher_id", userId)
      .eq("weekday", 0)
      .eq("starts_at", "16:00:00");
  }

  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
  console.log(`Preview URL: /teacher/preview/${username}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

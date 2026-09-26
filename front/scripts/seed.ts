/**
 * Idempotent development seed for the identity domain.
 *
 *   node --env-file=.env.local scripts/seed.ts
 *   node --env-file=.env.local scripts/seed.ts --reset
 *
 * Running it twice must not duplicate anything. `--reset` deletes every seeded
 * auth user first, which cascades through `profiles` and everything below it.
 *
 * WHY THE AUTH ADMIN API AND NOT PLAIN INSERTS
 * --------------------------------------------
 * `profiles`, `profiles_private` and the role row are created by the
 * `on_auth_user_created` trigger on `auth.users`, from `raw_user_meta_data`.
 * `profiles` has no client INSERT policy at all. So a person is created by
 * `auth.admin.createUser` and everything else is an UPDATE of rows that
 * already exist, which is also what makes the seed naturally idempotent.
 *
 * WHY VALIDATION HAPPENS BEFORE THE CALL
 * --------------------------------------
 * Verified against the live project: when a CHECK constraint rejects a row the
 * trigger raises, the whole `auth.users` insert is rolled back, and the API
 * returns the opaque `Database error creating new user` with status 500 and no
 * auth row left behind. There is no way to tell an implausible birth date from
 * a missing guardian email after the fact, so every constraint is mirrored in
 * `validate()` and a bad person is reported by name before anything is sent.
 *
 * WHAT IS NOT SEEDED
 * ------------------
 * Only the identity domain exists. There are no tables for sessions,
 * applications, requests, transactions, invoices, payouts, reviews, messages or
 * notifications, so none of that mock content is loaded. It is not skipped
 * because it is hard; it has nowhere to go. See
 * docs/decisions/06-data-reconciliation.md for the shapes those tables must
 * take when a later task creates them.
 */

import { adminClient, type ScriptClient } from "./lib/clients.ts";
import {
  getReferenceVocabularies,
  indexBySlug,
  requireId,
} from "../src/lib/data/reference.ts";
import { ageOn } from "../src/lib/data/derive.ts";
import {
  DEVICES,
  ROLE_CONFLICTS,
  SEED_ANCHOR,
  SEED_EMAIL_DOMAIN,
  SEED_PASSWORD,
  STUDENTS,
  TEACHERS,
  type SeedStudent,
  type SeedTeacher,
} from "./seed-data.ts";

const RESET = process.argv.includes("--reset");

/* ---------------------------------------------------------------------------
   Constraint mirrors
   ---------------------------------------------------------------------------
   Each regex and bound below is copied from a CHECK in
   20260906155856_identity_core.sql or 20260906160019_user_devices.sql. If a
   migration changes, these change with it.
--------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9 .-]{5,24}$/;
const USERNAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const COUNTRY_RE = /^[A-Z]{2}$/;

const problems: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) problems.push(message);
}

function trimmedLength(v: string): number {
  return v.trim().length;
}

/** `birth_date` is checked against `current_date`, so validate against today. */
function validateBirthDate(who: string, birthDate: string, today: Date): number {
  const age = ageOn(birthDate, today);
  if (age === null) {
    problems.push(`${who}: birth date "${birthDate}" is not YYYY-MM-DD`);
    return -1;
  }
  check(age >= 10, `${who}: age ${age} violates profiles_private_birth_date_plausible (must be 10+)`);
  check(age < 100, `${who}: age ${age} violates profiles_private_birth_date_plausible (must be under 100)`);
  return age;
}

function validatePerson(
  who: string,
  fullName: string,
  city: string,
  phone: string | null,
  today: Date,
  birthDate: string,
): number {
  check(
    trimmedLength(fullName) >= 2 && trimmedLength(fullName) <= 120,
    `${who}: full_name length ${trimmedLength(fullName)} outside 2..120`,
  );
  check(
    trimmedLength(city) >= 1 && trimmedLength(city) <= 80,
    `${who}: city length outside 1..80`,
  );
  if (phone !== null) {
    check(PHONE_RE.test(phone), `${who}: phone "${phone}" fails profiles_private_phone_format`);
  }
  return validateBirthDate(who, birthDate, today);
}

function validateTeacher(t: SeedTeacher, today: Date): void {
  const who = `teacher ${t.fullName}`;
  validatePerson(who, t.fullName, t.city, t.phone, today, t.birthDate);

  check(
    USERNAME_RE.test(t.slug) && t.slug.length >= 3 && t.slug.length <= 40,
    `${who}: username "${t.slug}" fails teacher_profiles_username_format`,
  );
  if (t.tagline !== null) {
    check(t.tagline.length <= 120, `${who}: tagline longer than 120`);
  }
  if (t.bio !== null) {
    check(t.bio.length <= 2000, `${who}: bio longer than 2000`);
  }
  if (t.hourlyRateMajor !== null) {
    check(t.hourlyRateMajor >= 0, `${who}: negative hourly rate`);
  }
  if (t.yearsExperience !== null) {
    check(
      t.yearsExperience >= 0 && t.yearsExperience <= 60,
      `${who}: years_experience outside 0..60`,
    );
  }
}

function validateStudent(s: SeedStudent, today: Date): void {
  const who = `student ${s.fullName}`;
  const age = validatePerson(who, s.fullName, s.city, s.phone, today, s.birthDate);

  // profiles_private_guardian_required_for_minors
  if (age >= 0 && age < 18) {
    check(
      s.guardianEmail !== null,
      `${who}: is ${age} and has no guardian email; the insert would fail`,
    );
  }
  if (s.guardianEmail !== null) {
    check(
      EMAIL_RE.test(s.guardianEmail),
      `${who}: guardian email "${s.guardianEmail}" fails the format check`,
    );
  }
  if (s.guardianName !== null) {
    check(
      trimmedLength(s.guardianName) >= 2 && trimmedLength(s.guardianName) <= 120,
      `${who}: guardian_name length outside 2..120`,
    );
  }
  if (s.classLabel !== null) {
    check(
      trimmedLength(s.classLabel) >= 1 && trimmedLength(s.classLabel) <= 60,
      `${who}: class_label length outside 1..60`,
    );
  }
  if (s.school !== null) {
    check(
      trimmedLength(s.school) >= 1 && trimmedLength(s.school) <= 120,
      `${who}: school length outside 1..120`,
    );
  }
  if (s.bio !== null) {
    check(s.bio.length <= 1000, `${who}: student bio longer than 1000`);
  }
}

/* ---------------------------------------------------------------------------
   Auth users
--------------------------------------------------------------------------- */

type AuthUserIndex = Map<string, string>; // lowercased email -> user id

/**
 * Every auth user, by email.
 *
 * `listUsers` takes only `page` and `perPage` — there is no email filter in
 * auth-js 2.x — so the whole list is paged once up front and matched in memory.
 * That is one round trip per thousand users instead of one per person, and it
 * is what makes "find an existing auth user by email before creating one"
 * cheap enough to do for all twenty-four.
 */
async function loadAuthUsers(admin: ScriptClient): Promise<AuthUserIndex> {
  const index: AuthUserIndex = new Map();
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers page ${page}: ${error.message}`);

    for (const user of data.users) {
      if (user.email) index.set(user.email.toLowerCase(), user.id);
    }
    if (data.users.length < perPage) break;
  }
  return index;
}

function emailFor(slug: string): string {
  return `${slug}@${SEED_EMAIL_DOMAIN}`;
}

type PersonMeta = {
  full_name: string;
  role: "student" | "teacher";
  birth_date: string;
  guardian_email?: string;
};

/**
 * Returns the id of the auth user for this email, creating it if absent.
 *
 * The trigger reads `user_metadata` exactly once, at creation. For an account
 * that already exists the metadata is NOT re-sent: `profiles.role` is immutable
 * and re-running the seed must not attempt to change it.
 */
async function ensureAuthUser(
  admin: ScriptClient,
  index: AuthUserIndex,
  email: string,
  meta: PersonMeta,
): Promise<{ id: string; created: boolean }> {
  const existing = index.get(email.toLowerCase());
  if (existing) return { id: existing, created: false };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error || !data.user) {
    throw new Error(
      `createUser(${email}) failed: ${error?.message ?? "no user returned"}. ` +
        `A constraint violation surfaces here as an opaque 500; check validate() first.`,
    );
  }
  index.set(email.toLowerCase(), data.user.id);
  return { id: data.user.id, created: true };
}

/* ---------------------------------------------------------------------------
   Join tables — delete then insert
   ---------------------------------------------------------------------------
   None of the join tables carries an UPDATE grant: a set is replaced, not
   edited. Delete-then-insert is therefore both the intended write pattern and
   the thing that makes a second run a no-op rather than a duplicate-key error.
--------------------------------------------------------------------------- */

async function replaceJoin(
  client: ScriptClient,
  table: "teacher_subjects" | "teacher_levels" | "teacher_languages" | "student_subjects",
  ownerColumn: "teacher_id" | "student_id",
  valueColumn: "subject_id" | "level_id" | "language_id",
  ownerId: string,
  ids: number[],
): Promise<void> {
  // `table` is a union of four relations. They have identical shape, but the
  // only column their generated types share is `created_at`, so the filter and
  // row types collapse to that intersection and have to be erased here. Each
  // call site below pairs a fixed table with its own owner column, so the
  // runtime pairing is still checked where it is written.
  const del = await client.from(table).delete().eq(ownerColumn as never, ownerId);
  if (del.error) throw new Error(`${table} delete: ${del.error.message}`);
  if (ids.length === 0) return;

  const rows = ids.map((id) => ({ [ownerColumn]: ownerId, [valueColumn]: id }));
  const ins = await client.from(table).insert(rows as never);
  if (ins.error) throw new Error(`${table} insert: ${ins.error.message}`);
}

/* ---------------------------------------------------------------------------
   Main
--------------------------------------------------------------------------- */

async function main(): Promise<void> {
  const anchor = new Date(SEED_ANCHOR);
  const today = new Date();

  console.log(`darso seed · anchor ${SEED_ANCHOR} · validating against ${today.toISOString().slice(0, 10)}`);

  for (const t of TEACHERS) validateTeacher(t, today);
  for (const s of STUDENTS) validateStudent(s, today);

  const slugs = [...TEACHERS.map((t) => t.slug), ...STUDENTS.map((s) => s.slug)];
  const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  check(duplicates.length === 0, `duplicate slugs in the roster: ${duplicates.join(", ")}`);

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s) found before touching the database:\n`);
    for (const p of problems) console.error(`  · ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log(`validated ${TEACHERS.length} teachers and ${STUDENTS.length} students`);

  const admin = adminClient();
  const client = admin;

  if (RESET) {
    const index = await loadAuthUsers(admin);
    let removed = 0;
    for (const slug of slugs) {
      const id = index.get(emailFor(slug).toLowerCase());
      if (!id) continue;
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw new Error(`deleteUser(${slug}): ${error.message}`);
      removed += 1;
    }
    console.log(`--reset: deleted ${removed} seeded auth user(s); profile rows cascaded`);
  }

  const vocab = await getReferenceVocabularies(client);
  const subjectIds = indexBySlug(vocab.subjects);
  const levelIds = indexBySlug(vocab.levels);
  const languageIds = indexBySlug(vocab.languages);
  console.log(
    `reference vocabularies: ${vocab.subjects.length} subjects, ` +
      `${vocab.levels.length} levels, ${vocab.languages.length} languages`,
  );

  const authIndex = await loadAuthUsers(admin);
  const idBySlug = new Map<string, string>();
  let createdCount = 0;
  let reusedCount = 0;

  /* ---- teachers ---- */
  for (const t of TEACHERS) {
    const { id, created } = await ensureAuthUser(admin, authIndex, emailFor(t.slug), {
      full_name: t.fullName,
      role: "teacher",
      birth_date: t.birthDate,
    });
    idBySlug.set(t.slug, id);
    if (created) createdCount += 1;
    else reusedCount += 1;

    const p = await client
      .from("profiles")
      .update({ full_name: t.fullName, city: t.city })
      .eq("id", id);
    if (p.error) throw new Error(`profiles update ${t.slug}: ${p.error.message}`);

    const pp = await client
      .from("profiles_private")
      .update({ birth_date: t.birthDate, phone: t.phone })
      .eq("user_id", id);
    if (pp.error) throw new Error(`profiles_private update ${t.slug}: ${pp.error.message}`);

    // The trigger already allocated a username from the full name
    // (private.unique_teacher_username). It is overwritten with the mock slug
    // so /teacher/preview/youssef-amrani resolves. The generated value and the
    // mock slug normally coincide; on collision the trigger appends a hex
    // suffix and this update makes the intended slug win.
    const tp = await client
      .from("teacher_profiles")
      .update({
        username: t.slug,
        tagline: t.tagline,
        bio: t.bio,
        // Major units in the mocks become integer centimes. 220 -> 22000.
        hourly_rate_minor: t.hourlyRateMajor === null ? null : t.hourlyRateMajor * 100,
        currency: "DZD",
        years_experience: t.yearsExperience,
      })
      .eq("user_id", id);
    if (tp.error) throw new Error(`teacher_profiles update ${t.slug}: ${tp.error.message}`);

    await replaceJoin(client, "teacher_subjects", "teacher_id", "subject_id", id,
      t.subjects.map((s) => requireId(subjectIds, s, "subject")));
    await replaceJoin(client, "teacher_levels", "teacher_id", "level_id", id,
      t.levels.map((l) => requireId(levelIds, l, "level")));
    await replaceJoin(client, "teacher_languages", "teacher_id", "language_id", id,
      t.languages.map((l) => requireId(languageIds, l, "language")));
  }

  /* ---- students ---- */
  for (const s of STUDENTS) {
    const meta: PersonMeta = {
      full_name: s.fullName,
      role: "student",
      birth_date: s.birthDate,
    };
    // Only meaningful for minors; the trigger drops it for anyone 18 or over.
    if (s.guardianEmail !== null) meta.guardian_email = s.guardianEmail;

    const { id, created } = await ensureAuthUser(admin, authIndex, emailFor(s.slug), meta);
    idBySlug.set(s.slug, id);
    if (created) createdCount += 1;
    else reusedCount += 1;

    const p = await client
      .from("profiles")
      .update({ full_name: s.fullName, city: s.city })
      .eq("id", id);
    if (p.error) throw new Error(`profiles update ${s.slug}: ${p.error.message}`);

    // guardian_name and guardian_email are written here rather than through
    // sign-up metadata: the trigger only ever reads guardian_email, and drops
    // it for adults. The CHECK allows an adult to keep a guardian on file, so
    // Sara Bencheikh's guardian from the mocks survives even though she turned
    // 18 on 2026-05-14 and the parental section no longer applies to her.
    const pp = await client
      .from("profiles_private")
      .update({
        birth_date: s.birthDate,
        phone: s.phone,
        guardian_name: s.guardianName,
        guardian_email: s.guardianEmail,
      })
      .eq("user_id", id);
    if (pp.error) throw new Error(`profiles_private update ${s.slug}: ${pp.error.message}`);

    const sp = await client
      .from("student_profiles")
      .update({
        class_label: s.classLabel,
        school: s.school,
        bio: s.bio,
        level_id: s.level === null ? null : requireId(levelIds, s.level, "level"),
      })
      .eq("user_id", id);
    if (sp.error) throw new Error(`student_profiles update ${s.slug}: ${sp.error.message}`);

    await replaceJoin(client, "student_subjects", "student_id", "subject_id", id,
      s.subjects.map((x) => requireId(subjectIds, x, "subject")));
  }

  /* ---- devices ---- */
  const deviceOwners = [...new Set(DEVICES.map((d) => d.ownerSlug))];
  for (const ownerSlug of deviceOwners) {
    const ownerId = idBySlug.get(ownerSlug);
    if (!ownerId) throw new Error(`device owner "${ownerSlug}" is not in the roster`);

    const del = await client.from("user_devices").delete().eq("user_id", ownerId);
    if (del.error) throw new Error(`user_devices delete ${ownerSlug}: ${del.error.message}`);

    const rows = DEVICES.filter((d) => d.ownerSlug === ownerSlug).map((d) => {
      check(COUNTRY_RE.test(d.countryCode), `device ${d.deviceLabel}: bad country code`);
      return {
        user_id: ownerId,
        kind: d.kind,
        device_label: d.deviceLabel,
        city: d.city,
        country_code: d.countryCode,
        // Derived from the anchor so "Actif maintenant" / "Il y a 2 jours" is
        // computed at render instead of stored as a French string.
        last_seen_at: new Date(anchor.getTime() - d.minutesAgo * 60_000).toISOString(),
        auth_session_id: null,
      };
    });
    const ins = await client.from("user_devices").insert(rows);
    if (ins.error) throw new Error(`user_devices insert ${ownerSlug}: ${ins.error.message}`);
  }

  /* ---- summary ---- */
  const counts = await Promise.all(
    (
      [
        "profiles",
        "profiles_private",
        "teacher_profiles",
        "student_profiles",
        "teacher_subjects",
        "teacher_levels",
        "teacher_languages",
        "student_subjects",
        "user_devices",
      ] as const
    ).map(async (table) => {
      const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
      if (error) throw new Error(`count ${table}: ${error.message}`);
      return [table, count ?? 0] as const;
    }),
  );

  console.log(`\nauth users: ${createdCount} created, ${reusedCount} reused`);
  console.log("row counts:");
  for (const [table, count] of counts) {
    console.log(`  ${table.padEnd(20)} ${count}`);
  }

  console.log("\nnames the mocks use on both sides of the marketplace:");
  for (const c of ROLE_CONFLICTS) console.log(`  · ${c}`);

  console.log(`\nsign in as any seeded account with password "${SEED_PASSWORD}",`);
  console.log(`e.g. sara-bencheikh@${SEED_EMAIL_DOMAIN} or youssef-amrani@${SEED_EMAIL_DOMAIN}`);
}

await main();

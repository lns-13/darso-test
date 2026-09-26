/**
 * Proves the data-access layer against the live policies.
 *
 *   node --env-file=.env.local scripts/verify-data-layer.ts
 *
 * Run the seed first; this reads the accounts it creates.
 *
 * WHY THIS EXISTS
 * ---------------
 * Task 02 has not landed, so nothing in the app can sign in yet and the query
 * layer would otherwise ship unexercised. More importantly, an RLS mistake does
 * not look like a crash: a policy that fails to deny returns rows, and a policy
 * that over-denies returns an empty array. Both look like "working code" from
 * the outside. The only way to know is to assert the deny path explicitly,
 * which is what most of the checks below do.
 *
 * Every signed-in check runs through the anon key carrying a real session, so
 * the policies evaluated here are exactly the ones that will govern the app.
 * Nothing uses the service role except the fixture lookup.
 */

import {
  getOwnPrivateProfile,
  getProfile,
  getRole,
  updateOwnProfile,
} from "../src/lib/data/profiles.ts";
import {
  getOwnTeacherProfile,
  getPublicTeacherProfile,
  listPublicTeachers,
} from "../src/lib/data/teachers.ts";
import {
  getOwnStudentProfile,
  listStudentSubjects,
} from "../src/lib/data/students.ts";
import { listOwnDevices, authSessionIdFromAccessToken } from "../src/lib/data/devices.ts";
import { DataError } from "../src/lib/data/types.ts";
import { ageOn, initialsFromFullName } from "../src/lib/data/derive.ts";
import { adminClient, anonClient, signedInClient } from "./lib/clients.ts";
import { SEED_EMAIL_DOMAIN, SEED_PASSWORD } from "./seed-data.ts";

let passed = 0;
let failed = 0;

function ok(name: string, detail = ""): void {
  passed += 1;
  console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function bad(name: string, detail: string): void {
  failed += 1;
  console.log(`  FAIL  ${name} — ${detail}`);
}

function expect(name: string, condition: boolean, detail: string): void {
  if (condition) ok(name, detail);
  else bad(name, detail);
}

/** Asserts a call is refused, and that it is refused for the right reason. */
async function expectDenied(
  name: string,
  run: () => Promise<unknown>,
  expectation: "throws" | "empty",
): Promise<void> {
  try {
    const result = await run();
    if (expectation === "empty") {
      const isEmpty =
        result === null || (Array.isArray(result) && result.length === 0);
      expect(name, isEmpty, isEmpty ? "filtered to nothing by RLS" : `leaked: ${JSON.stringify(result).slice(0, 120)}`);
      return;
    }
    bad(name, `expected a refusal, got ${JSON.stringify(result).slice(0, 120)}`);
  } catch (error) {
    if (expectation === "throws") {
      const message = error instanceof Error ? error.message : String(error);
      const denied = error instanceof DataError ? error.isPermissionDenied : true;
      expect(name, denied, message.slice(0, 100));
    } else {
      bad(name, `expected an empty result, got a throw: ${String(error).slice(0, 120)}`);
    }
  }
}

async function main(): Promise<void> {
  const admin = adminClient();

  const studentEmail = `sara-bencheikh@${SEED_EMAIL_DOMAIN}`;
  const minorEmail = `omar-zeroual@${SEED_EMAIL_DOMAIN}`;
  const teacherEmail = `youssef-amrani@${SEED_EMAIL_DOMAIN}`;

  /* ---- fixtures: ids of people other than the caller ---- */
  const { data: others, error: othersError } = await admin
    .from("profiles")
    .select("id, role, full_name");
  if (othersError) throw new Error(`fixtures: ${othersError.message}`);
  if (others.length === 0) {
    throw new Error("no profiles found — run `node --env-file=.env.local scripts/seed.ts` first");
  }

  const someTeacher = others.find((p) => p.role === "teacher")!;
  const someStudent = others.find((p) => p.role === "student")!;

  console.log("\n1. Signed out — the anon key with no session\n");
  {
    const anon = anonClient();

    const teachers = await listPublicTeachers(anon);
    expect(
      "anon reads teacher_public_profiles",
      teachers.length > 0,
      `${teachers.length} teachers visible`,
    );

    const publicProfile = await getPublicTeacherProfile(anon, "youssef-amrani");
    expect(
      "anon resolves a teacher by username slug",
      publicProfile !== null && publicProfile.username === "youssef-amrani",
      publicProfile ? `${publicProfile.fullName}, ${publicProfile.subjects.length} subjects` : "not found",
    );

    // The privacy boundary. profiles_private is the only table that can leak a
    // birth date, a phone number or a guardian's email.
    await expectDenied(
      "anon CANNOT read profiles_private",
      () => getOwnPrivateProfile(anon, someStudent.id),
      "throws",
    );

    await expectDenied(
      "anon CANNOT read student_profiles",
      () => getOwnStudentProfile(anon, someStudent.id),
      "throws",
    );

    await expectDenied(
      "anon CANNOT read user_devices",
      () => listOwnDevices(anon, someTeacher.id, null),
      "throws",
    );

    // profiles is public-safe by design: teacher rows are world-readable.
    const teacherRow = await getProfile(anon, someTeacher.id);
    expect(
      "anon reads a teacher's profiles row (by design)",
      teacherRow !== null,
      teacherRow ? teacherRow.full_name : "null",
    );

    // A student's profiles row is NOT public.
    await expectDenied(
      "anon CANNOT read a student's profiles row",
      () => getProfile(anon, someStudent.id),
      "empty",
    );

    // Confirm the public payload carries nothing private.
    if (publicProfile) {
      const keys = Object.keys(publicProfile);
      const leaked = keys.filter((k) =>
        ["birthDate", "birth_date", "phone", "guardianEmail", "guardian_email", "email"].includes(k),
      );
      expect(
        "public teacher payload contains no private field",
        leaked.length === 0,
        leaked.length ? `LEAKED ${leaked.join(", ")}` : keys.join(", "),
      );
    }
  }

  console.log("\n2. Signed in as a student (Sara Bencheikh)\n");
  {
    const { client, userId, accessToken } = await signedInClient(studentEmail, SEED_PASSWORD);

    const profile = await getProfile(client, userId);
    expect(
      "student reads own profiles row",
      profile !== null && profile.id === userId,
      profile ? `${profile.full_name}, ${profile.city}` : "null",
    );

    const role = await getRole(client, userId);
    expect("role comes from profiles.role", role === "student", String(role));

    const priv = await getOwnPrivateProfile(client, userId);
    expect(
      "student reads own profiles_private",
      priv !== null && priv.birth_date !== null,
      priv ? `birth_date ${priv.birth_date}, guardian ${priv.guardian_name ?? "none"}` : "null",
    );

    // The central deny: one signed-in user must not read another's private row.
    await expectDenied(
      "student CANNOT read another user's profiles_private",
      () => getOwnPrivateProfile(client, someTeacher.id),
      "empty",
    );

    await expectDenied(
      "student CANNOT read another student's student_profiles",
      () =>
        getOwnStudentProfile(
          client,
          others.find((p) => p.role === "student" && p.id !== userId)!.id,
        ),
      "empty",
    );

    const own = await getOwnStudentProfile(client, userId);
    expect(
      "student reads own student_profiles",
      own !== null && own.class_label !== null,
      own ? `${own.class_label} at ${own.school}` : "null",
    );

    const subjects = await listStudentSubjects(client, userId);
    expect(
      "student reads own subjects of interest",
      subjects.length > 0,
      subjects.map((s) => s.slug).join(", "),
    );

    const devices = await listOwnDevices(client, userId, authSessionIdFromAccessToken(accessToken));
    expect("student reads own devices", devices.length === 2, `${devices.length} devices`);
    expect(
      "no seeded device claims to be the current one",
      devices.every((d) => !d.isCurrent),
      "current is derived from the JWT session_id, and seeded rows carry none",
    );

    const updated = await updateOwnProfile(client, userId, { city: "Oran" });
    expect("student updates own city", updated.city === "Oran", updated.city ?? "null");
    await updateOwnProfile(client, userId, { city: "Alger" });

    // Column-level grant: `role` is not in the UPDATE grant, so naming it is a
    // privilege error rather than a silently ignored field.
    await expectDenied(
      "student CANNOT change own role",
      async () => {
        const r = await client.from("profiles").update({ role: "teacher" }).eq("id", userId);
        if (r.error) throw new DataError("updateRole", r.error);
        return r.data;
      },
      "throws",
    );

    // Writing to someone else's row matches no rows rather than erroring.
    const foreign = await client
      .from("profiles")
      .update({ city: "Tamanrasset" })
      .eq("id", someTeacher.id)
      .select("id");
    expect(
      "student CANNOT update another user's profile",
      !foreign.error && (foreign.data?.length ?? 0) === 0,
      foreign.error ? foreign.error.message : `${foreign.data?.length ?? 0} rows affected`,
    );
  }

  console.log("\n3. Signed in as a teacher (Youssef Amrani)\n");
  {
    const { client, userId } = await signedInClient(teacherEmail, SEED_PASSWORD);

    const teacher = await getOwnTeacherProfile(client, userId);
    expect(
      "teacher reads own teacher_profiles row",
      teacher !== null && teacher.username === "youssef-amrani",
      teacher ? `@${teacher.username}` : "null",
    );
    expect(
      "hourly rate is integer centimes with an explicit currency",
      teacher?.hourly_rate_minor === 22000 && teacher?.currency === "DZD",
      `${teacher?.hourly_rate_minor} ${teacher?.currency}`,
    );

    const role = await getRole(client, userId);
    expect("role comes from profiles.role", role === "teacher", String(role));
  }

  console.log("\n4. The minor gate reads a real birth date\n");
  {
    const { client, userId } = await signedInClient(minorEmail, SEED_PASSWORD);
    const priv = await getOwnPrivateProfile(client, userId);
    const age = priv?.birth_date ? ageOn(priv.birth_date, new Date()) : null;

    expect(
      "the seeded minor is under 18 and has a guardian",
      age !== null && age < 18 && priv?.guardian_email !== null,
      `age ${age}, guardian ${priv?.guardian_email ?? "none"}`,
    );

    const { client: adult, userId: adultId } = await signedInClient(studentEmail, SEED_PASSWORD);
    const adultPriv = await getOwnPrivateProfile(adult, adultId);
    const adultAge = adultPriv?.birth_date ? ageOn(adultPriv.birth_date, new Date()) : null;
    expect(
      "Sara Bencheikh is 18, so the parental section no longer applies to her",
      adultAge !== null && adultAge >= 18,
      `age ${adultAge} — the mock's guardian data is retained but the gate is closed`,
    );
  }

  console.log("\n5. Nothing derived was stored\n");
  {
    // Selecting a column that does not exist fails with 42703, so a failure
    // here IS the assertion: none of these aggregates has a home in the schema.
    const banned = [
      "rating",
      "avg_rating",
      "review_count",
      "reviews_count",
      "initials",
      "sessions_given",
      "balance",
    ];
    for (const column of banned) {
      const probe = await admin.from("teacher_profiles").select(column).limit(1);
      const absent = Boolean(probe.error);
      expect(
        `teacher_profiles has no "${column}" column`,
        absent,
        absent ? "absent, as intended" : "COLUMN EXISTS — a derived value is being stored",
      );
    }
  }

  console.log("\n6. Derived helpers agree with the stored data\n");
  {
    expect(
      "initials are computed, not stored",
      initialsFromFullName("Youssef Amrani") === "YA" &&
        initialsFromFullName("Sara Bencheikh") === "SB",
      "YA / SB from full_name alone",
    );
    expect(
      "the mocks' colliding initials resolve consistently",
      initialsFromFullName("Yasmine Alaoui") === "YA",
      'the mocks wrote "YAl" in one file and "YA" in another for the same person',
    );
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

await main();

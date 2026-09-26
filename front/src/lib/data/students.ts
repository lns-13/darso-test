/**
 * Student identity: `student_profiles` and `student_subjects`.
 *
 * Both are owner-only — there is no public read and no anon grant — so every
 * function here is the caller acting on their own record. Counterparty reads
 * (a teacher seeing an applicant's level) are a later task and will need a new
 * policy; they must not be faked by widening these.
 *
 * Note what is NOT here: a username. `username` exists only on
 * `teacher_profiles`. The student profile page edited one against no column at
 * all, and this layer does not invent a source for it. See
 * docs/decisions/06-data-reconciliation.md, decision 10.
 */

import type { DarsoClient, StudentProfileRow } from "./types.ts";
import { unwrap, unwrapMaybe } from "./types.ts";
import type { TaughtEntry } from "./teachers.ts";

const STUDENT_COLUMNS = "user_id, class_label, school, bio, level_id";

export type OwnStudentProfile = Pick<
  StudentProfileRow,
  "user_id" | "class_label" | "school" | "bio" | "level_id"
>;

export async function getOwnStudentProfile(
  client: DarsoClient,
  userId: string,
): Promise<OwnStudentProfile | null> {
  const result = await client
    .from("student_profiles")
    .select(STUDENT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  return unwrapMaybe("getOwnStudentProfile", result);
}

/** Mirrors the column-level UPDATE grant: class_label, school, bio, level_id. */
export type StudentProfilePatch = Partial<
  Pick<StudentProfileRow, "class_label" | "school" | "bio" | "level_id">
>;

export async function updateOwnStudentProfile(
  client: DarsoClient,
  userId: string,
  patch: StudentProfilePatch,
): Promise<OwnStudentProfile> {
  const result = await client
    .from("student_profiles")
    .update(patch)
    .eq("user_id", userId)
    .select(STUDENT_COLUMNS)
    .single();
  return unwrap("updateOwnStudentProfile", result);
}

/* ---------------------------------------------------------------------------
   Subjects of interest
--------------------------------------------------------------------------- */

export async function listStudentSubjects(
  client: DarsoClient,
  studentId: string,
): Promise<TaughtEntry[]> {
  const result = await client
    .from("student_subjects")
    .select("subject_id, subjects(slug, name, sort_order)")
    .eq("student_id", studentId);
  const rows = unwrap("listStudentSubjects", result);

  const out: TaughtEntry[] = [];
  for (const row of rows) {
    const embedded = row.subjects as { slug: string; name: string } | null;
    if (embedded) out.push({ slug: embedded.slug, name: embedded.name });
  }
  return out;
}

/** Delete-then-insert; the join table carries no UPDATE grant. */
export async function replaceStudentSubjects(
  client: DarsoClient,
  studentId: string,
  subjectIds: number[],
): Promise<void> {
  const del = await client
    .from("student_subjects")
    .delete()
    .eq("student_id", studentId);
  if (del.error) throw new Error(`replaceStudentSubjects.delete: ${del.error.message}`);

  if (subjectIds.length === 0) return;

  const ins = await client
    .from("student_subjects")
    .insert(subjectIds.map((subject_id) => ({ student_id: studentId, subject_id })));
  if (ins.error) throw new Error(`replaceStudentSubjects.insert: ${ins.error.message}`);
}

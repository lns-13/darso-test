/**
 * Reference vocabularies: subjects, levels, languages.
 *
 * These three tables replace five hand-authored string arrays that disagreed
 * with one another (`AVAILABLE_SUBJECTS_TAUGHT` had ten entries,
 * `mockSubjectPool` eleven, the student profile page eight with "Maths"
 * instead of "Mathématiques", and transaction rows carried free text). The
 * merge rules are recorded in the header of
 * `supabase/migrations/20260906155947_reference_vocabularies.sql`.
 *
 * All three are readable signed out, so anything built on them renders for an
 * anonymous visitor. Code references rows by `slug`, never by `id`: ids are
 * `generated always as identity` and are not stable across environments.
 */

import type { DarsoClient, LanguageRow, LevelRow, SubjectRow } from "./types.ts";
import { unwrap } from "./types.ts";

/**
 * Named columns, not `*`. Rule from the RLS performance guide: a policy that
 * filters plus a `select *` forces the planner to materialise columns the
 * caller never reads. These tables are small, but the habit has to be uniform
 * or the exceptions become the rule.
 */
const REFERENCE_COLUMNS = "id, slug, name, sort_order";

export type ReferenceEntry = {
  id: number;
  slug: string;
  name: string;
};

function toEntries(rows: Array<SubjectRow | LevelRow | LanguageRow>): ReferenceEntry[] {
  return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name }));
}

export async function listSubjects(client: DarsoClient): Promise<ReferenceEntry[]> {
  const result = await client
    .from("subjects")
    .select(REFERENCE_COLUMNS)
    .order("sort_order", { ascending: true });
  return toEntries(unwrap("listSubjects", result));
}

export async function listLevels(client: DarsoClient): Promise<ReferenceEntry[]> {
  const result = await client
    .from("levels")
    .select(REFERENCE_COLUMNS)
    .order("sort_order", { ascending: true });
  return toEntries(unwrap("listLevels", result));
}

export async function listLanguages(client: DarsoClient): Promise<ReferenceEntry[]> {
  const result = await client
    .from("languages")
    .select(REFERENCE_COLUMNS)
    .order("sort_order", { ascending: true });
  return toEntries(unwrap("listLanguages", result));
}

export type ReferenceVocabularies = {
  subjects: ReferenceEntry[];
  levels: ReferenceEntry[];
  languages: ReferenceEntry[];
};

/** All three in parallel; the usual shape a settings screen needs. */
export async function getReferenceVocabularies(
  client: DarsoClient,
): Promise<ReferenceVocabularies> {
  const [subjects, levels, languages] = await Promise.all([
    listSubjects(client),
    listLevels(client),
    listLanguages(client),
  ]);
  return { subjects, levels, languages };
}

/* ---------------------------------------------------------------------------
   Slug lookup
   ---------------------------------------------------------------------------
   Join tables are keyed by id, but code and seed data speak slugs. These build
   the bridge once per call site rather than issuing a query per slug.
--------------------------------------------------------------------------- */

export function indexBySlug(entries: ReferenceEntry[]): Map<string, number> {
  return new Map(entries.map((e) => [e.slug, e.id]));
}

/** Throws on an unknown slug: a typo must fail loudly, not insert nothing. */
export function requireId(
  index: Map<string, number>,
  slug: string,
  kind: string,
): number {
  const id = index.get(slug);
  if (id === undefined) {
    throw new Error(
      `Unknown ${kind} slug "${slug}". Known slugs: ${[...index.keys()].join(", ")}`,
    );
  }
  return id;
}

/* ---------------------------------------------------------------------------
   The names Task 04 already imports
--------------------------------------------------------------------------- */

/** Alias of {@link ReferenceEntry}, kept for the Task 04 call sites. */
export type ReferenceItem = ReferenceEntry;

/** Map a set of slugs onto reference ids, dropping anything unknown. */
export function idsForSlugs(items: ReferenceItem[], slugs: string[]): number[] {
  const bySlug = new Map(items.map((i) => [i.slug, i.id]));
  const ids: number[] = [];
  for (const slug of slugs) {
    const id = bySlug.get(slug);
    if (id !== undefined && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

"use client";

/**
 * Client-side access to the reference vocabularies.
 *
 * The three reference tables are readable signed out, so a Client Component can
 * load them with the browser client and they render for an anonymous visitor.
 * That is what lets the subject picker on the student profile page show real
 * rows today, before Task 02 makes it possible to sign in at all.
 *
 * The rest of `src/lib/data/` is isomorphic and takes a client as an argument;
 * this file is the one client-only entry point, so the `"use client"` boundary
 * stays in one place rather than spreading through the layer.
 */

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { listSubjects, type ReferenceEntry } from "./reference.ts";

export type ReferenceState = {
  entries: ReferenceEntry[];
  loading: boolean;
  error: string | null;
};

/**
 * The eleven rows of `subjects`, ordered by `sort_order`.
 *
 * Replaces the hand-authored arrays that disagreed across four files — ten
 * entries in one, eleven in another, and eight on the student profile page with
 * "Maths" where the others said "Mathématiques". Selections are held as slugs,
 * never as display names, so a label change is not a data migration.
 */
export function useSubjects(): ReferenceState {
  const [entries, setEntries] = useState<ReferenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listSubjects(createClient())
      .then((rows) => {
        if (cancelled) return;
        setEntries(rows);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        // Surfaced rather than swallowed: an empty picker and a failed read
        // look identical otherwise.
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, loading, error };
}

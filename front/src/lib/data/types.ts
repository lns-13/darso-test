/**
 * Shared plumbing for the data-access layer.
 *
 * Every query function in `src/lib/data/` takes an explicitly-passed Supabase
 * client rather than creating one. Three reasons:
 *
 *   1. The same function works from a Server Component (`server.ts`), a Client
 *      Component (`client.ts`), a route handler and a plain node script. The
 *      seed and the RLS verification script exercise the *same* code path the
 *      app uses, so a policy regression fails a script instead of a page.
 *   2. It keeps `next/headers` out of the import graph of modules that a
 *      Client Component might touch. `createClient()` from `./supabase/server`
 *      awaits `cookies()`, which cannot be imported into a client bundle.
 *   3. It makes the privilege level of a call visible at the call site: a
 *      function handed the admin client is obviously bypassing RLS.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

/** Any client typed against our schema: browser, server or service role. */
export type DarsoClient = SupabaseClient<Database>;

/* ---------------------------------------------------------------------------
   Error convention
   ---------------------------------------------------------------------------
   supabase-js never throws; it returns `{ data, error }`. Silently ignoring
   `error` is the single easiest way to make an RLS failure look like an empty
   result, so every function here funnels through `unwrap`, which throws a
   `DataError` carrying the Postgres code.

   Callers that legitimately expect "no row" use the `maybe*` variants, which
   return `null` for a missing row but still throw on a real failure. The
   distinction matters: PGRST116 ("no rows") is a normal outcome, while 42501
   ("permission denied") is a bug or an attack and must never be swallowed.
--------------------------------------------------------------------------- */

export class DataError extends Error {
  readonly code: string | undefined;
  readonly details: string | undefined;
  readonly hint: string | undefined;
  readonly operation: string;

  constructor(
    operation: string,
    error: { message: string; code?: string; details?: string; hint?: string },
  ) {
    super(`${operation}: ${error.message}`);
    this.name = "DataError";
    this.operation = operation;
    this.code = error.code;
    this.details = error.details ?? undefined;
    this.hint = error.hint ?? undefined;
  }

  /** True when the failure was RLS or a missing column-level grant. */
  get isPermissionDenied(): boolean {
    return this.code === "42501" || this.code === "PGRST301";
  }
}

type PostgrestLike<T> = {
  data: T | null;
  error: { message: string; code?: string; details?: string; hint?: string } | null;
};

/** Throws on error, and on a null payload where a row was required. */
export function unwrap<T>(operation: string, result: PostgrestLike<T>): T {
  if (result.error) throw new DataError(operation, result.error);
  if (result.data === null) {
    throw new DataError(operation, { message: "expected a row, received none" });
  }
  return result.data;
}

/** Throws on a real error; returns null when the row simply does not exist. */
export function unwrapMaybe<T>(
  operation: string,
  result: PostgrestLike<T>,
): T | null {
  if (result.error) {
    // PGRST116 is "JSON object requested, multiple (or no) rows returned",
    // which `.maybeSingle()` already handles, but `.single()` surfaces it.
    if (result.error.code === "PGRST116") return null;
    throw new DataError(operation, result.error);
  }
  return result.data;
}

/* ---------------------------------------------------------------------------
   Row aliases used across the layer
--------------------------------------------------------------------------- */

export type ProfileRow = Tables<"profiles">;
export type ProfilePrivateRow = Tables<"profiles_private">;
export type TeacherProfileRow = Tables<"teacher_profiles">;
export type StudentProfileRow = Tables<"student_profiles">;
export type UserDeviceRow = Tables<"user_devices">;
export type SubjectRow = Tables<"subjects">;
export type LevelRow = Tables<"levels">;
export type LanguageRow = Tables<"languages">;

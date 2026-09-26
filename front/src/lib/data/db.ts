import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient as createUntypedBrowserClient } from "@/lib/supabase/client";
import { createClient as createUntypedServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Typed views of the two shared Supabase factories.
 *
 * `src/lib/supabase/{client,server,admin}.ts` still build untyped clients. The
 * task README assigns adding the `<Database>` generic to those three files to
 * exactly one task so that 02, 04 and 06 do not all rewrite them, and it is
 * Task 06, not this one. Casting here gives this task full column typing
 * without touching a file another agent is editing. Delete these wrappers once
 * the factories carry the generic themselves.
 */
export type Db = SupabaseClient<Database>;

export async function serverDb(): Promise<Db> {
  return (await createUntypedServerClient()) as unknown as Db;
}

export function browserDb(): Db {
  return createUntypedBrowserClient() as unknown as Db;
}

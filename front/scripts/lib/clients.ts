/**
 * Supabase clients for the node scripts.
 *
 * `src/lib/supabase/{client,server,admin}.ts` are the app's factories and this
 * does not replace them. They cannot be imported here: `server.ts` awaits
 * `next/headers`, and all three use extensionless relative specifiers that
 * Next resolves and Node's ESM loader does not.
 *
 * What matters is that the scripts use the SAME keys and the SAME privilege
 * levels as the app, so an RLS result observed here is the result the app gets.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../src/lib/supabase/database.types.ts";

export type ScriptClient = SupabaseClient<Database>;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Run with: node --env-file=.env.local <script>`,
    );
  }
  return value;
}

/** Service role. BYPASSES RLS. Only the seed should hold one. */
export function adminClient(): ScriptClient {
  return createClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * Anon key, no session: exactly what a signed-out visitor's browser holds.
 * Used to prove the deny paths.
 */
export function anonClient(): ScriptClient {
  return createClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * Anon key carrying a real signed-in session.
 *
 * This is the important one. RLS is evaluated against the JWT, so a query run
 * through this client is governed by exactly the policies that govern the app.
 * A service-role client would bypass all of them and prove nothing.
 */
export async function signedInClient(
  email: string,
  password: string,
): Promise<{ client: ScriptClient; userId: string; accessToken: string }> {
  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`signInWithPassword(${email}): ${error?.message ?? "no session"}`);
  }
  return {
    client,
    userId: data.session.user.id,
    accessToken: data.session.access_token,
  };
}

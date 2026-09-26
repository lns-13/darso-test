import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY ENTIRELY.
 *
 * Only ever import this from server-side code that has already authorised the
 * caller: webhook handlers, admin review actions, payout jobs. Never import it
 * into a Client Component, and never expose its results without a check.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() was called in the browser. The service role key must never reach the client.",
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Missing environment variable SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local.",
    );
  }

  return createSupabaseClient<Database>(supabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

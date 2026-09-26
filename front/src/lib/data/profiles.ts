/**
 * The identity domain: `profiles` and `profiles_private`.
 *
 * The split is the deliberate deviation recorded in the header of
 * `20260906155856_identity_core.sql`. `profiles` is public-safe in full —
 * teacher rows are world-readable and counterparties will read student rows
 * later — while everything that must never leak lives one table over, owner
 * only, never anon.
 *
 * The practical rule that falls out of that, and the reason this module keeps
 * the two reads in separate functions: **never join `profiles_private` into a
 * read whose result reaches a public surface.** It is the only place a query
 * can leak a birth date, a phone number or a guardian's email address.
 */

import type { Database } from "@/lib/supabase/database.types";

import type { DarsoClient, ProfilePrivateRow, ProfileRow } from "./types.ts";
import { unwrap, unwrapMaybe } from "./types.ts";

export type UserRole = Database["public"]["Enums"]["user_role"];

/* ---------------------------------------------------------------------------
   Column lists
   ---------------------------------------------------------------------------
   Named explicitly, never `*`. Two reasons, both from the RLS performance
   guide: `select *` under a filtering policy plans badly, and an explicit list
   means a column added to the table later cannot silently widen a payload that
   is already being sent to a browser.
--------------------------------------------------------------------------- */

const PROFILE_COLUMNS = "id, role, full_name, city, avatar_path, ui_locale";
const PROFILE_PRIVATE_COLUMNS =
  "user_id, birth_date, phone, guardian_name, guardian_email";

export type Profile = Pick<
  ProfileRow,
  "id" | "role" | "full_name" | "city" | "avatar_path" | "ui_locale"
>;

export type PrivateProfile = Pick<
  ProfilePrivateRow,
  "user_id" | "birth_date" | "phone" | "guardian_name" | "guardian_email"
>;

/* ---------------------------------------------------------------------------
   Reads
--------------------------------------------------------------------------- */

/**
 * One profile by id.
 *
 * `userId` is passed explicitly and filtered on even when the caller is
 * reading their own row and the policy already enforces exactly that. The RLS
 * performance guide measures the difference at 171ms against 9ms: the policy
 * alone leaves Postgres scanning and filtering per row, whereas the duplicated
 * predicate lets it use the primary key. Every owner-scoped function in this
 * layer therefore takes an id rather than inferring one.
 */
export async function getProfile(
  client: DarsoClient,
  userId: string,
): Promise<Profile | null> {
  const result = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  return unwrapMaybe("getProfile", result);
}

/**
 * The caller's own private row.
 *
 * Signed out this fails at the GRANT, before RLS is consulted: `anon` holds no
 * privilege on the table at all, so the error is "permission denied for table
 * profiles_private" rather than an empty result. That is the intended
 * behaviour and `unwrap` surfaces it instead of swallowing it.
 */
export async function getOwnPrivateProfile(
  client: DarsoClient,
  userId: string,
): Promise<PrivateProfile | null> {
  const result = await client
    .from("profiles_private")
    .select(PROFILE_PRIVATE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  return unwrapMaybe("getOwnPrivateProfile", result);
}

/**
 * The caller's role, read from `profiles.role`.
 *
 * Never read the role from `user.user_metadata.role`: that is the sign-up
 * input and the user can rewrite it. `private.user_role()` is a policy helper
 * in the unexposed `private` schema and is not reachable through
 * `supabase.rpc()`, so application code reads the column.
 */
export async function getRole(
  client: DarsoClient,
  userId: string,
): Promise<UserRole | null> {
  const result = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const row = unwrapMaybe("getRole", result);
  return row?.role ?? null;
}

/* ---------------------------------------------------------------------------
   Writes
   ---------------------------------------------------------------------------
   The column-level UPDATE grants from Task 01 are mirrored in these types.
   Naming any other column is refused by Postgres as a permission error, not as
   an empty result, so a mistake here fails loudly — but failing at compile time
   is better still.
--------------------------------------------------------------------------- */

/** `role` is absent by construction: it is immutable once the row exists. */
export type ProfilePatch = Partial<
  Pick<ProfileRow, "full_name" | "city" | "avatar_path" | "ui_locale">
>;

export async function updateOwnProfile(
  client: DarsoClient,
  userId: string,
  patch: ProfilePatch,
): Promise<Profile> {
  const result = await client
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();
  return unwrap("updateOwnProfile", result);
}

export type PrivateProfilePatch = Partial<
  Pick<
    ProfilePrivateRow,
    "birth_date" | "phone" | "guardian_name" | "guardian_email"
  >
>;

export async function updateOwnPrivateProfile(
  client: DarsoClient,
  userId: string,
  patch: PrivateProfilePatch,
): Promise<PrivateProfile> {
  const result = await client
    .from("profiles_private")
    .update(patch)
    .eq("user_id", userId)
    .select(PROFILE_PRIVATE_COLUMNS)
    .single();
  return unwrap("updateOwnPrivateProfile", result);
}

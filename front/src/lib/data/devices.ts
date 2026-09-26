/**
 * `user_devices` — the "Sessions actives" list on both profile pages.
 *
 * The mock shapes were the two profile pages' local state, and they disagreed:
 * the teacher version carried a `kind` discriminator resolved to an icon at
 * render, while the student version embedded a Lucide component reference
 * directly in the data, which cannot come off the wire. The teacher shape wins.
 *
 * Three fields the mocks stored are derived here instead:
 *   `where`   "Casablanca · MA"  -> city + country_code, joined at render
 *   `last`    "Actif maintenant" -> last_seen_at, formatted at render
 *   `current` true / false       -> auth_session_id === the caller's JWT
 *                                   session_id claim
 *
 * `current` in particular cannot be stored: it is a property of *which browser
 * is asking*, not of the row. Two devices reading the same table at the same
 * moment must each see themselves as current.
 */

import type { DarsoClient, UserDeviceRow } from "./types.ts";
import { unwrap } from "./types.ts";

const DEVICE_COLUMNS =
  "id, kind, device_label, city, country_code, last_seen_at, auth_session_id";

export type Device = Pick<
  UserDeviceRow,
  | "id"
  | "kind"
  | "device_label"
  | "city"
  | "country_code"
  | "last_seen_at"
  | "auth_session_id"
> & {
  /** Derived: this row is the browser making the request. */
  isCurrent: boolean;
};

/**
 * Reads the `session_id` claim out of an access token.
 *
 * Supabase puts `session_id` at the top level of the JWT payload, alongside
 * `sub` and `role`; the migration's policy uses the same claim as
 * `((select auth.jwt()) ->> 'session_id')::uuid`.
 *
 * This decodes without verifying, which is correct for its only purpose:
 * choosing which row to label "Cet appareil". Nothing is authorised on the
 * strength of it. Every actual authorisation decision is made by RLS against
 * the verified token on the server.
 */
export function authSessionIdFromAccessToken(accessToken: string): string | null {
  const segments = accessToken.split(".");
  if (segments.length < 2) return null;

  try {
    const payload = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("binary");
    const claims = JSON.parse(json) as { session_id?: unknown };
    return typeof claims.session_id === "string" ? claims.session_id : null;
  } catch {
    return null;
  }
}

/**
 * The caller's devices, newest activity first.
 *
 * The ordering matches `user_devices_user_id_last_seen_at_idx` exactly, so
 * this read is an index scan rather than a sort.
 */
export async function listOwnDevices(
  client: DarsoClient,
  userId: string,
  currentAuthSessionId: string | null,
): Promise<Device[]> {
  const result = await client
    .from("user_devices")
    .select(DEVICE_COLUMNS)
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false });

  return unwrap("listOwnDevices", result).map((row) => ({
    ...row,
    isCurrent:
      currentAuthSessionId !== null && row.auth_session_id === currentAuthSessionId,
  }));
}

/**
 * Forget a device.
 *
 * Deleting the row is only half of "Déconnecter": it removes the entry from
 * the list but leaves the other browser signed in, because the auth session
 * lives in `auth.sessions` and nothing cascades. The caller must also revoke
 * that session through the admin API. Task 03 owns that half; this function
 * deliberately does not pretend to do it.
 */
export async function forgetDevice(
  client: DarsoClient,
  userId: string,
  deviceId: string,
): Promise<void> {
  const result = await client
    .from("user_devices")
    .delete()
    .eq("user_id", userId)
    .eq("id", deviceId);
  if (result.error) throw new Error(`forgetDevice: ${result.error.message}`);
}

export type DeviceRegistration = Pick<
  UserDeviceRow,
  "kind" | "device_label" | "city" | "country_code" | "user_agent"
> & {
  auth_session_id: string | null;
};

/**
 * Record the current browser, or refresh its `last_seen_at`.
 *
 * `auth_session_id` is unique, so the same browser signing in twice updates
 * one row rather than growing the list. A null session id cannot be used as a
 * conflict target, so those rows are inserted plainly; that only happens where
 * the caller could not read its own token, which should not occur in practice.
 */
export async function recordDevice(
  client: DarsoClient,
  userId: string,
  device: DeviceRegistration,
): Promise<void> {
  const row = { ...device, user_id: userId, last_seen_at: new Date().toISOString() };

  const result =
    device.auth_session_id === null
      ? await client.from("user_devices").insert(row)
      : await client
          .from("user_devices")
          .upsert(row, { onConflict: "auth_session_id" });

  if (result.error) throw new Error(`recordDevice: ${result.error.message}`);
}

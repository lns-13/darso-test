-- =============================================================================
-- Task 01 · user_devices
-- =============================================================================
-- The "Sessions actives" block on both profile pages lists devices with a
-- "Déconnecter" control that today only filters React state. This table backs
-- it. The mock fields map as follows:
--   device  "Chrome sur macOS"   -> device_label
--   where   "Casablanca · MA"    -> city + country_code, joined at render
--   last    "Actif maintenant"   -> last_seen_at (timestamptz), formatted at render
--   current true/false           -> DERIVED: auth_session_id equals the
--                                   session_id claim of the caller's JWT,
--                                   i.e. ((select auth.jwt()) ->> 'session_id')::uuid
--   kind    "desktop"|"mobile"   -> kind (enum device_kind)
--
-- auth_session_id points at auth.sessions.id but is deliberately NOT a
-- foreign key: the auth schema is Supabase-managed and may change shape.
-- "Déconnecter" must both delete this row and revoke the matching auth
-- session through the admin API; deleting the row alone does not sign the
-- device out.
-- =============================================================================

create table public.user_devices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  auth_session_id uuid,
  kind            public.device_kind not null,
  device_label    text not null,        -- "Chrome sur macOS", "iPhone · Safari"
  city            text,                 -- "Casablanca"
  country_code    char(2),              -- ISO 3166-1 alpha-2, "DZ"
  ip              inet,
  user_agent      text,
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint user_devices_auth_session_id_key unique (auth_session_id),
  constraint user_devices_device_label_len
    check (char_length(btrim(device_label)) between 1 and 120),
  constraint user_devices_city_len
    check (city is null or char_length(btrim(city)) between 1 and 80),
  constraint user_devices_country_code_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint user_devices_user_agent_len
    check (user_agent is null or char_length(user_agent) <= 1024)
);

comment on table public.user_devices is
  'Signed-in devices shown under "Sessions actives". Owner-only. `current` is derived from the JWT session_id.';

-- Referenced by every policy below, and by the "list my devices, newest
-- first" query.
create index user_devices_user_id_last_seen_at_idx
  on public.user_devices (user_id, last_seen_at desc);

create trigger user_devices_set_updated_at
  before update on public.user_devices
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privileges · auth_session_id and user_id are set once, never edited
-- ---------------------------------------------------------------------------
revoke all on table public.user_devices from anon, authenticated;
grant select, insert, delete on table public.user_devices to authenticated;
grant update (kind, device_label, city, country_code, ip, user_agent, last_seen_at)
  on table public.user_devices to authenticated;
grant all on table public.user_devices to service_role;

-- ---------------------------------------------------------------------------
-- Row level security · owner only, never anon
-- ---------------------------------------------------------------------------
alter table public.user_devices enable row level security;

create policy user_devices_select_own
  on public.user_devices for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_devices_insert_own
  on public.user_devices for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy user_devices_update_own
  on public.user_devices for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy user_devices_delete_own
  on public.user_devices for delete to authenticated
  using ((select auth.uid()) = user_id);

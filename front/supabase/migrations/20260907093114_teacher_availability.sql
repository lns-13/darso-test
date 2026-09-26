-- =============================================================================
-- Task 04 · Teacher availability
-- =============================================================================
-- Task 01 deliberately stored no availability: `availabilityHours` in the mocks
-- is the free-text label "Lun-Ven 14-20h", which nothing can be booked against.
-- This migration replaces it with a real recurring weekly schedule.
--
-- SHAPE · taken from the UI, not invented
-- -----------------------------------------------------------------------------
-- `WeekSlot` in src/components/app/week-grid.tsx is
--   { id, day: 0..6 (0 = Monday), start: "HH:MM", end: "HH:MM" }
-- and the teacher sessions page already renders and edits a WeekSlot[]. The
-- columns below are that type, one row per slot:
--   weekday   = day, 0 = Monday .. 6 = Sunday (ISO order, NOT Postgres dow,
--               which is 0 = Sunday; the UI's Monday-first order wins because
--               every French label in the grid follows it)
--   starts_at = start, ends_at = end, both `time` so they repeat every week.
-- 24:00:00 is a legal `time` in Postgres, so a slot may end at midnight; the
-- grid's "Voir 24h" mode can express exactly that.
--
-- TIMEZONE
-- -----------------------------------------------------------------------------
-- Stored explicitly on teacher_profiles, one per teacher, default
-- 'Africa/Algiers' (00-CONTEXT: assume Algeria until told otherwise). Algeria
-- does not observe daylight saving, so a wall-clock `time` maps to exactly one
-- instant per week and no slot can be doubled or skipped by a DST transition.
-- The column is stored anyway: the moment a second country is supported, a
-- naive time with no zone is unrecoverable, and the currency note in
-- 00-CONTEXT is a standing reminder that the country choice can still move.
-- Validated by a trigger rather than a CHECK: the valid set lives in
-- pg_timezone_names, and a CHECK expression may not run a subquery or a
-- non-IMMUTABLE function.
--
-- PUBLIC SURFACE · this is a privacy boundary, so both additions are named
-- -----------------------------------------------------------------------------
--   * teacher_profiles.timezone  becomes anon-readable, because
--     teacher_profiles_select_public is `using (true)` and anon holds SELECT on
--     the table. It is also appended to the teacher_public_profiles view.
--     Nothing private: it is the zone the published hours are expressed in, and
--     a schedule without it is unreadable.
--   * teacher_availability       is public-read in full (weekday, start, end).
--     These are the hours a teacher advertises. Publishing them is the point.
-- No other column is added anywhere, and nothing from profiles_private is
-- touched.
--
-- OVERLAP
-- -----------------------------------------------------------------------------
-- Two overlapping slots on the same weekday are not a schedule, they are a
-- double booking waiting to happen. An exclusion constraint refuses them in the
-- database instead of trusting every future writer to check first. That needs
-- btree_gist for the equality parts of the key.
-- =============================================================================

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- teacher_profiles.timezone
-- ---------------------------------------------------------------------------
alter table public.teacher_profiles
  add column if not exists timezone text not null default 'Africa/Algiers';

comment on column public.teacher_profiles.timezone is
  'IANA zone the availability times are expressed in. Public. Default Africa/Algiers.';

create or replace function private.assert_valid_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Raises invalid_parameter_value when the name is not in pg_timezone_names.
  perform now() at time zone new.timezone;
  return new;
exception
  when others then
    raise exception 'Fuseau horaire inconnu: %', new.timezone
      using errcode = '22023';
end;
$$;

comment on function private.assert_valid_timezone() is
  'BEFORE trigger: rejects a timezone name Postgres does not know. A CHECK cannot do this (no subqueries, IMMUTABLE only).';

revoke execute on function private.assert_valid_timezone() from public;
grant execute on function private.assert_valid_timezone() to authenticated, service_role, supabase_auth_admin;

create trigger teacher_profiles_validate_timezone
  before insert or update of timezone on public.teacher_profiles
  for each row execute function private.assert_valid_timezone();

-- teacher_profiles.timezone joins the column-level UPDATE grant from
-- 20260906155856_identity_core. Naming a column outside that grant in an
-- UPDATE is refused as a permission error, so it has to be added explicitly.
grant update (timezone) on table public.teacher_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- teacher_availability · recurring weekly slots
-- ---------------------------------------------------------------------------
create table public.teacher_availability (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid     not null references public.teacher_profiles (user_id) on delete cascade,
  weekday    smallint not null,   -- 0 = Monday .. 6 = Sunday (WeekSlot.day)
  starts_at  time     not null,
  ends_at    time     not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint teacher_availability_weekday_range
    check (weekday between 0 and 6),

  -- Strictly ordered: a zero-length slot is not availability.
  constraint teacher_availability_order
    check (ends_at > starts_at),

  -- The week grid works in 30-minute rows and the recurring-rule card emits
  -- whole and half hours. 15 minutes leaves room for a finer editor without
  -- admitting 14:03:27.
  constraint teacher_availability_granularity check (
    date_part('minute', starts_at)::int % 15 = 0
    and date_part('second', starts_at) = 0
    and date_part('minute', ends_at)::int % 15 = 0
    and date_part('second', ends_at) = 0
  ),

  -- No two slots of the same teacher may overlap on the same weekday. Times
  -- are anchored on an arbitrary date purely to obtain a range type.
  constraint teacher_availability_no_overlap exclude using gist (
    teacher_id with =,
    weekday with =,
    tsrange(date '2000-01-01' + starts_at, date '2000-01-01' + ends_at) with &&
  )
);

comment on table public.teacher_availability is
  'Recurring weekly availability, one row per slot. Public read, owner write. Wall clock times in teacher_profiles.timezone.';
comment on column public.teacher_availability.weekday is
  '0 = Monday .. 6 = Sunday, matching WeekSlot.day in the UI. NOT Postgres extract(dow).';
comment on column public.teacher_availability.ends_at is
  'Exclusive end. 24:00:00 is legal and means midnight at the end of that weekday.';

-- Referenced by every policy below and by the FK. The exclusion constraint's
-- gist index does not satisfy the unindexed-foreign-key linter.
create index teacher_availability_teacher_id_idx
  on public.teacher_availability (teacher_id);

-- The public read path: one teacher's week, already in display order.
create index teacher_availability_teacher_week_idx
  on public.teacher_availability (teacher_id, weekday, starts_at);

create trigger teacher_availability_set_updated_at
  before update on public.teacher_availability
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on table public.teacher_availability from anon, authenticated;
grant select on table public.teacher_availability to anon, authenticated;
grant insert, delete on table public.teacher_availability to authenticated;
-- Unlike teacher_subjects / teacher_levels / teacher_languages, these rows are
-- not a set of reference ids to be replaced wholesale: a slot has its own
-- identity and a mutable payload, so moving one is an UPDATE, not a delete and
-- re-insert. id, teacher_id and the timestamps stay outside the grant.
grant update (weekday, starts_at, ends_at) on table public.teacher_availability to authenticated;
grant all on table public.teacher_availability to service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.teacher_availability enable row level security;

-- Public, like teacher_profiles itself: these are advertised opening hours.
create policy teacher_availability_select_public
  on public.teacher_availability
  for select
  to anon, authenticated
  using (true);

-- private.user_role() is Task 01's helper, called wrapped so it runs once per
-- statement. No second helper is introduced.
create policy teacher_availability_insert_own
  on public.teacher_availability
  for insert
  to authenticated
  with check (
    (select auth.uid()) = teacher_id
    and (select private.user_role()) = 'teacher'
  );

create policy teacher_availability_update_own
  on public.teacher_availability
  for update
  to authenticated
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);

create policy teacher_availability_delete_own
  on public.teacher_availability
  for delete
  to authenticated
  using ((select auth.uid()) = teacher_id);

-- ---------------------------------------------------------------------------
-- Public teacher preview · append timezone
-- ---------------------------------------------------------------------------
-- CREATE OR REPLACE VIEW may only append columns, so timezone goes last. The
-- security_invoker option is restated because a replace resets unlisted
-- options; grants survive the replace.
create or replace view public.teacher_public_profiles
with (security_invoker = true)
as
select
  tp.user_id,
  tp.username,
  p.full_name,
  p.city,
  p.avatar_path,
  tp.tagline,
  tp.bio,
  tp.hourly_rate_minor,
  tp.currency,
  tp.years_experience,
  tp.created_at,
  tp.timezone
from public.teacher_profiles tp
join public.profiles p on p.id = tp.user_id;

comment on view public.teacher_public_profiles is
  'The /teacher/preview/[username] shop window. Safe columns only; runs with the caller RLS. Availability is teacher_availability, read separately by teacher_id.';

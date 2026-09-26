-- =============================================================================
-- Task 01 · Identity core
-- =============================================================================
-- Creates the `private` schema and the role helper, the closed enums this task
-- owns, and the identity tables: profiles, profiles_private, teacher_profiles,
-- student_profiles. Reference vocabularies, join tables, devices and the
-- auth.users bootstrap trigger live in the following migrations.
--
-- DECISION RECORD · the four mock inconsistencies from the brief
-- -----------------------------------------------------------------------------
-- 1. Two subject vocabularies (AVAILABLE_SUBJECTS_TAUGHT vs mockSubjectPool,
--    plus free text in transactions and "Maths" on the student side)
--    -> ONE `subjects` reference table, seeded in 20260906155947. Merge rules
--    are documented there ("SES" folded into "Économie", "Maths" is an
--    abbreviation of "Mathématiques", free text is mapped by the seed).
-- 2. The average rating disagrees with itself (4.9 / 4.8 / 4.8 / "4,9")
--    -> never stored. No rating or review-count column exists on any identity
--    table. It is computed from review rows when those exist.
-- 3. mockPayoutSettings.defaultMethodId = "iban-1" but only "pmt-1"/"pmt-2"
--    exist -> payout methods are a later task. When modelled, the default
--    method is a real FK to the payout-method row, and the seed must point at
--    an existing row. Nothing here carries the dangling id forward.
-- 4. SessionRowProps.teacher holds the student's name on teacher pages
--    -> no "counterparty" column anywhere. `profiles` is one row per person;
--    sessions will carry an explicit `student_id` and `teacher_id`.
--
-- DELIBERATE DEVIATION FROM THE BRIEF
-- -----------------------------------------------------------------------------
-- The brief lists birth date, phone and guardian email on `profiles`. They are
-- in `profiles_private` instead, one-to-one with `profiles`.
-- Why: RLS is row-level. `profiles` has to be readable by non-owners (the
-- public teacher preview today; session, message and review counterparties
-- tomorrow). Projecting "safe" columns through a view only works with a
-- security-definer view, which Supabase lint 0010 flags as ERROR. Putting the
-- sensitive columns in their own owner-only table makes the whole `profiles`
-- row safe to expose and needs no view or definer trick, now or later.
--
-- Other choices worth knowing:
--   * Money is integer minor units + a currency code (00-CONTEXT rule 8):
--     teacher_profiles.hourly_rate_minor / currency, default 'DZD'.
--   * Role is stored ONCE, in profiles.role, and read through
--     private.user_role(). Never from raw_user_meta_data.
--   * Role is immutable once the role-specific row exists: the composite FK
--     (user_id, role) -> profiles (id, role) blocks the change declaratively,
--     and `role` is excluded from the column-level UPDATE grant.
--   * availabilityHours ("Lun-Ven 14-20h") is NOT stored. Task 04 models it.
--   * email is not duplicated from auth.users.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
-- citext for the guardian email (case-insensitive compare). Installed into
-- the `extensions` schema like the rest of the Supabase-managed extensions.
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- private schema · helpers that must never be reachable through the API
-- ---------------------------------------------------------------------------
-- `private` is not in PostgREST's exposed schemas (only public and
-- graphql_public are), so nothing here is callable over HTTP. USAGE is still
-- required so that policies evaluated as anon/authenticated can call the
-- helpers, and so the auth admin role can run the sign-up trigger.
create schema if not exists private;

grant usage on schema private to anon, authenticated, service_role, supabase_auth_admin;

-- Functions are executable by PUBLIC by default. Turn that off for everything
-- created in this schema from now on; each helper grants execute explicitly.
alter default privileges in schema private revoke execute on functions from public;

-- updated_at maintenance
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public;
grant execute on function private.set_updated_at() to authenticated, service_role, supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- Enums · closed unions this task owns (money / invoice / payout /
-- notification enums belong to later tasks and are NOT created here)
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'teacher');

create type public.verification_status as enum (
  'pending', 'in-progress', 'approved', 'rejected'
);

create type public.verification_step as enum (
  'identity', 'diplomas', 'bio', 'final'
);

create type public.device_kind as enum ('desktop', 'mobile');

-- ---------------------------------------------------------------------------
-- profiles · one row per auth.users row, same primary key
-- ---------------------------------------------------------------------------
-- Public-safe identity common to both roles. Nothing in this table is secret:
-- teachers' rows are world-readable (the /teacher/preview/[username] shop
-- window), and later tasks will let counterparties read students' rows.
-- Anything that must stay private goes in profiles_private.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null,
  full_name   text not null,
  city        text,
  avatar_path text,                       -- storage object path, never a URL
  ui_locale   text not null default 'fr', -- interface language ("Compte" section)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_full_name_len
    check (char_length(btrim(full_name)) between 2 and 120),
  constraint profiles_city_len
    check (city is null or char_length(btrim(city)) between 1 and 80),
  constraint profiles_avatar_path_len
    check (avatar_path is null or char_length(avatar_path) between 1 and 512),
  constraint profiles_ui_locale_allowed
    check (ui_locale in ('fr', 'ar', 'en')),

  -- Target of the composite FKs on teacher_profiles / student_profiles.
  constraint profiles_id_role_key unique (id, role)
);

comment on table  public.profiles is
  'One row per auth user. Public-safe identity only; secrets live in profiles_private.';
comment on column public.profiles.role is
  'Source of truth for the user role. Read via private.user_role(); never from raw_user_meta_data.';
comment on column public.profiles.avatar_path is
  'Path of the object in the avatars storage bucket. Build the URL at render time.';

-- Referenced by the public-read policy below.
create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- The role helper · used by nearly every future policy
-- ---------------------------------------------------------------------------
-- Always call it wrapped so it runs once per statement, not once per row:
--   (select private.user_role()) = 'teacher'
create or replace function private.user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid());
$$;

comment on function private.user_role() is
  'Role of the calling user, or null when signed out. Call as (select private.user_role()).';

revoke execute on function private.user_role() from public;
grant execute on function private.user_role() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- profiles_private · the columns that must never leak
-- ---------------------------------------------------------------------------
create table public.profiles_private (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  birth_date     date,               -- composed server-side from dobY/dobM/dobD
  phone          text,
  guardian_name  text,               -- "Nom du tuteur" on the student Lien parental section
  guardian_email extensions.citext,  -- required while the user is a minor
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- The sign-up form has an upper bound (no future dates) but no lower bound:
  -- an age of 3 passes today. Collège starts around 11; 10 leaves slack.
  -- Both bounds only become MORE satisfied as time passes, so no row can
  -- retroactively violate the constraint.
  constraint profiles_private_birth_date_plausible check (
    birth_date is null
    or (
      birth_date <= (current_date - interval '10 years')
      and birth_date > (current_date - interval '100 years')
    )
  ),

  -- The guardian relationship is recorded deliberately: a minor cannot exist
  -- without a guardian email. Once the person turns 18 the row stays valid;
  -- the guardian email is simply no longer required (not forbidden).
  constraint profiles_private_guardian_required_for_minors check (
    birth_date is null
    or birth_date <= (current_date - interval '18 years')
    or guardian_email is not null
  ),

  -- Mirrors EMAIL_RE in the sign-up UI so a DB rejection reads the same.
  constraint profiles_private_guardian_email_format check (
    guardian_email is null
    or guardian_email::text ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  ),
  constraint profiles_private_guardian_name_len check (
    guardian_name is null or char_length(btrim(guardian_name)) between 2 and 120
  ),
  constraint profiles_private_phone_format check (
    phone is null or phone ~ '^\+?[0-9][0-9 .-]{5,24}$'
  )
);

comment on table public.profiles_private is
  'Owner-only companion of profiles: birth date, phone, guardian. Never joined into a public read.';

create trigger profiles_private_set_updated_at
  before update on public.profiles_private
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- teacher_profiles · one row per teacher
-- ---------------------------------------------------------------------------
create table public.teacher_profiles (
  user_id           uuid primary key,
  -- Always 'teacher'. Exists only so the composite FK below can prove that
  -- the parent profile really is a teacher, without a trigger.
  role              public.user_role not null default 'teacher',
  username          text not null,      -- the [username] route parameter
  tagline           text,
  bio               text,
  hourly_rate_minor integer,            -- centimes; 220 DZD/h is stored as 22000
  currency          char(3) not null default 'DZD',
  years_experience  smallint,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint teacher_profiles_role_is_teacher check (role = 'teacher'),
  constraint teacher_profiles_profile_fkey
    foreign key (user_id, role) references public.profiles (id, role) on delete cascade,

  constraint teacher_profiles_username_key unique (username),
  constraint teacher_profiles_username_format check (
    username ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(username) between 3 and 40
  ),
  constraint teacher_profiles_tagline_len
    check (tagline is null or char_length(tagline) <= 120),
  constraint teacher_profiles_bio_len
    check (bio is null or char_length(bio) <= 2000),
  constraint teacher_profiles_hourly_rate_nonneg
    check (hourly_rate_minor is null or hourly_rate_minor >= 0),
  constraint teacher_profiles_currency_format
    check (currency ~ '^[A-Z]{3}$'),
  constraint teacher_profiles_experience_range
    check (years_experience is null or years_experience between 0 and 60)
);

comment on table  public.teacher_profiles is
  'Professional profile of a teacher. World-readable; only the owner writes. Availability is Task 04.';
comment on column public.teacher_profiles.hourly_rate_minor is
  'Hourly rate in minor units (centimes) of `currency`. Null until onboarding sets it.';
comment on column public.teacher_profiles.username is
  'Unique lowercase slug, 3-40 chars, used as the /teacher/preview/[username] route parameter.';

create trigger teacher_profiles_set_updated_at
  before update on public.teacher_profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- student_profiles · one row per student (thin for now)
-- ---------------------------------------------------------------------------
-- The student profile page persists a class label ("Terminale S"), a school
-- ("Lycée Descartes"), a bio and subjects of interest. The school-level tier
-- (level_id -> levels) is attached in the reference-vocabularies migration,
-- and subjects of interest are the student_subjects join table there.
create table public.student_profiles (
  user_id     uuid primary key,
  role        public.user_role not null default 'student',
  class_label text,   -- "Terminale S", "1ère S", "Prépa MPSI"
  school      text,   -- "Lycée Descartes"
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint student_profiles_role_is_student check (role = 'student'),
  constraint student_profiles_profile_fkey
    foreign key (user_id, role) references public.profiles (id, role) on delete cascade,
  constraint student_profiles_class_label_len
    check (class_label is null or char_length(btrim(class_label)) between 1 and 60),
  constraint student_profiles_school_len
    check (school is null or char_length(btrim(school)) between 1 and 120),
  constraint student_profiles_bio_len
    check (bio is null or char_length(bio) <= 1000)
);

comment on table public.student_profiles is
  'Student-only profile data. Not public; owner-only until later tasks grant counterparties a read.';

create trigger student_profiles_set_updated_at
  before update on public.student_profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Public teacher preview · explicit safe columns, invoker semantics
-- ---------------------------------------------------------------------------
-- security_invoker means the caller's RLS applies: anon sees exactly the rows
-- the profiles/teacher_profiles policies allow, and only these columns.
create view public.teacher_public_profiles
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
  tp.created_at
from public.teacher_profiles tp
join public.profiles p on p.id = tp.user_id;

comment on view public.teacher_public_profiles is
  'The /teacher/preview/[username] shop window. Safe columns only; runs with the caller''s RLS.';

-- ---------------------------------------------------------------------------
-- Privileges · explicit, and column-level where a column must stay immutable
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant update (full_name, city, avatar_path, ui_locale) on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

revoke all on table public.profiles_private from anon, authenticated;
grant select on table public.profiles_private to authenticated;
grant update (birth_date, phone, guardian_name, guardian_email) on table public.profiles_private to authenticated;
grant all on table public.profiles_private to service_role;

revoke all on table public.teacher_profiles from anon, authenticated;
grant select on table public.teacher_profiles to anon, authenticated;
grant insert on table public.teacher_profiles to authenticated;
grant update (username, tagline, bio, hourly_rate_minor, currency, years_experience)
  on table public.teacher_profiles to authenticated;
grant all on table public.teacher_profiles to service_role;

revoke all on table public.student_profiles from anon, authenticated;
grant select on table public.student_profiles to authenticated;
grant insert on table public.student_profiles to authenticated;
grant update (class_label, school, bio) on table public.student_profiles to authenticated;
grant all on table public.student_profiles to service_role;

revoke all on table public.teacher_public_profiles from anon, authenticated;
grant select on table public.teacher_public_profiles to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row level security · every table, every policy names a role, every auth
-- call is wrapped in a subselect. One permissive policy per (table, action).
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.profiles_private enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.student_profiles enable row level security;

-- profiles: teachers are public; everyone reads their own row.
-- (select auth.uid()) is null when signed out, so `null = id` is never true
-- and anon falls through to the role check.
create policy profiles_select
  on public.profiles
  for select
  to anon, authenticated
  using (
    role = 'teacher'
    or (select auth.uid()) = id
  );

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No insert/delete policies: rows are created by the auth.users trigger and
-- die by cascade when the auth user is deleted.

-- profiles_private: owner only, never anon.
create policy profiles_private_select_own
  on public.profiles_private
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy profiles_private_update_own
  on public.profiles_private
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- teacher_profiles: public shop window, owner writes.
create policy teacher_profiles_select_public
  on public.teacher_profiles
  for select
  to anon, authenticated
  using (true);

create policy teacher_profiles_insert_own
  on public.teacher_profiles
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.user_role()) = 'teacher'
  );

create policy teacher_profiles_update_own
  on public.teacher_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- student_profiles: not public.
create policy student_profiles_select_own
  on public.student_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy student_profiles_insert_own
  on public.student_profiles
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.user_role()) = 'student'
  );

create policy student_profiles_update_own
  on public.student_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

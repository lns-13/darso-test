-- =============================================================================
-- Task 01 · Reference vocabularies and join tables
-- =============================================================================
-- subjects / levels / languages, seeded verbatim from the mocks after
-- resolving inconsistency 1, plus the teacher_* join tables, the
-- student_subjects join table and student_profiles.level_id.
--
-- DECISION · inconsistency 1, the subject vocabulary
-- -----------------------------------------------------------------------------
-- Four vocabularies exist in the mocks:
--   a. AVAILABLE_SUBJECTS_TAUGHT (teacher-profile.ts, 10): Mathématiques,
--      Physique-Chimie, SVT, Français, Anglais, Arabe, Histoire-Géo,
--      Philosophie, Économie, Informatique
--   b. mockSubjectPool (teacher-verification.ts, 11): a. minus Économie,
--      plus Espagnol and SES
--   c. AVAILABLE_SUBJECTS on the student profile page (8): "Maths" instead
--      of "Mathématiques", no Arabe/Informatique
--   d. free text in TeacherTransaction.subject / MatchingRequest.subject:
--      "Maths", "Maths sup", ...
-- Resolution: the UNION of a. and b., with these merges:
--   * "SES" (Sciences économiques et sociales) is folded into "Économie".
--     They are the same lycée subject seen from two curricula; splitting
--     later is a one-row insert, merging later is a data migration.
--   * "Maths" is treated as an abbreviation of "Mathématiques", not a subject.
--   * Free-text values ("Maths sup") are mapped to a subject by the seed
--     (Task 06); the level ("sup") belongs on the level axis, not the subject.
-- Display names keep the accents exactly as the UI shows them. Slugs are
-- ASCII and stable; code should reference slugs, never ids.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------
create table public.subjects (
  id         smallint generated always as identity primary key,
  slug       text not null,
  name       text not null,
  sort_order smallint not null default 0,

  constraint subjects_slug_key unique (slug),
  constraint subjects_name_key unique (name),
  constraint subjects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.levels (
  id         smallint generated always as identity primary key,
  slug       text not null,
  name       text not null,
  sort_order smallint not null default 0,

  constraint levels_slug_key unique (slug),
  constraint levels_name_key unique (name),
  constraint levels_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.languages (
  id         smallint generated always as identity primary key,
  slug       text not null,
  name       text not null,
  sort_order smallint not null default 0,

  constraint languages_slug_key unique (slug),
  constraint languages_name_key unique (name),
  constraint languages_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.subjects  is 'Reference vocabulary of teachable subjects. Read-only through the API.';
comment on table public.levels    is 'Reference vocabulary of school tiers (AVAILABLE_LEVELS). Read-only through the API.';
comment on table public.languages is 'Reference vocabulary of teaching languages (AVAILABLE_LANGUAGES). Read-only through the API.';

-- ---------------------------------------------------------------------------
-- Seeds · verbatim display names
-- ---------------------------------------------------------------------------
insert into public.subjects (slug, name, sort_order) values
  ('mathematiques',   'Mathématiques',   10),
  ('physique-chimie', 'Physique-Chimie', 20),
  ('svt',             'SVT',             30),
  ('francais',        'Français',        40),
  ('anglais',         'Anglais',         50),
  ('arabe',           'Arabe',           60),
  ('espagnol',        'Espagnol',        70),
  ('histoire-geo',    'Histoire-Géo',    80),
  ('philosophie',     'Philosophie',     90),
  ('economie',        'Économie',       100),
  ('informatique',    'Informatique',   110)
on conflict (slug) do nothing;

insert into public.levels (slug, name, sort_order) values
  ('college', 'Collège', 10),
  ('lycee',   'Lycée',   20),
  ('prepa',   'Prépa',   30),
  ('sup',     'Sup',     40)
on conflict (slug) do nothing;

insert into public.languages (slug, name, sort_order) values
  ('francais', 'Français', 10),
  ('arabe',    'Arabe',    20),
  ('anglais',  'Anglais',  30),
  ('espagnol', 'Espagnol', 40),
  ('amazigh',  'Amazigh',  50)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Teacher join tables · part of the public shop window
-- ---------------------------------------------------------------------------
create table public.teacher_subjects (
  teacher_id uuid     not null references public.teacher_profiles (user_id) on delete cascade,
  subject_id smallint not null references public.subjects (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (teacher_id, subject_id)
);
create index teacher_subjects_subject_id_idx on public.teacher_subjects (subject_id);

create table public.teacher_levels (
  teacher_id uuid     not null references public.teacher_profiles (user_id) on delete cascade,
  level_id   smallint not null references public.levels (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (teacher_id, level_id)
);
create index teacher_levels_level_id_idx on public.teacher_levels (level_id);

create table public.teacher_languages (
  teacher_id  uuid     not null references public.teacher_profiles (user_id) on delete cascade,
  language_id smallint not null references public.languages (id) on delete restrict,
  created_at  timestamptz not null default now(),
  primary key (teacher_id, language_id)
);
create index teacher_languages_language_id_idx on public.teacher_languages (language_id);

-- ---------------------------------------------------------------------------
-- Student side · subjects of interest and the school tier
-- ---------------------------------------------------------------------------
create table public.student_subjects (
  student_id uuid     not null references public.student_profiles (user_id) on delete cascade,
  subject_id smallint not null references public.subjects (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (student_id, subject_id)
);
create index student_subjects_subject_id_idx on public.student_subjects (subject_id);

alter table public.student_profiles
  add column level_id smallint references public.levels (id) on delete set null;
create index student_profiles_level_id_idx on public.student_profiles (level_id);

comment on column public.student_profiles.level_id is
  'School tier (levels). class_label carries the finer label such as "Terminale S".';

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on table public.subjects, public.levels, public.languages from anon, authenticated;
grant select on table public.subjects, public.levels, public.languages to anon, authenticated;
grant all on table public.subjects, public.levels, public.languages to service_role;

revoke all on table public.teacher_subjects, public.teacher_levels, public.teacher_languages
  from anon, authenticated;
grant select on table public.teacher_subjects, public.teacher_levels, public.teacher_languages
  to anon, authenticated;
grant insert, delete on table public.teacher_subjects, public.teacher_levels, public.teacher_languages
  to authenticated;
grant all on table public.teacher_subjects, public.teacher_levels, public.teacher_languages
  to service_role;

revoke all on table public.student_subjects from anon, authenticated;
grant select, insert, delete on table public.student_subjects to authenticated;
grant all on table public.student_subjects to service_role;

-- student_profiles.level_id joins the column-level UPDATE grant from the
-- identity_core migration.
grant update (level_id) on table public.student_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.subjects          enable row level security;
alter table public.levels            enable row level security;
alter table public.languages         enable row level security;
alter table public.teacher_subjects  enable row level security;
alter table public.teacher_levels    enable row level security;
alter table public.teacher_languages enable row level security;
alter table public.student_subjects  enable row level security;

-- Reference tables: readable by everyone, written only by migrations.
create policy subjects_select_all  on public.subjects  for select to anon, authenticated using (true);
create policy levels_select_all    on public.levels    for select to anon, authenticated using (true);
create policy languages_select_all on public.languages for select to anon, authenticated using (true);

-- Teacher join tables: public read, owner insert/delete (no update; rows are
-- replaced, not edited).
create policy teacher_subjects_select_public
  on public.teacher_subjects for select to anon, authenticated using (true);
create policy teacher_subjects_insert_own
  on public.teacher_subjects for insert to authenticated
  with check ((select auth.uid()) = teacher_id);
create policy teacher_subjects_delete_own
  on public.teacher_subjects for delete to authenticated
  using ((select auth.uid()) = teacher_id);

create policy teacher_levels_select_public
  on public.teacher_levels for select to anon, authenticated using (true);
create policy teacher_levels_insert_own
  on public.teacher_levels for insert to authenticated
  with check ((select auth.uid()) = teacher_id);
create policy teacher_levels_delete_own
  on public.teacher_levels for delete to authenticated
  using ((select auth.uid()) = teacher_id);

create policy teacher_languages_select_public
  on public.teacher_languages for select to anon, authenticated using (true);
create policy teacher_languages_insert_own
  on public.teacher_languages for insert to authenticated
  with check ((select auth.uid()) = teacher_id);
create policy teacher_languages_delete_own
  on public.teacher_languages for delete to authenticated
  using ((select auth.uid()) = teacher_id);

-- Student subjects of interest: owner only.
create policy student_subjects_select_own
  on public.student_subjects for select to authenticated
  using ((select auth.uid()) = student_id);
create policy student_subjects_insert_own
  on public.student_subjects for insert to authenticated
  with check ((select auth.uid()) = student_id);
create policy student_subjects_delete_own
  on public.student_subjects for delete to authenticated
  using ((select auth.uid()) = student_id);

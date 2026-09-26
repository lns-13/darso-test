-- =============================================================================
-- Task 01 · New-user bootstrap
-- =============================================================================
-- Guarantees the invariant "one auth user = one profiles row + one
-- profiles_private row + exactly one role-specific row" at the moment the
-- auth user is created, whatever created it (sign-up, dashboard invite, a
-- future social provider).
--
-- CONTRACT FOR TASK 02 · pass these keys in supabase.auth.signUp options.data:
--   full_name       string   required in practice; falls back to the email
--                            local part, then "Utilisateur"
--   role            "student" | "teacher"; anything else -> "student"
--   birth_date      "YYYY-MM-DD" composed server-side from dobY/dobM/dobD;
--                            unparseable -> null
--   guardian_email  string   ignored when birth_date says the user is 18+
--                            (00-CONTEXT rule: never trust the client on this)
-- Everything else in raw_user_meta_data is ignored. The role is read ONCE,
-- here, into profiles.role; no policy ever reads raw_user_meta_data again.
-- Because a user can only self-select 'student' or 'teacher', reading the
-- choice once at creation is not an escalation path; if a privileged role is
-- ever added to the enum, keep the whitelist below as it is.
--
-- If the metadata violates a constraint (implausible birth date, minor with
-- no guardian email) the auth insert fails loudly. Task 02's server action
-- must validate first and produce the French messages; this is the backstop.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Slug helpers · pure SQL, no unaccent extension needed for French names
-- ---------------------------------------------------------------------------
create or replace function private.slugify(input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(
    regexp_replace(
      lower(
        translate(
          coalesce(input, ''),
          'àáâãäåæçèéêëìíîïñòóôõöøœùúûüýÿßÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØŒÙÚÛÜÝ',
          'aaaaaaaceeeeiiiinoooooooouuuuyysaaaaaaaceeeeiiiinoooooooouuuuy'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    ),
    '-'
  );
$$;

revoke execute on function private.slugify(text) from public;
grant execute on function private.slugify(text) to service_role, supabase_auth_admin;

-- Allocates a username that satisfies teacher_profiles_username_format and
-- is free. "Youssef Amrani" -> youssef-amrani, then youssef-amrani-3f9c on
-- collision. The teacher can rename it later from the profile page.
create or replace function private.unique_teacher_username(base_name text)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_base      text;
  v_candidate text;
  v_attempt   integer := 0;
begin
  v_base := btrim(left(private.slugify(base_name), 32), '-');
  if char_length(v_base) < 3 then
    v_base := 'prof';
  end if;

  v_candidate := v_base;
  while exists (
    select 1 from public.teacher_profiles tp where tp.username = v_candidate
  ) loop
    v_attempt := v_attempt + 1;
    if v_attempt > 25 then
      raise exception 'unique_teacher_username: could not allocate a username for %', base_name;
    end if;
    v_candidate := v_base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end loop;

  return v_candidate;
end;
$$;

revoke execute on function private.unique_teacher_username(text) from public;
grant execute on function private.unique_teacher_username(text) to service_role, supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- The trigger function
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta           jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role           public.user_role;
  v_full_name      text;
  v_birth_date     date;
  v_guardian_email text;
begin
  -- role: whitelist, default student
  v_role := case
    when v_meta ->> 'role' in ('student', 'teacher') then (v_meta ->> 'role')::public.user_role
    else 'student'::public.user_role
  end;

  -- full name: sign-up sends full_name; OAuth providers send name
  v_full_name := nullif(btrim(coalesce(v_meta ->> 'full_name', v_meta ->> 'name', '')), '');
  if v_full_name is null or char_length(v_full_name) < 2 then
    v_full_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  if v_full_name is null or char_length(v_full_name) < 2 then
    v_full_name := 'Utilisateur';
  end if;
  v_full_name := left(v_full_name, 120);

  -- birth date: ISO calendar date or nothing
  begin
    v_birth_date := nullif(btrim(coalesce(v_meta ->> 'birth_date', '')), '')::date;
  exception when others then
    v_birth_date := null;
  end;

  -- guardian email: only meaningful for minors; dropped for adults server-side
  v_guardian_email := nullif(btrim(coalesce(v_meta ->> 'guardian_email', '')), '');
  if v_birth_date is not null
     and v_birth_date <= (current_date - interval '18 years') then
    v_guardian_email := null;
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, v_full_name);

  insert into public.profiles_private (user_id, birth_date, guardian_email)
  values (new.id, v_birth_date, v_guardian_email);

  if v_role = 'teacher' then
    insert into public.teacher_profiles (user_id, username)
    values (new.id, private.unique_teacher_username(v_full_name));
  else
    insert into public.student_profiles (user_id)
    values (new.id);
  end if;

  return new;
end;
$$;

comment on function private.handle_new_user() is
  'AFTER INSERT on auth.users: creates profiles, profiles_private and the role row from sign-up metadata.';

revoke execute on function private.handle_new_user() from public;
grant execute on function private.handle_new_user() to supabase_auth_admin, service_role;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

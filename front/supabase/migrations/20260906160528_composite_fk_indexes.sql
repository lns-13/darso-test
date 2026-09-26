-- =============================================================================
-- Task 01 · Covering indexes for the composite role foreign keys
-- =============================================================================
-- teacher_profiles and student_profiles reference profiles (id, role) with a
-- two-column FK. The primary key on user_id already makes the parent-side
-- cascade lookups fast, but the database linter (0001_unindexed_foreign_keys)
-- only recognises an index whose leading columns match the FK exactly.
-- These indexes make that explicit and keep the performance advisor clean.
-- =============================================================================

create index teacher_profiles_user_id_role_idx
  on public.teacher_profiles (user_id, role);

create index student_profiles_user_id_role_idx
  on public.student_profiles (user_id, role);

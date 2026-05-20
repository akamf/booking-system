-- SQL test suite for booking constraints and rule enforcement.
--
-- Each test runs inside its own transaction and rolls back, so the
-- file is idempotent — running it twice has the same effect as once.
-- Failures raise an exception, which aborts the script with a clear
-- message; "no errors" means all tests passed.
--
-- Run from the repo root:
--   pnpm db:start
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--        -v ON_ERROR_STOP=1 -f supabase/tests/bookings.sql

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- helper: shared fixture creation (used by each test)
-- ---------------------------------------------------------------------------
create or replace function pg_temp.seed_fixture()
returns table (org uuid, loc uuid, res uuid, act uuid, user_id uuid)
language plpgsql as $$
declare
  v_org  uuid := gen_random_uuid();
  v_loc  uuid := gen_random_uuid();
  v_res  uuid := gen_random_uuid();
  v_act  uuid := gen_random_uuid();
  v_user uuid := gen_random_uuid();
  v_type uuid;
begin
  -- create an auth user (Supabase auth.users requires a few columns)
  insert into auth.users (id, email, created_at, updated_at, aud, role, instance_id)
  values (v_user, format('%s@test.local', v_user), now(), now(), 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');

  insert into public.organizations (id, name, slug) values (v_org, 'Test Org', 'test-org');
  insert into public.locations (id, organization_id, name, timezone)
    values (v_loc, v_org, 'Test Hall', 'Europe/Stockholm');

  select id into v_type from public.resource_types where key = 'court' limit 1;
  insert into public.resources (id, location_id, type_id, name)
    values (v_res, v_loc, v_type, 'Court 1');

  insert into public.activities (id, organization_id, name, slug, min_duration_minutes, default_duration_minutes, max_duration_minutes, cancellation_cutoff_minutes, self_book_min_age)
    values (v_act, v_org, 'Test Activity', 'test-act', 30, 60, 180, 120, 13);

  insert into public.activity_resource_compatibility (activity_id, resource_id)
    values (v_act, v_res);

  -- 24/7 opening hours so every test slot is within hours
  for d in 0..6 loop
    insert into public.opening_hours (location_id, weekday, opens_at, closes_at)
      values (v_loc, d, '00:00', '23:59:59');
  end loop;

  insert into public.profiles (user_id, display_name) values (v_user, 'Tester');
  insert into public.user_roles (user_id, role_key) values (v_user, 'member');

  return query select v_org, v_loc, v_res, v_act, v_user;
end;
$$;

-- ---------------------------------------------------------------------------
-- TEST 1: exclusion constraint blocks an overlapping booking
-- ---------------------------------------------------------------------------
do $$
declare
  f record;
  v_caught boolean := false;
begin
  select * into f from pg_temp.seed_fixture();

  -- Direct INSERT bypasses RPC validation but the exclusion constraint
  -- still fires — that's the point of testing it here.
  insert into public.bookings (resource_id, activity_id, booked_by_user_id, starts_at, ends_at, status)
    values (f.res, f.act, f.user_id, '2099-01-01 10:00+00', '2099-01-01 11:00+00', 'confirmed');

  begin
    insert into public.bookings (resource_id, activity_id, booked_by_user_id, starts_at, ends_at, status)
      values (f.res, f.act, f.user_id, '2099-01-01 10:30+00', '2099-01-01 11:30+00', 'confirmed');
  exception when exclusion_violation then
    v_caught := true;
  end;

  if not v_caught then
    raise exception 'TEST 1 FAILED: overlap not blocked by exclusion constraint';
  end if;
  raise notice 'TEST 1 ok: exclusion constraint blocks overlap';
end $$;

-- ---------------------------------------------------------------------------
-- TEST 2: back-to-back bookings (sharing an endpoint) are allowed
-- ---------------------------------------------------------------------------
do $$
declare
  f record;
begin
  select * into f from pg_temp.seed_fixture();

  insert into public.bookings (resource_id, activity_id, booked_by_user_id, starts_at, ends_at, status)
    values (f.res, f.act, f.user_id, '2099-01-02 10:00+00', '2099-01-02 11:00+00', 'confirmed');

  -- Half-open '[)' interval means 11:00 == 11:00 is not an overlap
  insert into public.bookings (resource_id, activity_id, booked_by_user_id, starts_at, ends_at, status)
    values (f.res, f.act, f.user_id, '2099-01-02 11:00+00', '2099-01-02 12:00+00', 'confirmed');

  raise notice 'TEST 2 ok: back-to-back bookings allowed';
end $$;

-- ---------------------------------------------------------------------------
-- TEST 3: cancelling a booking frees the slot
-- ---------------------------------------------------------------------------
do $$
declare
  f record;
  v_first uuid;
begin
  select * into f from pg_temp.seed_fixture();

  insert into public.bookings (id, resource_id, activity_id, booked_by_user_id, starts_at, ends_at, status)
    values (gen_random_uuid(), f.res, f.act, f.user_id, '2099-01-03 10:00+00', '2099-01-03 11:00+00', 'confirmed')
    returning id into v_first;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by_user_id = f.user_id
   where id = v_first;

  -- Same slot now bookable
  insert into public.bookings (resource_id, activity_id, booked_by_user_id, starts_at, ends_at, status)
    values (f.res, f.act, f.user_id, '2099-01-03 10:00+00', '2099-01-03 11:00+00', 'confirmed');

  raise notice 'TEST 3 ok: cancelled booking frees the slot';
end $$;

-- ---------------------------------------------------------------------------
-- TEST 4: book_resource RPC raises ACTIVITY_NOT_ALLOWED_ON_RESOURCE
-- ---------------------------------------------------------------------------
do $$
declare
  f record;
  v_other_res uuid := gen_random_uuid();
  v_type uuid;
  v_caught_hint text;
begin
  select * into f from pg_temp.seed_fixture();
  select id into v_type from public.resource_types where key = 'court' limit 1;
  insert into public.resources (id, location_id, type_id, name)
    values (v_other_res, f.loc, v_type, 'Court Z');

  -- Impersonate the user via JWT claim
  perform set_config('request.jwt.claims', json_build_object('sub', f.user_id::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  begin
    perform public.book_resource(v_other_res, f.act, '2099-01-04 10:00+00', '2099-01-04 11:00+00');
  exception when others then
    get stacked diagnostics v_caught_hint = pg_exception_hint;
  end;

  -- restore
  perform set_config('role', 'postgres', true);

  if v_caught_hint <> 'ACTIVITY_NOT_ALLOWED_ON_RESOURCE' then
    raise exception 'TEST 4 FAILED: expected ACTIVITY_NOT_ALLOWED_ON_RESOURCE, got %', coalesce(v_caught_hint, '<none>');
  end if;
  raise notice 'TEST 4 ok: book_resource rejects incompatible activity';
end $$;

-- ---------------------------------------------------------------------------
-- TEST 5: book_resource RPC raises OUTSIDE_OPENING_HOURS
-- ---------------------------------------------------------------------------
do $$
declare
  f record;
  v_caught_hint text;
begin
  select * into f from pg_temp.seed_fixture();

  -- Tighten opening hours to 09:00–17:00 on all weekdays
  delete from public.opening_hours where location_id = f.loc;
  for d in 0..6 loop
    insert into public.opening_hours (location_id, weekday, opens_at, closes_at)
      values (f.loc, d, '09:00', '17:00');
  end loop;

  perform set_config('request.jwt.claims', json_build_object('sub', f.user_id::text, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  -- 02:00 UTC = 03:00 local in Stockholm (winter) — outside 09:00–17:00
  begin
    perform public.book_resource(f.res, f.act, '2099-01-05 02:00+00', '2099-01-05 03:00+00');
  exception when others then
    get stacked diagnostics v_caught_hint = pg_exception_hint;
  end;
  perform set_config('role', 'postgres', true);

  if v_caught_hint <> 'OUTSIDE_OPENING_HOURS' then
    raise exception 'TEST 5 FAILED: expected OUTSIDE_OPENING_HOURS, got %', coalesce(v_caught_hint, '<none>');
  end if;
  raise notice 'TEST 5 ok: book_resource rejects outside opening hours';
end $$;

-- ---------------------------------------------------------------------------
-- TEST 6: CHECK constraint rejects zero-or-negative duration
-- ---------------------------------------------------------------------------
do $$
declare
  f record;
  v_caught boolean := false;
begin
  select * into f from pg_temp.seed_fixture();
  begin
    insert into public.bookings (resource_id, activity_id, booked_by_user_id, starts_at, ends_at, status)
      values (f.res, f.act, f.user_id, '2099-01-06 10:00+00', '2099-01-06 10:00+00', 'confirmed');
  exception when check_violation then
    v_caught := true;
  end;
  if not v_caught then
    raise exception 'TEST 6 FAILED: zero-duration booking accepted';
  end if;
  raise notice 'TEST 6 ok: CHECK rejects zero-duration booking';
end $$;

\echo 'All booking tests passed.'

-- Seed data for local development.
--
-- Run automatically by `supabase db reset` against the local DB.
-- Idempotent via ON CONFLICT clauses so it can be re-applied without
-- duplicating rows.

-- ---------------------------------------------------------------------------
-- Organization & location
-- ---------------------------------------------------------------------------
insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Sportshallen', 'sportshallen')
on conflict (id) do nothing;

insert into public.locations (id, organization_id, name, timezone, address)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Sportshallen Central',
  'Europe/Stockholm',
  'Idrottsvägen 1, 111 22 Stockholm'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Opening hours: Mon-Fri 09:00-22:00, Sat-Sun 09:00-20:00
-- (weekday: 0=Sun … 6=Sat)
-- ---------------------------------------------------------------------------
do $$
declare
  v_loc uuid := '00000000-0000-0000-0000-000000000010';
  d     integer;
begin
  for d in 1..5 loop
    insert into public.opening_hours (location_id, weekday, opens_at, closes_at)
    select v_loc, d, time '09:00', time '22:00'
    where not exists (
      select 1 from public.opening_hours
      where location_id = v_loc and weekday = d and opens_at = time '09:00' and closes_at = time '22:00'
    );
  end loop;
  foreach d in array array[0, 6] loop
    insert into public.opening_hours (location_id, weekday, opens_at, closes_at)
    select v_loc, d, time '09:00', time '20:00'
    where not exists (
      select 1 from public.opening_hours
      where location_id = v_loc and weekday = d and opens_at = time '09:00' and closes_at = time '20:00'
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Activities
-- ---------------------------------------------------------------------------
insert into public.activities (id, organization_id, name, slug, color, default_duration_minutes, min_duration_minutes, max_duration_minutes, self_book_min_age)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Volleyball',  'volleyball',  '#2f7aff', 90, 60, 180, 13),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Badminton',   'badminton',   '#16a34a', 60, 30, 120, 12),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Pickleball',  'pickleball',  '#d97706', 60, 30, 120, 12),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'Basketball',  'basketball',  '#dc2626', 90, 60, 180, 13)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Resources: four courts
-- ---------------------------------------------------------------------------
do $$
declare
  v_loc       uuid := '00000000-0000-0000-0000-000000000010';
  v_type_court uuid;
begin
  select id into v_type_court from public.resource_types where key = 'court';

  insert into public.resources (id, location_id, type_id, name, description, capacity)
  values
    ('00000000-0000-0000-0000-000000000201', v_loc, v_type_court, 'Court A', 'Full-size volleyball / badminton court', 12),
    ('00000000-0000-0000-0000-000000000202', v_loc, v_type_court, 'Court B', 'Full-size volleyball / badminton court', 12),
    ('00000000-0000-0000-0000-000000000203', v_loc, v_type_court, 'Court C', 'Pickleball / badminton',                  4),
    ('00000000-0000-0000-0000-000000000204', v_loc, v_type_court, 'Court D', 'Basketball half-court',                   10)
  on conflict (id) do nothing;
end $$;

-- ---------------------------------------------------------------------------
-- Activity ↔ resource compatibility
--   Court A / B: volleyball, badminton
--   Court C:     badminton, pickleball
--   Court D:     basketball
-- ---------------------------------------------------------------------------
insert into public.activity_resource_compatibility (activity_id, resource_id) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000202'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000203'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000203'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000204')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Admin user (local development only — magic-link auth in real envs).
-- Auth password is 'admin1234' for convenience.
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000300',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@sportshallen.local',
  crypt('admin1234', gen_salt('bf')),
  now(), now(), now()
)
on conflict (id) do nothing;

insert into public.profiles (user_id, display_name, birth_year, locale)
values ('00000000-0000-0000-0000-000000000300', 'Site Admin', 1990, 'sv-SE')
on conflict (user_id) do nothing;

insert into public.user_roles (user_id, role_key)
values
  ('00000000-0000-0000-0000-000000000300', 'admin'),
  ('00000000-0000-0000-0000-000000000300', 'staff')
on conflict do nothing;

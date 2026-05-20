-- Identity layer: profiles, roles, user_roles.
--
-- profiles is 1:1 with auth.users and holds the minimal app-side data
-- we choose to retain (ADR-0005). birth_year only — no DOB, no national
-- ID, no free-text notes, no phone, no address.
--
-- Roles are stored in a lookup table and assigned via the M:N
-- user_roles table so a person can be admin + guardian at once
-- (ADR-0009).

create table public.profiles (
  user_id        uuid primary key references auth.users(id) on delete restrict,
  display_name   text not null check (char_length(display_name) between 1 and 60),
  birth_year     integer check (birth_year is null or (birth_year between 1900 and extract(year from now())::int)),
  guardian_email text check (guardian_email is null or guardian_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  locale         text not null default 'sv-SE' check (char_length(locale) between 2 and 10),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index profiles_deleted_at_idx on public.profiles (deleted_at);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Helper: is the profile a minor right now?
create or replace function public.profile_is_minor(birth_year integer)
returns boolean
language sql immutable as $$
  select birth_year is not null
    and (extract(year from now())::int - birth_year) < 18;
$$;

create table public.roles (
  key   text primary key check (key ~ '^[a-z_]+$'),
  label text not null
);

insert into public.roles (key, label) values
  ('admin',    'Administrator'),
  ('staff',    'Staff'),
  ('member',   'Member'),
  ('guardian', 'Guardian'),
  ('youth',    'Youth');

create table public.user_roles (
  user_id     uuid not null references public.profiles(user_id) on delete cascade,
  role_key    text not null references public.roles(key) on delete restrict,
  granted_at  timestamptz not null default now(),
  granted_by  uuid references public.profiles(user_id),
  primary key (user_id, role_key)
);

create index user_roles_role_key_idx on public.user_roles (role_key);

-- Convenience predicates for use inside RLS policies and RPCs.
create or replace function public.current_user_has_role(role text)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role_key = role
  );
$$;

create or replace function public.current_user_is_staff()
returns boolean language sql stable as $$
  select public.current_user_has_role('admin')
      or public.current_user_has_role('staff');
$$;

alter table public.profiles   enable row level security;
alter table public.roles      enable row level security;
alter table public.user_roles enable row level security;

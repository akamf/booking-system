-- Organizations and locations.
--
-- v1 ships with a single organization and a single location, but the
-- schema is keyed on both from day one so multi-location is a UX
-- change later, not a migration (ARCHITECTURE.md §10).

-- Generic `updated_at` maintainer. Reused by every mutable table.
create or replace function public.tg_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.tg_set_updated_at();

create table public.locations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name            text not null check (char_length(name) between 1 and 120),
  timezone        text not null check (char_length(timezone) between 3 and 60),
  address         text check (address is null or char_length(address) <= 500),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz
);

create index locations_organization_id_idx on public.locations (organization_id);

create trigger locations_updated_at
  before update on public.locations
  for each row execute function public.tg_set_updated_at();

-- Default-deny RLS. Policies land in 0009 once roles exist.
alter table public.organizations enable row level security;
alter table public.locations     enable row level security;

-- Opening hours (per location, per weekday) and blocked times.
--
-- weekday matches Postgres extract(dow from …): 0=Sunday … 6=Saturday.
--
-- A location can have multiple windows on the same weekday (e.g.,
-- 09:00–12:00 and 14:00–22:00), so weekday alone is not unique.
--
-- blocked_times always scopes to a location; resource_id may be NULL
-- to block the entire location (a holiday or full-venue maintenance).

create table public.opening_hours (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  weekday     integer not null check (weekday between 0 and 6),
  opens_at    time not null,
  closes_at   time not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (opens_at < closes_at)
);

create index opening_hours_location_weekday_idx
  on public.opening_hours (location_id, weekday);

create trigger opening_hours_updated_at
  before update on public.opening_hours
  for each row execute function public.tg_set_updated_at();

create table public.blocked_times (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.locations(id) on delete cascade,
  resource_id  uuid references public.resources(id) on delete cascade,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  reason       text check (reason is null or char_length(reason) <= 240),
  created_by   uuid references public.profiles(user_id),
  created_at   timestamptz not null default now(),
  check (starts_at < ends_at)
);

create index blocked_times_resource_idx
  on public.blocked_times (resource_id, starts_at, ends_at)
  where resource_id is not null;

create index blocked_times_location_idx
  on public.blocked_times (location_id, starts_at, ends_at)
  where resource_id is null;

alter table public.opening_hours enable row level security;
alter table public.blocked_times enable row level security;

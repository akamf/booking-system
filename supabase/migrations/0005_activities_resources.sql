-- Activities, resource types, resources, and the compatibility matrix
-- between activities and resources.
--
-- An activity (volleyball, badminton, pickleball, …) is a *thing
-- people do*. A resource (Court A, Hall 1, Studio Loft) is a *thing
-- people book*. The two are M:N because a resource may host multiple
-- activities and an activity may be allowed on multiple resources.

create table public.resource_types (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (key ~ '^[a-z_]+$'),
  label       text not null,
  description text
);

insert into public.resource_types (key, label) values
  ('court',       'Court'),
  ('hall',        'Hall'),
  ('studio',      'Studio'),
  ('outdoor',     'Outdoor area');

create table public.resources (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.locations(id) on delete restrict,
  type_id      uuid not null references public.resource_types(id) on delete restrict,
  name         text not null check (char_length(name) between 1 and 80),
  description  text check (description is null or char_length(description) <= 500),
  capacity     integer not null default 1 check (capacity between 1 and 200),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  archived_at  timestamptz
);

create index resources_location_id_idx on public.resources (location_id);
create index resources_archived_idx    on public.resources (archived_at) where archived_at is null;

create trigger resources_updated_at
  before update on public.resources
  for each row execute function public.tg_set_updated_at();

create table public.activities (
  id                          uuid primary key default gen_random_uuid(),
  organization_id             uuid not null references public.organizations(id) on delete restrict,
  name                        text not null check (char_length(name) between 1 and 80),
  slug                        text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  description                 text check (description is null or char_length(description) <= 1000),
  color                       text check (color is null or color ~* '^#[0-9a-f]{6}$'),
  min_age                     integer check (min_age is null or min_age between 0 and 120),
  max_age                     integer check (max_age is null or max_age between 0 and 120),
  default_duration_minutes    integer not null default 60 check (default_duration_minutes between 5 and 1440),
  min_duration_minutes        integer not null default 30 check (min_duration_minutes between 5 and 1440),
  max_duration_minutes        integer not null default 180 check (max_duration_minutes between 5 and 1440),
  cancellation_cutoff_minutes integer not null default 120 check (cancellation_cutoff_minutes between 0 and 10080),
  self_book_min_age           integer not null default 13 check (self_book_min_age between 0 and 120),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  archived_at                 timestamptz,
  unique (organization_id, slug),
  check (min_duration_minutes <= default_duration_minutes),
  check (default_duration_minutes <= max_duration_minutes),
  check (min_age is null or max_age is null or min_age <= max_age)
);

create index activities_organization_id_idx on public.activities (organization_id);
create index activities_archived_idx        on public.activities (archived_at) where archived_at is null;

create trigger activities_updated_at
  before update on public.activities
  for each row execute function public.tg_set_updated_at();

create table public.activity_resource_compatibility (
  activity_id uuid not null references public.activities(id) on delete cascade,
  resource_id uuid not null references public.resources(id)  on delete cascade,
  primary key (activity_id, resource_id)
);

create index arc_resource_idx on public.activity_resource_compatibility (resource_id);

alter table public.resource_types                    enable row level security;
alter table public.resources                         enable row level security;
alter table public.activities                        enable row level security;
alter table public.activity_resource_compatibility   enable row level security;

-- Bookings. The keystone table.
--
-- Concurrency safety is delegated to Postgres: the gist exclusion
-- constraint at the bottom of this migration makes double-booking
-- *impossible* for any (pending | confirmed) row (ADR-0003). The
-- exception type is unique-violation; book_resource() catches it and
-- surfaces a typed RESOURCE_UNAVAILABLE error to clients.

create type public.booking_status as enum (
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

create table public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  resource_id           uuid not null references public.resources(id)   on delete restrict,
  activity_id           uuid not null references public.activities(id)  on delete restrict,
  booked_by_user_id     uuid not null references public.profiles(user_id),
  on_behalf_of_user_id  uuid references public.profiles(user_id),

  starts_at             timestamptz not null,
  ends_at               timestamptz not null,

  status                public.booking_status not null default 'confirmed',
  notes                 text check (notes is null or char_length(notes) <= 240),

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  cancelled_at          timestamptz,
  cancelled_by_user_id  uuid references public.profiles(user_id),
  cancelled_reason      text check (cancelled_reason is null or char_length(cancelled_reason) <= 240),

  override_reason       text check (override_reason is null or char_length(override_reason) <= 240),

  check (starts_at < ends_at),
  check ((status = 'cancelled') = (cancelled_at is not null)),
  check (on_behalf_of_user_id is null or on_behalf_of_user_id <> booked_by_user_id)
);

create index bookings_resource_starts_idx on public.bookings (resource_id, starts_at);
create index bookings_booked_by_idx       on public.bookings (booked_by_user_id);
create index bookings_on_behalf_idx       on public.bookings (on_behalf_of_user_id)
  where on_behalf_of_user_id is not null;
create index bookings_status_idx          on public.bookings (status);

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.tg_set_updated_at();

-- The constraint that makes double-booking impossible.
-- ARDR-0003: half-open interval [starts_at, ends_at) lets back-to-back
-- bookings share an endpoint without "overlapping". Cancelled / completed /
-- no_show rows are excluded from the constraint so the slot is freed.
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    resource_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'));

-- Reserved for future team / group bookings. Minimal in v1.
create table public.booking_participants (
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  is_organizer boolean not null default false,
  added_at     timestamptz not null default now(),
  primary key (booking_id, user_id)
);

create index booking_participants_user_idx on public.booking_participants (user_id);

alter table public.bookings             enable row level security;
alter table public.booking_participants enable row level security;

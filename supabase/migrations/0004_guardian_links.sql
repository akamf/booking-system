-- Guardian ↔ minor relationships.
--
-- M:N: a minor can have multiple guardians (separated parents,
-- foster carer + parent); a guardian can have multiple minors
-- (ADR-0010). Composite PK keeps each pairing unique.

create table public.guardian_links (
  guardian_user_id uuid not null references public.profiles(user_id) on delete cascade,
  minor_user_id    uuid not null references public.profiles(user_id) on delete cascade,
  created_at       timestamptz not null default now(),
  verified_at      timestamptz,
  created_by       uuid references public.profiles(user_id),
  primary key (guardian_user_id, minor_user_id),
  check (guardian_user_id <> minor_user_id)
);

create index guardian_links_minor_idx on public.guardian_links (minor_user_id);

-- Predicate used by RLS and RPCs.
-- Auto-revokes once the minor is no longer a minor — the link row
-- remains for audit but no policy honors it past adulthood.
create or replace function public.current_user_is_guardian_of(target uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.guardian_links gl
      join public.profiles p on p.user_id = gl.minor_user_id
     where gl.guardian_user_id = auth.uid()
       and gl.minor_user_id    = target
       and gl.verified_at is not null
       and public.profile_is_minor(p.birth_year)
  );
$$;

alter table public.guardian_links enable row level security;

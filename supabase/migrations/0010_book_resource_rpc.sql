-- The booking RPC.
--
-- Direct INSERT on bookings is denied by RLS (0009). All booking
-- creation flows through this function. SECURITY DEFINER bypasses
-- RLS so we can validate before insert without the caller having
-- write privilege.
--
-- Typed errors: every business-rule rejection raises with errcode
-- 'P0001' and a stable HINT — the client switches on HINT, never
-- on MESSAGE. The exclusion constraint is the final race guard;
-- its 23P01 violation is caught and re-raised as RESOURCE_UNAVAILABLE
-- so the client sees a single, consistent error surface for the
-- "slot taken" case whether the conflict was synchronous or racy.

create or replace function public.book_resource(
  p_resource_id          uuid,
  p_activity_id          uuid,
  p_starts_at            timestamptz,
  p_ends_at              timestamptz,
  p_on_behalf_of_user_id uuid default null,
  p_notes                text default null
) returns public.bookings
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_actor           uuid := auth.uid();
  v_target_user     uuid;
  v_target_profile  public.profiles;
  v_resource        public.resources;
  v_activity        public.activities;
  v_location        public.locations;
  v_duration_min    integer;
  v_starts_local    timestamp;
  v_ends_local      timestamp;
  v_weekday         integer;
  v_booking         public.bookings;
begin
  if v_actor is null then
    raise exception 'Authentication required'
      using errcode = 'P0001', hint = 'NOT_AUTHENTICATED';
  end if;

  v_target_user := coalesce(p_on_behalf_of_user_id, v_actor);
  if v_target_user <> v_actor
     and not (public.current_user_is_guardian_of(v_target_user) or public.current_user_is_staff()) then
    raise exception 'Not authorized to book on behalf of this user'
      using errcode = 'P0001', hint = 'NOT_AUTHORIZED';
  end if;

  select * into v_resource from public.resources
    where id = p_resource_id and archived_at is null;
  if not found then
    raise exception 'Resource not found or archived'
      using errcode = 'P0001', hint = 'RESOURCE_NOT_FOUND';
  end if;

  select * into v_activity from public.activities
    where id = p_activity_id and archived_at is null;
  if not found then
    raise exception 'Activity not found or archived'
      using errcode = 'P0001', hint = 'ACTIVITY_NOT_FOUND';
  end if;

  select * into v_location from public.locations
    where id = v_resource.location_id;

  if p_starts_at >= p_ends_at then
    raise exception 'starts_at must precede ends_at'
      using errcode = 'P0001', hint = 'INVALID_TIME_RANGE';
  end if;

  if p_starts_at < now() and not public.current_user_is_staff() then
    raise exception 'Cannot book in the past'
      using errcode = 'P0001', hint = 'PAST_BOOKING';
  end if;

  if not exists (
    select 1 from public.activity_resource_compatibility
     where activity_id = p_activity_id and resource_id = p_resource_id
  ) then
    raise exception 'Activity not allowed on this resource'
      using errcode = 'P0001', hint = 'ACTIVITY_NOT_ALLOWED_ON_RESOURCE';
  end if;

  v_duration_min := (extract(epoch from p_ends_at - p_starts_at))::integer / 60;
  if v_duration_min < v_activity.min_duration_minutes
     or v_duration_min > v_activity.max_duration_minutes then
    raise exception 'Duration % minutes outside activity bounds (%–%)',
      v_duration_min, v_activity.min_duration_minutes, v_activity.max_duration_minutes
      using errcode = 'P0001', hint = 'DURATION_OUT_OF_BOUNDS';
  end if;

  select * into v_target_profile from public.profiles where user_id = v_target_user;
  if v_target_profile.birth_year is not null then
    if v_activity.min_age is not null
       and (extract(year from now())::int - v_target_profile.birth_year) < v_activity.min_age then
      raise exception 'Below minimum age for activity'
        using errcode = 'P0001', hint = 'AGE_RESTRICTION';
    end if;
    if v_activity.max_age is not null
       and (extract(year from now())::int - v_target_profile.birth_year) > v_activity.max_age then
      raise exception 'Above maximum age for activity'
        using errcode = 'P0001', hint = 'AGE_RESTRICTION';
    end if;
  end if;

  -- Youth self-book gate: a minor below the activity's self_book_min_age
  -- cannot book for themselves; a guardian must book on behalf of them.
  if v_target_user = v_actor
     and public.profile_is_minor(v_target_profile.birth_year)
     and (extract(year from now())::int - v_target_profile.birth_year) < v_activity.self_book_min_age then
    raise exception 'A guardian must book this activity for this user'
      using errcode = 'P0001', hint = 'GUARDIAN_REQUIRED';
  end if;

  -- Opening hours: convert the UTC range to the location's wall clock.
  v_starts_local := (p_starts_at at time zone v_location.timezone);
  v_ends_local   := (p_ends_at   at time zone v_location.timezone);

  if v_starts_local::date <> v_ends_local::date then
    raise exception 'Bookings must lie within a single day in the location timezone'
      using errcode = 'P0001', hint = 'CROSS_DAY';
  end if;

  v_weekday := extract(dow from v_starts_local)::int;

  if not exists (
    select 1 from public.opening_hours oh
    where oh.location_id = v_resource.location_id
      and oh.weekday    = v_weekday
      and oh.opens_at  <= v_starts_local::time
      and oh.closes_at >= v_ends_local::time
  ) then
    raise exception 'Booking outside opening hours'
      using errcode = 'P0001', hint = 'OUTSIDE_OPENING_HOURS';
  end if;

  if exists (
    select 1 from public.blocked_times bt
    where bt.location_id = v_resource.location_id
      and (bt.resource_id is null or bt.resource_id = p_resource_id)
      and tstzrange(bt.starts_at, bt.ends_at, '[)')
       && tstzrange(p_starts_at,  p_ends_at,   '[)')
  ) then
    raise exception 'Booking overlaps a blocked time'
      using errcode = 'P0001', hint = 'BLOCKED_TIME';
  end if;

  begin
    insert into public.bookings (
      resource_id, activity_id, booked_by_user_id, on_behalf_of_user_id,
      starts_at, ends_at, status, notes
    ) values (
      p_resource_id, p_activity_id, v_actor,
      case when v_target_user <> v_actor then v_target_user end,
      p_starts_at, p_ends_at, 'confirmed', p_notes
    )
    returning * into v_booking;
  exception when exclusion_violation then
    raise exception 'Resource already booked for this slot'
      using errcode = 'P0001', hint = 'RESOURCE_UNAVAILABLE';
  end;

  return v_booking;
end;
$$;

grant execute on function public.book_resource(
  uuid, uuid, timestamptz, timestamptz, uuid, text
) to authenticated;

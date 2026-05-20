-- Cancellation and admin-override RPCs.
--
-- cancel_booking:
--   - members cancel their own (or their minor's, via guardian link).
--   - staff cancel any booking.
--   - non-staff are subject to the activity's cancellation_cutoff
--     (no last-minute cancellations).
--
-- override_book_resource:
--   - admin/staff create a booking that bypasses past-time, duration,
--     age, guardian-required, opening-hours, and blocked-times checks.
--   - the exclusion constraint, compatibility, and cross-day checks
--     are NEVER bypassed.
--   - an override_reason is required and is written to the row + the
--     audit log via the standard trigger.

create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_reason     text default null
) returns public.bookings
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_actor    uuid := auth.uid();
  v_booking  public.bookings;
  v_activity public.activities;
  v_minutes  integer;
begin
  if v_actor is null then
    raise exception 'Authentication required'
      using errcode = 'P0001', hint = 'NOT_AUTHENTICATED';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'Booking not found'
      using errcode = 'P0001', hint = 'BOOKING_NOT_FOUND';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'Booking is already cancelled'
      using errcode = 'P0001', hint = 'ALREADY_CANCELLED';
  end if;

  if v_booking.status in ('completed', 'no_show') then
    raise exception 'Booking can no longer be cancelled'
      using errcode = 'P0001', hint = 'CANNOT_CANCEL_FINALIZED';
  end if;

  if not (
    v_booking.booked_by_user_id    = v_actor
    or v_booking.on_behalf_of_user_id = v_actor
    or (v_booking.on_behalf_of_user_id is not null
        and public.current_user_is_guardian_of(v_booking.on_behalf_of_user_id))
    or public.current_user_is_staff()
  ) then
    raise exception 'Not authorized to cancel this booking'
      using errcode = 'P0001', hint = 'NOT_AUTHORIZED';
  end if;

  if not public.current_user_is_staff() then
    select * into v_activity from public.activities where id = v_booking.activity_id;
    v_minutes := (extract(epoch from v_booking.starts_at - now()))::integer / 60;
    if v_minutes < v_activity.cancellation_cutoff_minutes then
      raise exception 'Cancellation cutoff has passed'
        using errcode = 'P0001', hint = 'CANCELLATION_CUTOFF';
    end if;
  end if;

  update public.bookings set
    status               = 'cancelled',
    cancelled_at         = now(),
    cancelled_by_user_id = v_actor,
    cancelled_reason     = p_reason
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.cancel_booking(uuid, text) to authenticated;

create or replace function public.override_book_resource(
  p_resource_id          uuid,
  p_activity_id          uuid,
  p_starts_at            timestamptz,
  p_ends_at              timestamptz,
  p_on_behalf_of_user_id uuid,
  p_override_reason      text,
  p_notes                text default null
) returns public.bookings
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_actor   uuid := auth.uid();
  v_target  uuid;
  v_booking public.bookings;
begin
  if not public.current_user_is_staff() then
    raise exception 'Override requires staff'
      using errcode = 'P0001', hint = 'NOT_AUTHORIZED';
  end if;

  if p_override_reason is null or char_length(p_override_reason) = 0 then
    raise exception 'override_reason is required'
      using errcode = 'P0001', hint = 'OVERRIDE_REASON_REQUIRED';
  end if;

  if p_starts_at >= p_ends_at then
    raise exception 'starts_at must precede ends_at'
      using errcode = 'P0001', hint = 'INVALID_TIME_RANGE';
  end if;

  v_target := coalesce(p_on_behalf_of_user_id, v_actor);

  if not exists (
    select 1 from public.activity_resource_compatibility
     where activity_id = p_activity_id and resource_id = p_resource_id
  ) then
    raise exception 'Activity not allowed on this resource'
      using errcode = 'P0001', hint = 'ACTIVITY_NOT_ALLOWED_ON_RESOURCE';
  end if;

  begin
    insert into public.bookings (
      resource_id, activity_id, booked_by_user_id, on_behalf_of_user_id,
      starts_at, ends_at, status, notes, override_reason
    ) values (
      p_resource_id, p_activity_id, v_actor,
      case when v_target <> v_actor then v_target end,
      p_starts_at, p_ends_at, 'confirmed', p_notes, p_override_reason
    )
    returning * into v_booking;
  exception when exclusion_violation then
    raise exception 'Resource already booked for this slot'
      using errcode = 'P0001', hint = 'RESOURCE_UNAVAILABLE';
  end;

  return v_booking;
end;
$$;

grant execute on function public.override_book_resource(
  uuid, uuid, timestamptz, timestamptz, uuid, text, text
) to authenticated;

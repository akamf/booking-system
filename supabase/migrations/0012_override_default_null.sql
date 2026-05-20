-- Make on_behalf_of_user_id default to null on override_book_resource
-- so the generated TS type marks it optional. The SQL body already
-- handles null via coalesce(p_on_behalf_of_user_id, v_actor) (which
-- means "no on-behalf-of: actor books for themselves").

drop function if exists public.override_book_resource(uuid, uuid, timestamptz, timestamptz, uuid, text, text);

create or replace function public.override_book_resource(
  p_resource_id          uuid,
  p_activity_id          uuid,
  p_starts_at            timestamptz,
  p_ends_at              timestamptz,
  p_override_reason      text,
  p_on_behalf_of_user_id uuid default null,
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
  uuid, uuid, timestamptz, timestamptz, text, uuid, text
) to authenticated;

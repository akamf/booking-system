-- Row Level Security policies for every app table.
--
-- Reading rules:
--   - admin / staff see everything.
--   - reads on catalog tables (orgs, locations, activities, resources,
--     compatibility, opening_hours, blocked_times, resource_types,
--     roles) are open to any authenticated user — there's nothing
--     sensitive about them and the mobile app needs them.
--   - bookings reads are restricted to participants (booker /
--     on-behalf-of / linked-guardian) plus admin/staff.
--   - profiles reads are restricted to self / linked-guardian / staff.
--
-- Writing rules:
--   - admin/staff manage catalog tables.
--   - profiles: self-update; admin/staff or linked-guardian can update
--     minors' profiles.
--   - bookings: ALL direct writes denied. RPCs in 0010/0011 handle
--     creation and cancellation under the exclusion constraint.
--   - audit_log: never writable from app code (only the trigger).

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create policy organizations_select_authenticated
  on public.organizations for select
  to authenticated
  using (true);

create policy organizations_write_admin
  on public.organizations for all
  to authenticated
  using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

-- ---------------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------------
create policy locations_select_authenticated
  on public.locations for select
  to authenticated
  using (true);

create policy locations_write_admin
  on public.locations for all
  to authenticated
  using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

-- ---------------------------------------------------------------------------
-- resource_types (admin-managed lookup)
-- ---------------------------------------------------------------------------
create policy resource_types_select_authenticated
  on public.resource_types for select
  to authenticated
  using (true);

create policy resource_types_write_admin
  on public.resource_types for all
  to authenticated
  using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

-- ---------------------------------------------------------------------------
-- resources
-- ---------------------------------------------------------------------------
create policy resources_select_authenticated
  on public.resources for select
  to authenticated
  using (true);

create policy resources_write_staff
  on public.resources for all
  to authenticated
  using (public.current_user_is_staff())
  with check (public.current_user_is_staff());

-- ---------------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------------
create policy activities_select_authenticated
  on public.activities for select
  to authenticated
  using (true);

create policy activities_write_staff
  on public.activities for all
  to authenticated
  using (public.current_user_is_staff())
  with check (public.current_user_is_staff());

-- ---------------------------------------------------------------------------
-- activity_resource_compatibility
-- ---------------------------------------------------------------------------
create policy arc_select_authenticated
  on public.activity_resource_compatibility for select
  to authenticated
  using (true);

create policy arc_write_staff
  on public.activity_resource_compatibility for all
  to authenticated
  using (public.current_user_is_staff())
  with check (public.current_user_is_staff());

-- ---------------------------------------------------------------------------
-- opening_hours
-- ---------------------------------------------------------------------------
create policy opening_hours_select_authenticated
  on public.opening_hours for select
  to authenticated
  using (true);

create policy opening_hours_write_staff
  on public.opening_hours for all
  to authenticated
  using (public.current_user_is_staff())
  with check (public.current_user_is_staff());

-- ---------------------------------------------------------------------------
-- blocked_times
-- ---------------------------------------------------------------------------
create policy blocked_times_select_authenticated
  on public.blocked_times for select
  to authenticated
  using (true);

create policy blocked_times_write_staff
  on public.blocked_times for all
  to authenticated
  using (public.current_user_is_staff())
  with check (public.current_user_is_staff());

-- ---------------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------------
create policy roles_select_authenticated
  on public.roles for select
  to authenticated
  using (true);

-- No write policies on roles → no one can write through app traffic.

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------
create policy user_roles_select_self_or_staff
  on public.user_roles for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_is_staff()
  );

create policy user_roles_write_admin
  on public.user_roles for all
  to authenticated
  using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_self_guardian_or_staff
  on public.profiles for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_is_guardian_of(user_id)
    or public.current_user_is_staff()
  );

create policy profiles_insert_self
  on public.profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy profiles_update_self_guardian_or_staff
  on public.profiles for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_is_guardian_of(user_id)
    or public.current_user_is_staff()
  )
  with check (
    user_id = auth.uid()
    or public.current_user_is_guardian_of(user_id)
    or public.current_user_is_staff()
  );

create policy profiles_delete_admin
  on public.profiles for delete
  to authenticated
  using (public.current_user_has_role('admin'));

-- ---------------------------------------------------------------------------
-- guardian_links
-- ---------------------------------------------------------------------------
create policy guardian_links_select_participants_or_staff
  on public.guardian_links for select
  to authenticated
  using (
    guardian_user_id = auth.uid()
    or minor_user_id = auth.uid()
    or public.current_user_is_staff()
  );

create policy guardian_links_write_admin
  on public.guardian_links for all
  to authenticated
  using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

-- ---------------------------------------------------------------------------
-- bookings — reads via policy, writes via RPC only.
-- ---------------------------------------------------------------------------
create policy bookings_select_participants_or_staff
  on public.bookings for select
  to authenticated
  using (
    booked_by_user_id = auth.uid()
    or on_behalf_of_user_id = auth.uid()
    or (on_behalf_of_user_id is not null and public.current_user_is_guardian_of(on_behalf_of_user_id))
    or public.current_user_is_staff()
  );

-- No INSERT / UPDATE / DELETE policies → direct writes are denied for
-- every role. book_resource() / cancel_booking() / override_booking()
-- are SECURITY DEFINER and bypass RLS.

-- ---------------------------------------------------------------------------
-- booking_participants
-- ---------------------------------------------------------------------------
create policy booking_participants_select
  on public.booking_participants for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_is_staff()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_participants.booking_id
        and (
          b.booked_by_user_id = auth.uid()
          or b.on_behalf_of_user_id = auth.uid()
          or (b.on_behalf_of_user_id is not null and public.current_user_is_guardian_of(b.on_behalf_of_user_id))
        )
    )
  );

-- No write policies → managed via RPC in the future.

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
create policy audit_log_select_staff
  on public.audit_log for select
  to authenticated
  using (public.current_user_is_staff());

-- No INSERT/UPDATE/DELETE policies — tg_audit() runs as SECURITY DEFINER
-- and bypasses RLS. App code can never reach the table.

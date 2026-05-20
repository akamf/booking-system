-- Audit logging.
--
-- ADR-0011: triggers capture every INSERT/UPDATE/DELETE on mutating
-- tables. The application has no path to bypass audit — even a
-- forgotten code path is logged. The only way to suppress audit is
-- a malicious migration, which is itself reviewable.

create type public.audit_action as enum ('insert', 'update', 'delete');

create table public.audit_log (
  id              bigserial primary key,
  table_name      text not null,
  row_id          text not null,
  action          public.audit_action not null,
  actor_user_id   uuid references public.profiles(user_id),
  before_data     jsonb,
  after_data      jsonb,
  occurred_at     timestamptz not null default now()
);

create index audit_log_table_row_idx  on public.audit_log (table_name, row_id);
create index audit_log_actor_idx      on public.audit_log (actor_user_id);
create index audit_log_occurred_idx   on public.audit_log (occurred_at desc);

-- Generic audit trigger. row_id is extracted from a `id` column if
-- present, else from a composite of the row's PK columns rendered as
-- JSON text. We keep that simple by reading `id` and falling back to
-- the full new/old row hash via row_to_json — sufficient for v1.
create or replace function public.tg_audit() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_action  public.audit_action;
  v_before  jsonb;
  v_after   jsonb;
  v_row_id  text;
begin
  if    tg_op = 'INSERT' then v_action := 'insert'; v_before := null;            v_after := to_jsonb(new);
  elsif tg_op = 'UPDATE' then v_action := 'update'; v_before := to_jsonb(old);   v_after := to_jsonb(new);
  elsif tg_op = 'DELETE' then v_action := 'delete'; v_before := to_jsonb(old);   v_after := null;
  end if;

  v_row_id := coalesce(
    (v_after ->> 'id'),
    (v_before ->> 'id'),
    md5(coalesce(v_after::text, '') || '|' || coalesce(v_before::text, ''))
  );

  insert into public.audit_log (table_name, row_id, action, actor_user_id, before_data, after_data)
  values (tg_table_name, v_row_id, v_action, auth.uid(), v_before, v_after);

  return coalesce(new, old);
end;
$$;

create trigger audit_bookings           after insert or update or delete on public.bookings           for each row execute function public.tg_audit();
create trigger audit_profiles           after insert or update or delete on public.profiles           for each row execute function public.tg_audit();
create trigger audit_guardian_links     after insert or update or delete on public.guardian_links     for each row execute function public.tg_audit();
create trigger audit_user_roles         after insert or update or delete on public.user_roles         for each row execute function public.tg_audit();
create trigger audit_blocked_times      after insert or update or delete on public.blocked_times      for each row execute function public.tg_audit();
create trigger audit_opening_hours      after insert or update or delete on public.opening_hours      for each row execute function public.tg_audit();
create trigger audit_activities         after insert or update or delete on public.activities         for each row execute function public.tg_audit();
create trigger audit_resources          after insert or update or delete on public.resources          for each row execute function public.tg_audit();

alter table public.audit_log enable row level security;

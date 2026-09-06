-- Replace all debt rows for a draft cycle in a single database transaction.
--
-- Supabase client calls are not transaction-scoped across multiple requests, so the
-- import flow must not do "delete existing debts" and "insert replacement debts" as
-- two separate client operations. This RPC makes the replacement atomic.
--
-- Security posture:
-- * SECURITY INVOKER: the function runs with the caller's permissions and RLS context.
-- * EXECUTE is revoked from PUBLIC, anon and authenticated. Until a future explicit
--   backend access model exists, this is intended for service-role server code only.
-- * search_path is pinned to satisfy Supabase's function_search_path_mutable advisor.

create or replace function public.replace_cycle_debts(
  p_organization_id uuid,
  p_cycle_id uuid,
  p_debts jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inserted_count integer;
  v_cycle_status text;
begin
  if p_organization_id is null then
    raise exception 'organization_id is required'
      using errcode = '22023';
  end if;

  if p_cycle_id is null then
    raise exception 'cycle_id is required'
      using errcode = '22023';
  end if;

  if p_debts is null or jsonb_typeof(p_debts) <> 'array' then
    raise exception 'debts payload must be a JSON array'
      using errcode = '22023';
  end if;

  -- Lock the cycle row for the duration of this transaction. This serializes two
  -- concurrent replacements for the same cycle and prevents a competing activation
  -- from changing the cycle out of `draft` between validation and the delete/insert.
  select c.status
    into v_cycle_status
  from public.cycles c
  where c.id = p_cycle_id
    and c.organization_id = p_organization_id
  for update;

  if v_cycle_status is distinct from 'draft' then
    raise exception 'cycle must exist, belong to organization, and be draft'
      using errcode = 'P0001';
  end if;

  delete from public.debts d
  where d.organization_id = p_organization_id
    and d.cycle_id = p_cycle_id;

  insert into public.debts (
    organization_id,
    cycle_id,
    contact_id,
    commercial_status,
    level,
    title_value,
    principal_balance,
    current_balance,
    situation,
    maturity_status,
    acquisition_cycle,
    due_date,
    days_overdue
  )
  select
    p_organization_id,
    p_cycle_id,
    debt.contact_id,
    debt.commercial_status,
    debt.level,
    debt.title_value,
    debt.principal_balance,
    debt.current_balance,
    debt.situation,
    debt.maturity_status,
    debt.acquisition_cycle,
    debt.due_date,
    debt.days_overdue
  from jsonb_to_recordset(p_debts) as debt(
    contact_id uuid,
    commercial_status text,
    level text,
    title_value numeric(12, 2),
    principal_balance numeric(12, 2),
    current_balance numeric(12, 2),
    situation text,
    maturity_status text,
    acquisition_cycle text,
    due_date date,
    days_overdue integer
  );

  get diagnostics v_inserted_count = row_count;
  return v_inserted_count;
end;
$$;

comment on function public.replace_cycle_debts(uuid, uuid, jsonb) is
  'Atomically replaces all debts for one organization draft cycle. Intended for server/service-role import code only.';

revoke execute on function public.replace_cycle_debts(uuid, uuid, jsonb) from public;
revoke execute on function public.replace_cycle_debts(uuid, uuid, jsonb) from anon;
revoke execute on function public.replace_cycle_debts(uuid, uuid, jsonb) from authenticated;
grant execute on function public.replace_cycle_debts(uuid, uuid, jsonb) to service_role;

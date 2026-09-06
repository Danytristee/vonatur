-- Atomically activates a draft cycle and archives the previous active cycle
-- for the same organization.
--
-- SECURITY INVOKER keeps the caller's RLS context. Authenticated users can only
-- activate cycles in organizations where organization_members grants access.

create or replace function public.activate_cycle(
  p_organization_id uuid,
  p_cycle_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_activated_count integer;
begin
  if p_organization_id is null then
    raise exception 'organization_id is required'
      using errcode = '22023';
  end if;

  if p_cycle_id is null then
    raise exception 'cycle_id is required'
      using errcode = '22023';
  end if;

  update public.cycles
     set status = 'archived'
   where organization_id = p_organization_id
     and status = 'active'
     and id <> p_cycle_id;

  update public.cycles
     set status = 'active',
         activated_at = now()
   where organization_id = p_organization_id
     and id = p_cycle_id
     and status = 'draft';

  get diagnostics v_activated_count = row_count;

  if v_activated_count <> 1 then
    raise exception 'cycle must exist, belong to organization, and be draft'
      using errcode = 'P0001';
  end if;
end;
$$;

comment on function public.activate_cycle(uuid, uuid) is
  'Atomically archives the current active cycle and activates one draft cycle for the same organization.';

revoke execute on function public.activate_cycle(uuid, uuid) from public;
revoke execute on function public.activate_cycle(uuid, uuid) from anon;
grant execute on function public.activate_cycle(uuid, uuid) to authenticated;
grant execute on function public.activate_cycle(uuid, uuid) to service_role;

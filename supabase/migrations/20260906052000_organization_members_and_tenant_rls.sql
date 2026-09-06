-- Vonatur phase 2: Supabase Auth membership mapping and tenant RLS policies.
--
-- This migration keeps Supabase Auth as the identity source (`auth.users.id`)
-- and links authenticated users to tenant organizations through
-- `public.organization_members`.
--
-- Delete behavior:
-- * organization_id uses ON DELETE RESTRICT. Deleting an organization is not a
--   normal product flow, and tenant history must never disappear by convenience.
-- * user_id uses ON DELETE CASCADE because membership rows are only an access
--   link to an Auth user. Deleting an auth user removes access links, but does
--   not cascade into organizations, cycles, contacts, snapshots, or debts.

create table public.organization_members (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null,
  user_id         uuid        not null,
  role            text        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint organization_members_organization_id_fkey
    foreign key (organization_id) references public.organizations (id)
    on update restrict on delete restrict,

  constraint organization_members_user_id_fkey
    foreign key (user_id) references auth.users (id)
    on update restrict on delete cascade,

  constraint organization_members_role_allowed
    check (role in ('owner', 'admin', 'member')),

  constraint organization_members_organization_id_user_id_key
    unique (organization_id, user_id)
);

comment on table public.organization_members is
  'Links Supabase Auth users to Vonatur tenant organizations.';
comment on column public.organization_members.role is
  'One of owner | admin | member. All roles share tenant access in this phase.';

-- The unique constraint covers lookups by organization_id and by the full
-- organization/user pair. This extra index supports the inverse access path:
-- listing all organizations for the currently authenticated user.
create index organization_members_user_id_idx
  on public.organization_members (user_id);

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

create or replace function public.prevent_tenant_key_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.organization_id is distinct from new.organization_id then
    raise exception 'organization_id cannot be changed after insert'
      using errcode = '23514';
  end if;

  if tg_table_name = 'organization_members'
    and old.user_id is distinct from new.user_id then
    raise exception 'organization_members.user_id cannot be changed after insert'
      using errcode = '23514';
  end if;

  if tg_table_name in ('contact_cycle_data', 'debts') then
    if old.cycle_id is distinct from new.cycle_id then
      raise exception 'cycle_id cannot be changed after insert'
        using errcode = '23514';
    end if;

    if old.contact_id is distinct from new.contact_id then
      raise exception 'contact_id cannot be changed after insert'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.prevent_tenant_key_update() is
  'BEFORE UPDATE trigger function. Prevents browser-accessible rows from being reassigned across tenant identity boundaries.';

create trigger organization_members_prevent_tenant_key_update
  before update on public.organization_members
  for each row execute function public.prevent_tenant_key_update();

create trigger cycles_prevent_tenant_key_update
  before update on public.cycles
  for each row execute function public.prevent_tenant_key_update();

create trigger contacts_prevent_tenant_key_update
  before update on public.contacts
  for each row execute function public.prevent_tenant_key_update();

create trigger contact_cycle_data_prevent_tenant_key_update
  before update on public.contact_cycle_data
  for each row execute function public.prevent_tenant_key_update();

create trigger debts_prevent_tenant_key_update
  before update on public.debts
  for each row execute function public.prevent_tenant_key_update();

alter table public.organization_members enable row level security;

-- SECURITY DEFINER is intentionally limited to a boolean membership check.
-- It avoids recursive or policy-dependent membership lookups from tenant-table
-- RLS policies, accepts no dynamic SQL, pins search_path, and exposes no row data.
create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = (select auth.uid())
  );
$$;

comment on function public.is_organization_member(uuid) is
  'RLS helper. Returns true when the current Supabase Auth user belongs to the organization.';

revoke execute on function public.is_organization_member(uuid) from public;
revoke execute on function public.is_organization_member(uuid) from anon;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_member(uuid) to service_role;

revoke execute on function public.prevent_tenant_key_update() from public;
revoke execute on function public.prevent_tenant_key_update() from anon;
revoke execute on function public.prevent_tenant_key_update() from authenticated;

-- Ordinary table privileges must be opened to authenticated users before RLS can
-- permit rows. `anon` remains closed. Service role is explicit for server-only
-- administrative/onboarding flows that bypass RLS by design.
revoke all on table public.organization_members from public, anon, authenticated;

grant select on table public.organizations to authenticated;

grant select, insert, update, delete on table public.cycles to authenticated;
grant select, insert, update, delete on table public.contacts to authenticated;
grant select, insert, update, delete on table public.contact_cycle_data to authenticated;
grant select, insert, update, delete on table public.debts to authenticated;

grant select on table public.organization_members to authenticated;
grant select, insert, update, delete on table public.organization_members to service_role;

-- Users may inspect their own membership rows. Membership creation and role
-- management stay closed to browser clients until a secure onboarding/admin flow
-- is designed.
create policy "organization_members_select_own"
  on public.organization_members
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Organizations are visible only to members. No browser insert/update/delete
-- policy is created in this phase.
create policy "organizations_select_for_members"
  on public.organizations
  for select
  to authenticated
  using (public.is_organization_member(id));

-- Tenant-owned operational tables: any authenticated member of the row's
-- organization can read and mutate rows within that same organization. WITH
-- CHECK prevents forged browser requests from inserting or moving rows into
-- another tenant.
create policy "cycles_select_for_members"
  on public.cycles
  for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "cycles_insert_for_members"
  on public.cycles
  for insert
  to authenticated
  with check (public.is_organization_member(organization_id));

create policy "cycles_update_for_members"
  on public.cycles
  for update
  to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

create policy "cycles_delete_for_members"
  on public.cycles
  for delete
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "contacts_select_for_members"
  on public.contacts
  for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "contacts_insert_for_members"
  on public.contacts
  for insert
  to authenticated
  with check (public.is_organization_member(organization_id));

create policy "contacts_update_for_members"
  on public.contacts
  for update
  to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

create policy "contacts_delete_for_members"
  on public.contacts
  for delete
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "contact_cycle_data_select_for_members"
  on public.contact_cycle_data
  for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "contact_cycle_data_insert_for_members"
  on public.contact_cycle_data
  for insert
  to authenticated
  with check (public.is_organization_member(organization_id));

create policy "contact_cycle_data_update_for_members"
  on public.contact_cycle_data
  for update
  to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

create policy "contact_cycle_data_delete_for_members"
  on public.contact_cycle_data
  for delete
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "debts_select_for_members"
  on public.debts
  for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "debts_insert_for_members"
  on public.debts
  for insert
  to authenticated
  with check (public.is_organization_member(organization_id));

create policy "debts_update_for_members"
  on public.debts
  for update
  to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

create policy "debts_delete_for_members"
  on public.debts
  for delete
  to authenticated
  using (public.is_organization_member(organization_id));

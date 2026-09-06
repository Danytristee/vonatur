-- Vonatur — audit log + atomic "confirm cycle import" workflow.
--
-- Adds `audit_logs` (append-only record of changed contact fields, scoped to the
-- cycle active when the change happened) and `public.confirm_cycle_import`, the
-- single RPC that persists a validated Channel Extract + Debt Report import and
-- activates the new cycle atomically.
--
-- Why one RPC: Supabase client calls are not transaction-scoped across multiple
-- requests (see replace_cycle_debts's own comment). Upserting contacts, writing the
-- per-cycle snapshot, replacing debts and activating the new cycle must therefore
-- happen inside one function so a mid-import failure leaves the previous active
-- cycle fully intact — never a half-migrated state.


-- ---------------------------------------------------------------------------
-- audit_logs — append-only record of contact field changes.
--
-- `cycle_id` is the cycle that was active when the change happened, so
-- "Finalizar ciclo" can select every row for the organization's current active
-- cycle. `source` distinguishes a re-import from a manual edit in the UI.
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null,
  cycle_id        uuid        not null,
  contact_id      uuid        not null,
  field_name      text        not null,
  old_value       text,
  new_value       text,
  source          text        not null default 'import',
  created_at      timestamptz not null default now(),

  constraint audit_logs_organization_id_fkey
    foreign key (organization_id) references public.organizations (id)
    on update restrict on delete restrict,

  constraint audit_logs_cycle_fkey
    foreign key (cycle_id, organization_id)
    references public.cycles (id, organization_id)
    on update restrict on delete restrict,

  constraint audit_logs_contact_fkey
    foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id)
    on update restrict on delete restrict,

  constraint audit_logs_source_allowed check (source in ('import', 'manual'))
);

comment on table public.audit_logs is
  'Append-only log of changed contact fields. Scoped to the cycle active when the change happened. Powers the "Finalizar ciclo" changes report.';
comment on column public.audit_logs.field_name is
  'One of full_name | phone | current_status | current_level | district — the contacts column that changed.';
comment on column public.audit_logs.source is
  'import: detected during a Channel Extract re-import. manual: edited by a user on the Consultoras page.';

-- Primary access path: "every change for this organization's cycle N", used by
-- the Finalizar ciclo export.
create index audit_logs_organization_id_cycle_id_idx
  on public.audit_logs (organization_id, cycle_id);

alter table public.audit_logs enable row level security;

create trigger audit_logs_prevent_tenant_key_update
  before update on public.audit_logs
  for each row execute function public.prevent_tenant_key_update();

revoke all on table public.audit_logs from public, anon, authenticated;

-- Append-only from the app's perspective: authenticated members may create and
-- read entries, never edit or delete them. Only service_role can, for corrective
-- administrative work outside the product.
grant select, insert on table public.audit_logs to authenticated;
grant select, insert, update, delete on table public.audit_logs to service_role;

create policy "audit_logs_select_for_members"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "audit_logs_insert_for_members"
  on public.audit_logs
  for insert
  to authenticated
  with check (public.is_organization_member(organization_id));


-- ---------------------------------------------------------------------------
-- confirm_cycle_import — the only way an authenticated client persists an
-- import. Everything below happens in one transaction:
--
--   1. Lock the draft cycle (mirrors replace_cycle_debts's own locking).
--   2. Upsert contacts from the Channel Extract rows, diffing changed fields
--      against the existing row into audit_logs BEFORE overwriting them.
--   3. Insert this cycle's contact_cycle_data snapshot.
--   4. Resolve each debt row's contact_id by external_code and delegate to the
--      existing replace_cycle_debts for this cycle.
--   5. Delegate to the existing activate_cycle: archive the previous active
--      cycle and activate this one.
--
-- A debt row whose external_code matches no contact (existing or newly
-- imported) is silently excluded from the insert in step 4 rather than
-- failing the whole import — the caller is expected to have already flagged
-- such rows for review during the preview step and excluded them from
-- p_debts. This is a defense-in-depth backstop, not the primary safeguard.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_cycle_import(
  p_organization_id uuid,
  p_cycle_id uuid,
  p_contacts jsonb,
  p_debts jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cycle_status text;
  v_contacts_created integer := 0;
  v_contacts_updated integer := 0;
  v_audit_count integer := 0;
  v_debts_count integer := 0;
  v_resolved_debts jsonb;
begin
  if p_organization_id is null then
    raise exception 'organization_id is required'
      using errcode = '22023';
  end if;

  if p_cycle_id is null then
    raise exception 'cycle_id is required'
      using errcode = '22023';
  end if;

  if p_contacts is null or jsonb_typeof(p_contacts) <> 'array' then
    raise exception 'contacts payload must be a JSON array'
      using errcode = '22023';
  end if;

  if p_debts is null or jsonb_typeof(p_debts) <> 'array' then
    raise exception 'debts payload must be a JSON array'
      using errcode = '22023';
  end if;

  -- Lock the cycle row for the duration of this transaction, same discipline as
  -- replace_cycle_debts: serializes concurrent confirmations and prevents a
  -- competing activation from changing the cycle out of draft mid-import.
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

  -- Stage incoming contact rows next to whatever already exists for the same
  -- external_code, so both the audit diff and the insert/update below read
  -- from one consistent snapshot.
  create temporary table tmp_import_contacts on commit drop as
  select
    contact_row.external_code,
    contact_row.full_name,
    contact_row.phone,
    contact_row.status,
    contact_row.level,
    contact_row.accumulated_points,
    contact_row.district,
    existing.id as existing_contact_id,
    existing.full_name as old_full_name,
    existing.phone as old_phone,
    existing.current_status as old_status,
    existing.current_level as old_level,
    existing.district as old_district
  from jsonb_to_recordset(p_contacts) as contact_row(
    external_code text,
    full_name text,
    phone text,
    status text,
    level text,
    accumulated_points numeric(12, 2),
    district text
  )
  left join public.contacts existing
    on existing.organization_id = p_organization_id
   and existing.external_code = contact_row.external_code;

  insert into public.contacts (
    organization_id, external_code, full_name, phone, current_status, current_level, district
  )
  select p_organization_id, t.external_code, t.full_name, t.phone, t.status, t.level, t.district
  from tmp_import_contacts t
  where t.existing_contact_id is null;

  get diagnostics v_contacts_created = row_count;

  -- Audit the diff BEFORE applying the update below, one row per changed field.
  insert into public.audit_logs (
    organization_id, cycle_id, contact_id, field_name, old_value, new_value, source
  )
  select p_organization_id, p_cycle_id, t.existing_contact_id, v.field_name, v.old_value, v.new_value, 'import'
  from tmp_import_contacts t
  cross join lateral (
    values
      ('full_name', t.old_full_name, t.full_name),
      ('phone', t.old_phone, t.phone),
      ('current_status', t.old_status, t.status),
      ('current_level', t.old_level, t.level),
      ('district', t.old_district, t.district)
  ) as v(field_name, old_value, new_value)
  where t.existing_contact_id is not null
    and v.old_value is distinct from v.new_value;

  get diagnostics v_audit_count = row_count;

  update public.contacts c
  set full_name     = t.full_name,
      phone         = t.phone,
      current_status = t.status,
      current_level  = t.level,
      district      = t.district
  from tmp_import_contacts t
  where t.existing_contact_id is not null
    and c.id = t.existing_contact_id;

  get diagnostics v_contacts_updated = row_count;

  -- Per-cycle snapshot for every imported contact, existing or just created.
  insert into public.contact_cycle_data (
    organization_id, cycle_id, contact_id, status, level, accumulated_points, phone, district
  )
  select
    p_organization_id,
    p_cycle_id,
    coalesce(t.existing_contact_id, c.id),
    t.status, t.level, t.accumulated_points, t.phone, t.district
  from tmp_import_contacts t
  left join public.contacts c
    on t.existing_contact_id is null
   and c.organization_id = p_organization_id
   and c.external_code = t.external_code;

  -- Resolve each debt row's contact_id by external_code, then delegate to the
  -- existing atomic debt replacement for this cycle.
  select coalesce(jsonb_agg(to_jsonb(resolved) - 'external_code'), '[]'::jsonb)
    into v_resolved_debts
  from (
    select
      c.id as contact_id,
      debt_row.external_code,
      debt_row.commercial_status,
      debt_row.level,
      debt_row.title_value,
      debt_row.principal_balance,
      debt_row.current_balance,
      debt_row.situation,
      debt_row.maturity_status,
      debt_row.acquisition_cycle,
      debt_row.due_date,
      debt_row.days_overdue
    from jsonb_to_recordset(p_debts) as debt_row(
      external_code text,
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
    )
    join public.contacts c
      on c.organization_id = p_organization_id
     and c.external_code = debt_row.external_code
  ) resolved;

  select jsonb_array_length(v_resolved_debts) into v_debts_count;

  perform public.replace_cycle_debts(p_organization_id, p_cycle_id, v_resolved_debts);
  perform public.activate_cycle(p_organization_id, p_cycle_id);

  return jsonb_build_object(
    'contactsCreated', v_contacts_created,
    'contactsUpdated', v_contacts_updated,
    'auditLogEntries', v_audit_count,
    'debtsInserted', v_debts_count
  );
end;
$$;

comment on function public.confirm_cycle_import(uuid, uuid, jsonb, jsonb) is
  'Atomically persists a validated cycle import: upserts contacts (auditing changed fields), writes the per-cycle snapshot, replaces this cycle''s debts, and activates it while archiving the previous active cycle.';

revoke execute on function public.confirm_cycle_import(uuid, uuid, jsonb, jsonb) from public;
revoke execute on function public.confirm_cycle_import(uuid, uuid, jsonb, jsonb) from anon;
grant execute on function public.confirm_cycle_import(uuid, uuid, jsonb, jsonb) to authenticated;
grant execute on function public.confirm_cycle_import(uuid, uuid, jsonb, jsonb) to service_role;

-- confirm_cycle_import calls these as the same invoking role (SECURITY INVOKER
-- does not escalate privilege for nested calls), so authenticated needs EXECUTE
-- on both. RLS on cycles/contacts/contact_cycle_data/debts remains the real
-- guard — this only restores the ability to call the already-safe primitives.
grant execute on function public.replace_cycle_debts(uuid, uuid, jsonb) to authenticated;
grant execute on function public.activate_cycle(uuid, uuid) to authenticated;

comment on function public.activate_cycle(uuid, uuid) is
  'Atomically archives the current active cycle and activates one draft cycle for the same organization. Called directly by tests/admin tooling, and internally by confirm_cycle_import.';

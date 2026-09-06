-- Vonatur — initial domain schema
--
-- Creates the five initial business tables of the multi-tenant domain:
--   organizations, cycles, contacts, contact_cycle_data, debts
--
-- Design notes
-- ------------
-- * Tenant key is `organization_id`. Every tenant-owned table carries it explicitly.
-- * Cross-tenant rows are impossible by construction: child tables reference their
--   parents through COMPOSITE foreign keys `(parent_id, organization_id)`, so a debt
--   in organization A can never point at a contact or cycle of organization B.
-- * No CASCADE deletes anywhere. Business history must never disappear silently.
-- * `ON UPDATE restrict` additionally makes it impossible to move an existing row
--   to a different organization while children still reference it.
-- * Monetary values use numeric(12,2). float/real/double precision are never used.
-- * Row Level Security is ENABLED on all five tables and NO policies are created yet.
--   Until `organization_members` exists, `anon` and `authenticated` therefore see zero
--   rows (deny by default). Backend access uses the service role, which is server-only
--   and must never reach the browser.
--
-- Naming: English, snake_case. The end-user interface is Spanish; the schema is not.


-- ---------------------------------------------------------------------------
-- Shared trigger function: keeps `updated_at` honest on every UPDATE.
-- Defined once and reused by all five tables.
-- `search_path = ''` avoids the mutable-search_path class of function hijacking
-- (flagged by Supabase's security advisor). The body touches no schema objects.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger function. Sets updated_at to now(). Shared by all domain tables.';


-- ---------------------------------------------------------------------------
-- organizations — one row per tenant.
-- Billing/subscription columns are deliberately out of scope for this phase.
-- ---------------------------------------------------------------------------
create table public.organizations (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- btrim/1 strips only ASCII space; the explicit set also covers tabs, newlines and
  -- the non-breaking space that spreadsheet exports routinely carry.
  constraint organizations_name_not_blank
    check (btrim(name, E' \t\r\n\u00A0') <> '')
);

comment on table public.organizations is
  'Tenants. One organization per consultant/business using Vonatur.';

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- cycles — commercial cycles (~19 per year, per organization).
--
-- `status` is text + CHECK rather than a PostgreSQL enum: enum values cannot be
-- renamed or removed without rebuilding the type and rewriting dependent columns,
-- while a CHECK constraint is replaced by a single statement in a future migration.
-- It also maps 1:1 onto the TypeScript literal union and a Zod enum.
-- ---------------------------------------------------------------------------
create table public.cycles (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null,
  year            integer     not null,
  cycle_number    integer     not null,
  status          text        not null default 'draft',
  activated_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint cycles_organization_id_fkey
    foreign key (organization_id) references public.organizations (id)
    on update restrict on delete restrict,

  constraint cycles_cycle_number_range check (cycle_number between 1 and 19),
  constraint cycles_status_allowed     check (status in ('draft', 'active', 'archived')),

  -- Wide sanity bound. Unlike the Excel-sourced columns further down, `year` is
  -- entered through the application, so a typo such as 20255 would otherwise create
  -- a permanent bogus cycle that pollutes every future year-over-year comparison.
  constraint cycles_year_range check (year between 2000 and 2200),

  -- One-directional on purpose: an active cycle must know when it was activated, but
  -- a draft may be archived without ever having been activated, so `archived` with a
  -- null activated_at stays legal.
  constraint cycles_activated_at_required_when_active
    check (status <> 'active' or activated_at is not null),

  -- Same (year, cycle_number) can never exist twice inside one organization.
  constraint cycles_organization_id_year_cycle_number_key
    unique (organization_id, year, cycle_number),

  -- Target for the composite foreign keys of contact_cycle_data and debts.
  -- Redundant with the primary key on its own, but required so children can
  -- reference (cycle_id, organization_id) as a unit.
  constraint cycles_id_organization_id_key unique (id, organization_id)
);

comment on table public.cycles is
  'Commercial cycles. Exactly one cycle may be active per organization at a time.';
comment on column public.cycles.status is
  'One of draft | active | archived. Enforced by cycles_status_allowed.';
comment on column public.cycles.activated_at is
  'Set when the cycle transitions draft -> active. Required while status = active (see cycles_activated_at_required_when_active); stays null for a draft, or for a draft archived without ever being activated.';

-- Only one active cycle per organization. Draft and archived cycles are unrestricted.
-- A UNIQUE constraint cannot carry a WHERE clause, so a partial unique INDEX is the
-- only way to express this — which also means it can never be made DEFERRABLE.
--
-- Operational note: btree uniqueness is checked as each index tuple is inserted, not
-- at end of statement and not at COMMIT. A cycle handover must therefore archive the
-- outgoing cycle BEFORE activating the incoming one, as two statements inside one
-- transaction:
--
--   update public.cycles set status = 'archived'
--    where organization_id = $1 and status = 'active' and id <> $2;
--
--   update public.cycles set status = 'active', activated_at = now()
--    where organization_id = $1 and id = $2 and status = 'draft';
--
-- Do NOT try to do it in a single UPDATE with a CASE: PostgreSQL gives no guarantee
-- about the order in which an UPDATE applies row modifications, so whether the
-- outgoing row is archived before the incoming row is indexed is arbitrary, and the
-- statement would fail non-deterministically.
--
-- Two concurrent activations for the same organization are correctly serialized by
-- this index: the second blocks and then fails with a unique violation. That is the
-- intended guarantee, but the caller must surface it as a normal Spanish-language
-- error rather than an unhandled 500.
create unique index cycles_one_active_per_organization_idx
  on public.cycles (organization_id)
  where status = 'active';

create trigger cycles_set_updated_at
  before update on public.cycles
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- contacts — the consultants/people imported from the Channel Extract report.
--
-- `external_code` and `phone` are text, never integer: external codes may carry
-- leading zeros and phone numbers are not numbers.
-- `current_level` is text because the real set of level values coming out of the
-- Excel files has not been observed yet; it is not assumed to be an integer.
-- Only the structural columns are NOT NULL — everything sourced from a spreadsheet
-- stays nullable so a single missing cell cannot abort an import.
-- ---------------------------------------------------------------------------
create table public.contacts (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null,
  external_code   text        not null,
  full_name       text,
  phone           text,
  current_status  text,
  current_level   text,
  district        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint contacts_organization_id_fkey
    foreign key (organization_id) references public.organizations (id)
    on update restrict on delete restrict,

  -- The database stores only the canonical external code shape: no leading/trailing
  -- whitespace, including tabs/newlines and the non-breaking space that spreadsheet
  -- exports routinely carry. Without this, ' 123' and '123' could coexist as two
  -- different contacts inside one organization.
  --
  -- This intentionally preserves leading zeros. Whether '00123' and '123' are the
  -- same real consultant must be decided from real report data, not guessed here.
  constraint contacts_external_code_not_blank
    check (
      external_code = btrim(external_code, E' \t\r\n\u00A0')
      and external_code <> ''
    ),

  constraint contacts_organization_id_external_code_key
    unique (organization_id, external_code),

  -- Target for the composite foreign keys of contact_cycle_data and debts.
  constraint contacts_id_organization_id_key unique (id, organization_id)
);

comment on table public.contacts is
  'Consultants/contacts, scoped per organization. Correlated across reports by external_code.';
comment on column public.contacts.external_code is
  'External consultant code (Excel: CODIGO / CODIGO DE CONSULTORA). Text: may contain leading zeros.';
comment on column public.contacts.phone is
  'Stored as text. Never numeric.';
comment on column public.contacts.current_level is
  'Latest known commercial level. Text until the real value domain is observed.';

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- contact_cycle_data — per-cycle snapshot of a contact (Channel Extract report).
-- One row per (organization, cycle, contact). This is the historical record and
-- is never deleted when a cycle is archived.
-- ---------------------------------------------------------------------------
create table public.contact_cycle_data (
  id                 uuid        primary key default gen_random_uuid(),
  organization_id    uuid        not null,
  cycle_id           uuid        not null,
  contact_id         uuid        not null,
  status             text,
  level              text,
  accumulated_points numeric(12, 2),
  phone              text,
  district           text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Composite FKs: the cycle AND the contact must belong to the same organization
  -- as this row. PostgreSQL rejects cross-tenant combinations without any help
  -- from application code. These transitively guarantee organization_id exists in
  -- organizations, so a separate FK to organizations would be redundant.
  constraint contact_cycle_data_cycle_fkey
    foreign key (cycle_id, organization_id)
    references public.cycles (id, organization_id)
    on update restrict on delete restrict,

  constraint contact_cycle_data_contact_fkey
    foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id)
    on update restrict on delete restrict,

  constraint contact_cycle_data_organization_id_cycle_id_contact_id_key
    unique (organization_id, cycle_id, contact_id)
);

comment on table public.contact_cycle_data is
  'Historical per-cycle snapshot of a contact. Retained after a cycle is archived.';
comment on column public.contact_cycle_data.accumulated_points is
  'numeric, not float. Decimals are not ruled out even though observed values look integral.';

-- The unique constraint above already indexes (organization_id),
-- (organization_id, cycle_id) and the full triple. This covers the remaining
-- access path: the full history of one contact across cycles.
create index contact_cycle_data_organization_id_contact_id_idx
  on public.contact_cycle_data (organization_id, contact_id);

create trigger contact_cycle_data_set_updated_at
  before update on public.contact_cycle_data
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- debts — rows from the Debt Report.
--
-- Deliberately NO unique constraint on (cycle_id, contact_id): one contact may
-- legitimately hold several debt records within the same cycle.
--
-- No value constraints on balances, amounts or days_overdue. These arrive from an
-- external system and negative or unexpected values (adjustments, credits) have
-- not been ruled out; rejecting them at the database level would break imports
-- over an unverified assumption.
--
-- Magnitude is nonetheless bounded by the type: numeric(12,2) accepts up to
-- 9_999_999_999.99 and raises `numeric field overflow` above it, and it rounds a
-- third decimal instead of erroring. That is deliberate — the ceiling is far above
-- any plausible balance, and per CLAUDE.md every Excel value is validated with Zod
-- before it reaches this table, so a mis-parsed cell is rejected upstream with a
-- readable error rather than aborting the whole insert here.
-- ---------------------------------------------------------------------------
create table public.debts (
  id                uuid           primary key default gen_random_uuid(),
  organization_id   uuid           not null,
  cycle_id          uuid           not null,
  contact_id        uuid           not null,
  commercial_status text,
  level             text,
  title_value       numeric(12, 2),
  principal_balance numeric(12, 2),
  current_balance   numeric(12, 2),
  situation         text,
  maturity_status   text,
  acquisition_cycle text,
  due_date          date,
  days_overdue      integer,
  created_at        timestamptz    not null default now(),
  updated_at        timestamptz    not null default now(),

  constraint debts_cycle_fkey
    foreign key (cycle_id, organization_id)
    references public.cycles (id, organization_id)
    on update restrict on delete restrict,

  constraint debts_contact_fkey
    foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id)
    on update restrict on delete restrict
);

comment on table public.debts is
  'Debt Report rows. A contact may have multiple debts in the same cycle — no unique (cycle_id, contact_id).';
comment on column public.debts.acquisition_cycle is
  'Excel column CICLO DE CAPTACION. Kept as text until the real value domain is observed.';
comment on column public.debts.due_date is
  'Excel column FECHA DE VENCIMIENTO. date, not timestamptz: the source carries no time component.';
comment on column public.debts.current_balance is
  'numeric(12,2). No sign constraint: adjustments/credits are not ruled out.';
comment on column public.debts.maturity_status is
  'Excel column VENCIMIENTO (a status label), distinct from due_date.';

-- debts has no unique constraint, so it carries its own access-path indexes.
-- Two are enough, and both are load-bearing rather than speculative:
--
--   * (organization_id, cycle_id, due_date) serves listing an organization's debts,
--     listing one cycle's debts, due-date range scans for reminders, and the
--     referential-integrity check behind debts_cycle_fkey. Its (organization_id) and
--     (organization_id, cycle_id) prefixes are therefore already indexed and are
--     deliberately NOT created a second time.
--   * (organization_id, contact_id) serves one contact's debt history across cycles
--     and the referential-integrity check behind debts_contact_fkey.
--
-- Deliberately NOT created yet: (organization_id, cycle_id, days_overdue), because
-- days_overdue is derived from due_date in the source report and the index above
-- already answers the same question; and (organization_id, cycle_id, current_balance),
-- because "has an outstanding balance" matches most rows and is too low-selectivity
-- to beat a scan at this table's size. Both are one-line additions in a later
-- migration if EXPLAIN on a real query ever justifies them — until then they would
-- only add write amplification to the bulk import that runs ~19x a year.
create index debts_organization_id_cycle_id_due_date_idx
  on public.debts (organization_id, cycle_id, due_date);

create index debts_organization_id_contact_id_idx
  on public.debts (organization_id, contact_id);

create trigger debts_set_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Enabled on all five tables with NO policies attached. With RLS enabled and no
-- policy present, PostgreSQL denies every row to `anon` and `authenticated`.
-- That is the intended state: the real tenant policies cannot be written before
-- `organization_members` links auth.users to organizations, and inventing a
-- direct auth.users -> organizations relationship now would have to be undone.
--
-- `USING (true)` is intentionally NOT used, and RLS is intentionally NOT left off.
-- The service role bypasses RLS and remains server-only.
-- ---------------------------------------------------------------------------
alter table public.organizations       enable row level security;
alter table public.cycles              enable row level security;
alter table public.contacts            enable row level security;
alter table public.contact_cycle_data  enable row level security;
alter table public.debts               enable row level security;


-- ---------------------------------------------------------------------------
-- Table privileges
--
-- RLS decides row access, but PostgreSQL still checks ordinary table privileges
-- first. Keep browser-facing roles closed until real tenant policies and grants are
-- designed with organization_members. Grant service_role explicitly so server-only
-- backend paths and SECURITY INVOKER RPCs work even when Supabase's automatic table
-- exposure/grant behavior is disabled or changes between projects.
-- ---------------------------------------------------------------------------
revoke all on table public.organizations      from public, anon, authenticated;
revoke all on table public.cycles             from public, anon, authenticated;
revoke all on table public.contacts           from public, anon, authenticated;
revoke all on table public.contact_cycle_data from public, anon, authenticated;
revoke all on table public.debts              from public, anon, authenticated;

grant select, insert, update, delete on table public.organizations      to service_role;
grant select, insert, update, delete on table public.cycles             to service_role;
grant select, insert, update, delete on table public.contacts           to service_role;
grant select, insert, update, delete on table public.contact_cycle_data to service_role;
grant select, insert, update, delete on table public.debts              to service_role;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon;
revoke execute on function public.set_updated_at() from authenticated;

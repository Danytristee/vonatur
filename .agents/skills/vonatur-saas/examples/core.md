# Vonatur SaaS — Core Patterns

Full code for every pattern named in [../SKILL.md](../SKILL.md). No other file in this skill carries
runnable examples.

---

## Pattern 1: Tenant isolation via `organization_id` + RLS

Every tenant-owned table carries `organization_id uuid not null references organizations(id)`.
RLS is enabled on the table, and every policy scopes on it — there is no code path that reads
across organizations.

```sql
-- migration: enable RLS and scope every policy by organization_id
alter table contacts enable row level security;

create policy "tenant_isolation_select" on contacts
  for select
  using (organization_id = (select auth.jwt() ->> 'organization_id')::uuid);

create policy "tenant_isolation_insert" on contacts
  for insert
  with check (organization_id = (select auth.jwt() ->> 'organization_id')::uuid);
```

Server-side reads still scope explicitly — RLS is the backstop, not the only guard:

```ts
// Route Handler / Server Action — never trust a client-supplied organization_id
const { data, error } = await supabase
  .from('contacts')
  .select('*')
  .eq('organization_id', session.organizationId)
```

The Supabase Service Role key is never imported into a Client Component, never exposed via
`NEXT_PUBLIC_*`, and only ever used in server-only code paths that still apply their own
`organization_id` filter — Service Role bypasses RLS, so the query itself becomes the only guard.

`auth.users` never links directly to `organizations`. The join always goes through the future
`organization_members` table once it exists; don't invent a shortcut relationship before that
table is designed.

---

## Pattern 2: Two-Excel cycle import mapping

Each cycle ships exactly two source files, each with its own required columns and its own mapping
to English internal field names. Parsing uses SheetJS (`xlsx`) because the sources mix `.xls` and
`.xlsx`.

```ts
// Channel Extract Report (.xlsx)
const CHANNEL_EXTRACT_MAP = {
  'CÓDIGO DE CONSULTORA': 'external_code',
  'NOMBRE DE CONSULTORA': 'full_name',
  ESTADO: 'status',
  NIVEL: 'level',
  'PUNTOS ACUMULADOS': 'accumulated_points',
  TELÉFONO: 'phone',
  DISTRITO: 'district',
} as const

// Debt Report (.xls)
const DEBT_REPORT_MAP = {
  CODIGO: 'external_code',
  NOMBRE: 'full_name',
  TELEFONO: 'phone',
  'SITUACION COMERCIAL': 'commercial_status',
  NIVEL: 'level',
  'VALOR TÍTULO': 'title_value',
  'SALDO PRINCIPAL': 'principal_balance',
  'SALDO ACTUALIZADO': 'current_balance',
  SITUACION: 'situation',
  VENCIMIENTO: 'maturity_status',
  'CICLO DE CAPTACION': 'acquisition_cycle', // real source header — no accent, "CAPTACION" not "CAPTACIÓN"
  'FECHA DE VENCIMIENTO': 'due_date',
  'DIAS DE RETRASO': 'days_overdue',
} as const
```

Headers are normalized (trim, case-fold, tolerate accents) before being matched against either map,
so `Código de Consultora` and `CÓDIGO DE CONSULTORA` resolve to the same field. Approved aliases for
`CICLO DE CAPTACION` may be added to the normalizer later, but the canonical source header itself is
never "corrected" in the data.

Every row is validated with Zod before it is treated as trusted:

```ts
const channelExtractRowSchema = z.object({
  external_code: z.string().min(1),
  full_name: z.string().min(1),
  status: z.string(),
  level: z.string(),
  accumulated_points: z.coerce.number(),
  phone: z.string(),
  district: z.string(),
})
```

Columns not in either map are ignored rather than rejected — the source files may carry extra
columns the business doesn't use yet.

---

## Pattern 3: `external_code` contact matching

Correlation between the two reports — and between an import and existing `contacts` rows — always
goes through `external_code`, scoped to the organization (`organization_id + external_code` is the
uniqueness boundary, not `external_code` alone).

```ts
const channelByCode = new Map(channelRows.map((row) => [row.external_code, row]))

function correlate(debtRow: DebtReportRow): MatchResult {
  const channelRow = channelByCode.get(debtRow.external_code)
  if (!channelRow) {
    return { status: 'needs_review', reason: 'no_channel_extract_match', debtRow }
  }
  if (channelRow.phone && debtRow.phone && channelRow.phone !== debtRow.phone) {
    // Phone is a secondary signal only — a mismatch is flagged, not auto-resolved.
    return { status: 'needs_review', reason: 'phone_mismatch', channelRow, debtRow }
  }
  return { status: 'matched', channelRow, debtRow }
}
```

Names are never used to correlate rows — they vary in spelling and formatting between the two
reports and across cycles.

---

## Pattern 4: Safe cycle replacement (12-step workflow)

The previous cycle must remain fully usable until the new cycle's import has been confirmed and
activated. The order below is not reorderable:

```text
 1. Upload both new files (Channel Extract + Debt Report) to importaciones-ciclos
 2. Parse both files with SheetJS
 3. Validate required columns are present in each
 4. Validate every row against its Zod schema
 5. Match contacts by external_code, flag ambiguous rows
 6. Render an import preview (nothing persisted yet)
 7. User confirms the import
 8. Persist new normalized data (contacts, contact_cycle_data, debts) — new cycle stays "draft"
 9. Archive previous cycle: active -> archived
10. Activate new cycle: draft -> active (same transaction/step as #9)
11. Delete previous cycle's raw Excel files from importaciones-ciclos
12. Delete previous cycle's promotional media from promociones-ciclos, if superseded
```

If validation (steps 3–5) fails, nothing after step 6 has happened — the previously active cycle is
untouched and remains the one the app serves. Steps 9–10 happen together: there is never a moment
where two cycles are simultaneously `active` for the same organization, and never a moment where an
organization has zero active cycles after a successful replacement.

```sql
-- Steps 9-10 as one statement pair, same transaction
update public.cycles set status = 'archived' where organization_id = $1 and status = 'active';
update public.cycles
   set status = 'active', activated_at = now()
 where organization_id = $1 and id = $2 and status = 'draft'; -- the newly persisted cycle
```

Historical normalized PostgreSQL rows (`contact_cycle_data`, `debts` tied to the archived cycle) are
never deleted by this workflow — only the raw source files and superseded promotional media are
removed, and only after step 9–10 succeeds.

---

## Pattern 5: Debt and future partial-payment modeling

A contact can have more than one debt row within the same cycle — debts are a separate table keyed
by `contact_cycle_data` (or `contact_id` + `cycle_id`), never a single column on `contacts`.

```sql
create table debts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  contact_id uuid not null references contacts(id),
  cycle_id uuid not null references cycles(id),
  title_value numeric(12, 2) not null,
  principal_balance numeric(12, 2) not null,
  current_balance numeric(12, 2) not null,
  commercial_status text,
  situation text,
  maturity_status text,
  acquisition_cycle text,
  due_date date,
  days_overdue integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Future payments never model debt state as a boolean (`is_paid`). The conceptual flow is:

```text
remaining_balance = current_balance - sum(payments.amount for this debt)
-- when remaining_balance reaches 0, the debt may transition to a "paid" situation
```

Payment history is preserved (never overwritten) once the `payments` table exists, so a debt's full
payment trail can be reconstructed later.

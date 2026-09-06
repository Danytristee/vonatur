---
name: vonatur-saas
description: Vonatur's multi-tenant SaaS business rules, architecture invariants and safe workflows — cycles, Excel imports, contact matching, RLS, storage lifecycle. Load when touching organization-scoped data, cycle activation, Channel Extract / Debt Report parsing, external_code matching, debts, or the two Supabase Storage buckets in this repo.
---

# Vonatur SaaS Invariants

> **Quick Guide:** Vonatur is a multi-tenant SaaS for beauty consultants, organized around ~19
> yearly commercial cycles. Every cycle ships two Excel reports that must be parsed, validated and
> correlated by `external_code` before they touch PostgreSQL. Multi-tenancy (`organization_id` +
> RLS) is mandatory even though the pilot org is the only tenant today, and a cycle replacement must
> never destroy the previous cycle's usable state until the new one is fully validated.

**Detailed Resources:**

- [examples/core.md](examples/core.md) — full patterns: tenant isolation, Excel field mappings, external_code matching, the 12-step safe cycle replacement, debt/payment modeling
- [reference.md](reference.md) — quick lookup tables: database tables, Excel column mappings, storage buckets, cycle statuses, stack allow/deny list

---

## Which path applies

- **Schema, migrations, or RLS policies** — scope every tenant-owned table by `organization_id`, then follow [examples/core.md](examples/core.md) (Tenant isolation).
- **Excel import/parsing work** — two different reports, two different mappings, then follow [examples/core.md](examples/core.md) (Excel imports, external_code matching).
- **Cycle activation or replacement** — order matters and is not optional, then follow [examples/core.md](examples/core.md) (Safe cycle replacement).
- **Debts or future payments** — a contact may have several debt rows, then follow [examples/core.md](examples/core.md) (Debt modeling).

---

<critical_requirements>

## Before touching Vonatur business logic

Every tenant-owned query must be scoped by `organization_id` and enforced by PostgreSQL Row Level Security — a service-role bypass or a `USING (true)` policy defeats the one guarantee this SaaS is built on.

Never delete a previous cycle's raw Excel files, promotional media, or archive its normalized rows until the new cycle has been parsed, validated, previewed, confirmed and activated — a mid-import failure must leave the previous cycle fully usable.

Match contacts by `external_code` (Debt Report `CODIGO` ↔ Channel Extract `CÓDIGO DE CONSULTORA`), never by name; treat phone as a secondary signal only, and flag ambiguous matches for review instead of guessing.

Treat every Excel value as untrusted input — normalize headers (trim, case, accents, approved aliases) and validate with Zod before any database write.

</critical_requirements>

---

**Auto-detection:** `organization_id`, `external_code`, `CÓDIGO DE CONSULTORA`, `CODIGO`, `CICLO DE CAPTACION`, `contact_cycle_data`, `importaciones-ciclos`, `promociones-ciclos`, Channel Extract, Debt Report, cycle activation, cycle archive, RLS policy, SheetJS/xlsx import

**Applies to:**

- Designing or reviewing the `organizations` / `cycles` / `contacts` / `contact_cycle_data` / `debts` schema and its migrations
- Writing or reviewing Row Level Security policies and tenant-scoped queries
- Building or reviewing the Excel upload → parse → validate → preview → confirm → persist pipeline
- Cycle activation, archiving, and raw-file/media cleanup ordering
- Reasoning about future partial payments, level-based campaigns, or WhatsApp/queue architecture at the design level

**Handled elsewhere:**

- Generic Next.js App Router, Server/Client Component conventions
- Generic Supabase Auth/Postgres setup and generic PostgreSQL performance practice
- Generic shadcn/ui, Tailwind, CVA, React Hook Form, Zod, TanStack Table usage
- Generic CI/CD, testing framework mechanics

(covered by this project's other installed skills — this skill only carries what is specific to Vonatur's own business rules)

---

<philosophy>

Vonatur has exactly one paying tenant today, but the schema, RLS policies and query layer must already behave as if there were many — retrofitting tenant isolation after data exists is far riskier than building it in from the first migration. Treat `organization_id` as load-bearing on every business table now, not as a future migration.

The cycle/import system is the highest-risk workflow in the product because it replaces a consultant's entire working dataset roughly 19 times a year from spreadsheets she did not produce for machine consumption. The workflow is optimized for **never leaving the app in a half-migrated state**: validate everything before touching production data, and only ever delete the old state after the new one has proven it works.

</philosophy>

---

<decision_framework>

- **Adding a new business table?** Only if it's one of the current five (`organizations`, `cycles`, `contacts`, `contact_cycle_data`, `debts`) or the user explicitly asked for a future one (`organization_members`, `payments`, `media_assets`, `campaigns`, …). Otherwise it's out of scope for the current phase.
- **A contact seems to have more than one debt row in a cycle?** That's expected — never model debt as a single nullable column on `contacts`; keep it a separate one-to-many table.
- **An import fails partway through?** The active cycle must remain the previous one. Never flip `cycles.status` to `active` before persistence of the new cycle's normalized data has fully succeeded.
- **Need to target consultants by commercial level for messaging?** Filter on the stored `level` value; never branch code per level (`if level === 2 ... if level === 3`).
- **RLS is blocking a legitimate query?** Fix the policy or the query's scoping — disabling RLS or adding `USING (true)` is never the fix, documented exception or not, without explicit sign-off.
- **Excel header doesn't match exactly?** Add it as an approved alias in the normalizer; don't silently rename the canonical source header (e.g. `CICLO DE CAPTACION` stays as-is, misspelling included).

</decision_framework>

---

<patterns>

## Core patterns

### Pattern 1: Tenant isolation via `organization_id` + RLS

Every tenant-owned table carries `organization_id`, and every query — server-side or via RLS — is scoped by it. No cross-tenant read ever reaches the client.

```sql
create policy "tenant_isolation_select" on contacts
  for select using (organization_id = (select auth.jwt() ->> 'organization_id')::uuid);
```

Full code: [examples/core.md](examples/core.md)

### Pattern 2: Two-Excel cycle import mapping

Channel Extract (`.xlsx`) and Debt Report (`.xls`) each map to their own internal English field names via SheetJS, with headers normalized before matching.

```ts
const CHANNEL_EXTRACT_MAP = {
  'CÓDIGO DE CONSULTORA': 'external_code',
  'NOMBRE DE CONSULTORA': 'full_name',
} as const
```

Full code: [examples/core.md](examples/core.md)

### Pattern 3: `external_code` contact matching

Correlate the two reports by `external_code` only; phone is a secondary signal; ambiguous matches are flagged, never auto-resolved.

```ts
const match = channelByCode.get(debtRow.external_code) ?? flagForReview(debtRow)
```

Full code: [examples/core.md](examples/core.md)

### Pattern 4: Safe cycle replacement (12-step workflow)

Upload → parse → validate → match → preview → confirm → persist → archive previous active cycle → activate new cycle → delete old raw files → delete old media, in that order, with the previous cycle staying usable until step 8 succeeds.

Full code: [examples/core.md](examples/core.md)

### Pattern 5: Debt and future partial-payment modeling

A contact may have multiple debt rows per cycle; balances are `NUMERIC`; payments will subtract from a running balance rather than flipping a boolean.

```
remaining_balance = current_balance - sum(payments.amount)
```

Full code: [examples/core.md](examples/core.md)

</patterns>

---

<red_flags>

## Red flags

**Breaks tenant isolation or data integrity:**

- Disabling RLS to work around a blocked query — leaks every organization's data to every other — fix the policy or the query's scoping instead.
- A production policy written as `USING (true)` — removes tenant isolation entirely — scope by `organization_id` unless there is a specific, documented reason.
- Deleting the previous cycle's raw files, promotional media, or archiving its normalized rows before the new cycle's import is confirmed — leaves no fallback if the new import is bad — delete only after activation succeeds.
- Cascading deletes on `contacts` or `debts` history — destroys the historical record the product is meant to preserve — avoid cascade deletes on business history.
- `FLOAT`/`REAL` on any monetary column (`title_value`, `principal_balance`, `current_balance`) — introduces rounding drift in balances — use `NUMERIC`/`DECIMAL`.
- Matching contacts by `full_name` instead of `external_code` — names collide and vary between reports — `external_code` is the only primary key for correlation.

**Surprising behaviour:**

- `CICLO DE CAPTACION` is the real Debt Report source header, misspelling and all — don't "fix" it in the parser; add aliases instead of renaming the canonical source column.
- Only one cycle may be `active` per organization at a time — activating a new one must archive the previous one as part of the same transition, not as a separate manual step.
- A single contact can have more than one debt row in the same cycle — never assume a 1:1 contact-to-debt relationship.
- The pilot consultant gets lifetime free access, but billing/subscription tables and logic are explicitly out of scope for the current phase — do not start modeling `subscriptions` unless asked.

</red_flags>

@AGENTS.md
@docs/PROJECT_CONTEXT.md

# Vonatur — Project Instructions

## General

Vonatur is a multi-tenant SaaS web application for beauty consultants.

The application must be designed from the beginning to support multiple independent organizations, even though the first production user is a single pilot consultant.

The pilot consultant will have lifetime free access, but billing and subscriptions are NOT part of the current development phase.

The user-facing application and UI must be in Spanish.

Code, database tables, columns, types, variables, functions, interfaces, and technical identifiers must use English names.

---

## Official Stack

Use:

- Next.js App Router
- React
- TypeScript with strict type safety
- Tailwind CSS
- shadcn/ui
- Radix UI
- CVA
- Zod
- React Hook Form
- TanStack Table
- Recharts when charts are required
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- PostgreSQL Row Level Security
- SheetJS for .xls and .xlsx files
- date-fns
- Vitest
- React Testing Library
- Playwright
- MSW
- Vercel
- GitHub Actions

Future integrations:

- Meta WhatsApp Cloud API
- Upstash QStash
- Vercel Cron
- Mercado Pago

Do not introduce these technologies unless explicitly requested:

- Prisma
- Drizzle
- TypeORM
- Sequelize
- Knex
- Express
- Hono
- NestJS
- Firebase
- MongoDB
- Clerk
- Auth.js
- Better Auth
- Redux
- Zustand
- React Query
- BullMQ
- Stripe
- Docker
- Kubernetes
- Terraform
- GraphQL

Do not replace an existing approved technology without explaining the reason first.

---

## Next.js Architecture

Use the App Router.

Prefer Server Components by default.

Use Client Components only when browser APIs, interactivity, local state, hooks, or client-specific functionality actually require them.

Do not add `"use client"` unnecessarily.

Use Next.js Route Handlers for backend HTTP endpoints.

Do not create a separate Express/Hono/NestJS backend.

Business logic must not live inside React components.

Prefer feature-oriented organization where appropriate.

Example:

src/
  features/
    cycles/
    contacts/
    debts/
    imports/
    payments/
    campaigns/

Each feature may contain:

- components
- schemas
- services
- types
- actions
- utils

Do not create excessively large page or component files.

Extract reusable domain logic.

---

## TypeScript Rules

Use strict TypeScript.

Avoid `any`.

Do not silence TypeScript errors without a justified reason.

Prefer explicit domain types.

Use discriminated unions or literal unions for finite states.

Example:

type CycleStatus = "draft" | "active" | "archived";

Validate external inputs using Zod.

Excel data, API requests, webhook payloads, URL parameters and form data must be treated as untrusted input.

---

## Multi-Tenancy

Multi-tenancy is mandatory.

The main tenant identifier is:

`organization_id`

Tenant-owned tables must explicitly contain `organization_id` where appropriate.

Never return records from another organization.

Database queries must be scoped by organization.

Row Level Security must be used for tenant isolation.

Do not solve an RLS problem by disabling RLS.

Never create permissive production policies such as:

`USING (true)`

unless there is a very specific and documented reason.

A future table will relate authenticated Supabase users to organizations:

`organization_members`

Do not invent a direct relationship between `auth.users` and `organizations` before that table is designed.

---

## Supabase Security

Supabase Auth is the authentication provider.

Do not introduce another authentication system.

The Supabase Service Role key must NEVER be exposed to:

- browser code
- Client Components
- NEXT_PUBLIC environment variables
- frontend bundles

Service Role access is server-only.

Storage buckets must remain private unless explicitly changed.

Current buckets:

- `importaciones-ciclos`
- `promociones-ciclos`

Do not directly modify Supabase internal Storage tables.

Use Supabase Storage APIs.

---

## Database Rules

PostgreSQL is the database.

All schema changes must be represented through migrations.

Use UUID primary keys unless there is a documented reason not to.

Use:

`created_at timestamptz`

and:

`updated_at timestamptz`

where appropriate.

Monetary values must use PostgreSQL NUMERIC/DECIMAL.

Never use PostgreSQL FLOAT for monetary values.

External business identifiers such as consultant codes must be stored as text.

Phone numbers must be stored as text.

Protect historical data from accidental deletion.

Do not use cascading deletes for important business history without carefully reviewing the consequences.

Add indexes only when justified by actual query patterns.

---

## Current Database Scope

The current initial database contains or is expected to contain only these five business tables:

1. organizations
2. cycles
3. contacts
4. contact_cycle_data
5. debts

Do not add unrelated business tables unless explicitly requested.

Future tables may include:

- organization_members
- payments
- media_assets
- campaigns
- campaign_recipients
- message_templates
- message_queue
- message_logs
- reminder_rules
- whatsapp_connections
- subscriptions
- audit_logs

These are NOT automatically part of the current task.

---

## Cycles

There are approximately 19 commercial cycles per year.

Valid cycle numbers:

1 through 19.

A cycle has one of these statuses:

- draft
- active
- archived

Only one active cycle should exist per organization.

When a new cycle is successfully activated:

previous active cycle:
active -> archived

new cycle:
draft -> active

Historical normalized PostgreSQL data must NOT be deleted when a cycle changes.

---

## Excel Imports

Each cycle requires exactly two source Excel reports.

### Channel Extract Report

Typical format:

`.xlsx`

Required fields:

- CÓDIGO DE CONSULTORA
- NOMBRE DE CONSULTORA
- ESTADO
- NIVEL
- PUNTOS ACUMULADOS
- TELÉFONO
- DISTRITO

Internal mapping:

- CÓDIGO DE CONSULTORA -> external_code
- NOMBRE DE CONSULTORA -> full_name
- ESTADO -> status
- NIVEL -> level
- PUNTOS ACUMULADOS -> accumulated_points
- TELÉFONO -> phone
- DISTRITO -> district

### Debt Report

Typical format:

`.xls`

Required fields:

- CODIGO
- NOMBRE
- TELEFONO
- SITUACION COMERCIAL
- NIVEL
- VALOR TÍTULO
- SALDO PRINCIPAL
- SALDO ACTUALIZADO
- SITUACION
- VENCIMIENTO
- CICLO DE CAPTACION
- FECHA DE VENCIMIENTO
- DIAS DE RETRASO

Internal mapping:

- CODIGO -> external_code
- NOMBRE -> full_name
- TELEFONO -> phone
- SITUACION COMERCIAL -> commercial_status
- NIVEL -> level
- VALOR TÍTULO -> title_value
- SALDO PRINCIPAL -> principal_balance
- SALDO ACTUALIZADO -> current_balance
- SITUACION -> situation
- VENCIMIENTO -> maturity_status
- CICLO DE CAPTACION -> acquisition_cycle
- FECHA DE VENCIMIENTO -> due_date
- DIAS DE RETRASO -> days_overdue

The actual source header is:

`CICLO DE CAPTACION`

The parser may support safe aliases in the future.

---

## Contact Matching

The primary external identifier is:

`external_code`

Match:

Debt report:
`CODIGO`

with:

Channel Extract:
`CÓDIGO DE CONSULTORA`

Do NOT use the person's name as the primary matching mechanism.

Phone may be used as a secondary validation signal.

Ambiguous matches must be flagged for review instead of silently guessed.

---

## Excel Parsing

Use SheetJS because source files include both:

- `.xls`
- `.xlsx`

Do not replace SheetJS with ExcelJS unless there is a demonstrated requirement.

Normalize Excel headers before matching:

- trim whitespace
- normalize case
- tolerate accents where appropriate
- support explicitly approved aliases

Ignore Excel columns that are not required by the system.

Never trust Excel values directly.

Validate and normalize imported rows before database persistence.

The import flow must have a preview/validation stage before committing data.

---

## Safe Cycle Replacement

Never delete the previous cycle's raw files before validating the new cycle.

Required workflow:

1. Upload both new files.
2. Parse both files.
3. Validate required columns.
4. Validate rows.
5. Match contacts.
6. Show import preview.
7. User confirms import.
8. Persist new normalized data.
9. Archive previous active cycle.
10. Activate new cycle.
11. Delete previous raw Excel files.
12. Delete previous promotional media if applicable.

If the new import fails, the previous cycle must remain usable.

Historical normalized PostgreSQL records must remain.

---

## Storage Lifecycle

Bucket:

`importaciones-ciclos`

is used for cycle source files.

Bucket:

`promociones-ciclos`

is used for promotional media.

Recommended organization:

organization-id/
  year/
    cycle-N/

Previous cycle raw files may be physically removed after successful activation of the next cycle.

Previous promotional images may also be removed when no longer applicable.

Historical database records must remain.

---

## Debt Rules

Debt records may contain:

- title value
- principal balance
- current balance
- commercial situation
- debt situation
- maturity information
- due date
- overdue days

Do not assume one contact can only ever have one debt.

A contact may potentially have multiple debt records in the same cycle.

Future payment functionality must support partial payments.

Do not model payment state only as a boolean.

Future conceptual flow:

original/current balance
- payment
= remaining balance

When remaining balance reaches zero, the debt may transition to paid.

Payment history must be preserved when that functionality is implemented.

---

## WhatsApp

WhatsApp integration is NOT part of the current database/import phase unless explicitly requested.

Future integration will use:

Meta WhatsApp Cloud API

Do not use unofficial WhatsApp automation libraries.

Do not implement mechanisms intended to bypass Meta rate limits, spam detection, or platform policies.

Business-initiated messages must follow WhatsApp template and consent requirements.

Future sending architecture:

Vonatur
-> message queue
-> QStash
-> WhatsApp Cloud API

Do not implement long-running `sleep()` loops inside Vercel requests.

Message sending must eventually support:

- pending
- sent
- delivered
- read
- failed

Webhooks will update message status.

---

## UI / UX

The user-facing interface is Spanish.

The application must work well on desktop and mobile browsers.

This is a responsive web application, NOT a native mobile application.

Prefer:

- shadcn/ui
- Radix primitives
- Tailwind CSS
- reusable CVA variants
- design tokens

Maintain visual consistency.

Do not hard-code arbitrary colors repeatedly throughout components.

Use accessible labels, keyboard interaction and semantic HTML.

Tables must support useful filtering and sorting where necessary.

Use TanStack Table for complex data tables.

Avoid unnecessary visual complexity.

---

## Error Handling

Do not silently swallow errors.

Errors visible to end users must be understandable and written in Spanish.

Internal technical errors must preserve useful diagnostic context.

Never expose:

- secrets
- service keys
- database credentials
- raw internal stack traces

to end users.

---

## Testing

Critical business logic must be testable independently from UI components.

Use:

- Vitest
- React Testing Library
- Playwright
- MSW where appropriate

Important future test cases include:

- valid Excel import
- missing required Excel column
- duplicated external_code
- invalid phone
- malformed dates
- decimal balances
- invalid cycle number
- tenant isolation
- RLS behavior
- import rollback/failure
- successful cycle activation

Do not write tests only to increase coverage.

Test business behavior.

---

## Development Method

Before implementing a substantial feature:

1. inspect the existing repository;
2. identify affected files;
3. understand current patterns;
4. create a concise implementation plan;
5. identify database/schema impact;
6. identify security impact;
7. implement incrementally;
8. run type checks/lint/tests;
9. review the implementation.

Do not rewrite unrelated code.

Do not introduce additional abstractions without a concrete need.

Prefer the smallest maintainable solution that respects the architecture.

---

## Current Priority

The current priority is the core cycle/import system.

Development order:

1. Supabase/database foundation
2. cycles
3. contacts
4. Channel Extract parser
5. Debt Report parser
6. validation
7. contact matching by external_code
8. import preview
9. confirmed import
10. contacts/debts visualization

Do NOT jump directly into:

- WhatsApp
- subscriptions
- Mercado Pago
- QStash
- advanced analytics

unless explicitly requested.

---

## Definition of Done

A feature is not complete merely because it renders.

Before considering substantial work complete, verify:

- TypeScript compiles
- lint passes
- important tests pass
- tenant isolation is preserved
- no secret is exposed
- invalid input is handled
- loading/error/empty states exist where relevant
- implementation follows existing project conventions

When unsure about a business requirement, ask instead of inventing it.

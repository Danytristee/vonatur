# Vonatur SaaS — Reference

Quick lookup only. Decisions and patterns live in [../SKILL.md](../SKILL.md) and
[core.md](core.md); this file is tables, not rationale.

## Current database scope (5 tables)

| Table                | Notes                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| `organizations`       | The tenant root                                                       |
| `cycles`              | `status`: `draft` \| `active` \| `archived`; one `active` per org max |
| `contacts`            | Keyed externally by `organization_id + external_code`                |
| `contact_cycle_data`  | Per-cycle snapshot of a contact (status, level, points, district, …) |
| `debts`               | One-to-many with `contacts`; monetary fields are `NUMERIC`            |

Future tables (not automatically in scope — build only when explicitly requested):
`organization_members`, `payments`, `media_assets`, `campaigns`, `campaign_recipients`,
`message_templates`, `message_queue`, `message_logs`, `reminder_rules`, `whatsapp_connections`,
`subscriptions`, `audit_logs`.

## Channel Extract Report (`.xlsx`) column mapping

| Source column            | Internal field       |
| ------------------------- | --------------------- |
| CÓDIGO DE CONSULTORA      | `external_code`      |
| NOMBRE DE CONSULTORA      | `full_name`          |
| ESTADO                    | `status`             |
| NIVEL                     | `level`               |
| PUNTOS ACUMULADOS         | `accumulated_points` |
| TELÉFONO                  | `phone`               |
| DISTRITO                  | `district`            |

## Debt Report (`.xls`) column mapping

| Source column          | Internal field         |
| ------------------------ | ------------------------ |
| CODIGO                   | `external_code`         |
| NOMBRE                   | `full_name`             |
| TELEFONO                 | `phone`                  |
| SITUACION COMERCIAL      | `commercial_status`     |
| NIVEL                    | `level`                  |
| VALOR TÍTULO             | `title_value`           |
| SALDO PRINCIPAL          | `principal_balance`     |
| SALDO ACTUALIZADO        | `current_balance`       |
| SITUACION                | `situation`             |
| VENCIMIENTO              | `maturity_status`       |
| CICLO DE CAPTACION       | `acquisition_cycle`     |
| FECHA DE VENCIMIENTO     | `due_date`              |
| DIAS DE RETRASO          | `days_overdue`          |

`CICLO DE CAPTACION` is the real source header — no accent on "CAPTACION". Never silently rename it.

## Cycle status transitions

| From                | To                 | When                                            |
| -------------------- | -------------------- | -------------------------------------------------- |
| `draft`              | `active`             | New cycle's import confirmed and persisted        |
| `active`             | `archived`           | Same step as the above — the old active cycle      |
| (none, terminal)     | —                   | `archived` never transitions back                  |

Only one `active` cycle per `organization_id` at any time. Valid cycle numbers: 1–19.

## Storage buckets (both private)

| Bucket                 | Purpose                                | Suggested layout                        |
| ------------------------ | ----------------------------------------- | ------------------------------------------ |
| `importaciones-ciclos`   | Raw source Excel files per cycle         | `organization-id/year/cycle-N/`           |
| `promociones-ciclos`     | Promotional media per cycle              | `organization-id/year/cycle-N/`           |

Raw files/media may be physically deleted after the next cycle activates successfully; normalized
PostgreSQL rows are never deleted as part of that cleanup.

## Stack — allowed vs. do not introduce

**Use:** Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn/ui, Radix UI, CVA, Zod,
React Hook Form, TanStack Table, Recharts, Supabase (Auth/Storage/Postgres/RLS), SheetJS, date-fns,
Vitest, React Testing Library, Playwright, MSW, Vercel, GitHub Actions.

**Do not introduce without explicit request:** Prisma, Drizzle, TypeORM, Sequelize, Knex, Express,
Hono, NestJS, Firebase, MongoDB, Clerk, Auth.js, Better Auth, Redux, Zustand, React Query, BullMQ,
Stripe, Docker, Kubernetes, Terraform, GraphQL.

**Future (not yet, per current priority):** Meta WhatsApp Cloud API, Upstash QStash, Vercel Cron,
Mercado Pago.

## Current implementation priority

1. Supabase/database foundation
2. `cycles`
3. `contacts`
4. Channel Extract parser
5. Debt Report parser
6. Validation
7. Contact matching by `external_code`
8. Import preview
9. Confirmed import
10. Contacts/debts visualization

WhatsApp, subscriptions, Mercado Pago, QStash and advanced analytics are explicitly deferred past
this list unless the user asks for them directly.

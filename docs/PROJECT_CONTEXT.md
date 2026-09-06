# Vonatur — Project Context

## Product

Vonatur is a SaaS application designed to organize the work of beauty consultants.

The first user is a pilot consultant who currently manages much of her work manually using Excel, phone calls and WhatsApp.

The software must centralize:

- consultants/contacts
- commercial status
- levels
- accumulated points
- debts
- current balances
- payment status
- cycle information
- promotional material
- communication workflows

The first consultant is paying for development and will receive lifetime access without a subscription fee.

After validation, the product is intended to be offered to other consultants through a subscription model.

Therefore the architecture must be multi-tenant from the beginning.

---

# Commercial cycles

There are approximately 19 cycles per year.

At the start of each cycle the user receives two Excel reports:

1. Channel Extract Report
2. Debt Report

Both reports are uploaded to Vonatur.

A cycle import replaces the raw source files used by the previous cycle.

The old normalized historical data is retained.

---

# Excel 1 — Channel Extract Report

Typical format:

.xlsx

Required source columns:

- CÓDIGO DE CONSULTORA
- NOMBRE DE CONSULTORA
- ESTADO
- NIVEL
- PUNTOS ACUMULADOS
- TELÉFONO
- DISTRITO

The consultant code must be persisted even if it is not displayed prominently to the end user.

It is the principal identifier used to correlate information between reports.

---

# Excel 2 — Debt Report

Typical format:

.xls

Required source columns:

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

The real source header observed is:

CICLO DE CAPTACION

---

# Data correlation

Primary correlation:

Debt Report:
CODIGO

Channel Extract:
CÓDIGO DE CONSULTORA

Internal identifier:

external_code

Names must not be used as the primary correlation mechanism.

---

# Cycle replacement behavior

A new cycle must not destroy the currently valid cycle before validation succeeds.

Expected flow:

Upload both reports
-> parse
-> validate
-> correlate
-> preview
-> confirm
-> persist
-> activate new cycle
-> archive old cycle
-> remove obsolete raw files/media

If validation fails, the current active cycle remains unchanged.

---

# Historical information

Raw Excel files from previous cycles do not need to be permanently stored.

Normalized PostgreSQL data should be retained.

This enables future analytics such as:

- level progression
- accumulated points history
- debt history
- commercial status history
- activity/inactivity history

---

# Current Supabase Storage

Private buckets:

- importaciones-ciclos
- promociones-ciclos

---

# Initial Database

Initial tables:

organizations
cycles
contacts
contact_cycle_data
debts

Future tables will be added incrementally.

---

# Contacts

Contacts are identified externally by:

external_code

Potential fields include:

- full_name
- phone
- current_status
- current_level
- district

Each organization has its own contacts.

A unique external code constraint should be scoped to organization:

organization_id + external_code

---

# Debt management

The system must eventually support:

- original/principal balance
- updated balance
- overdue information
- due dates
- partial payments
- paid/pending status
- payment history

A future registered payment must update the remaining balance.

---

# Levels

Users may need to communicate with people according to their commercial level.

Future campaigns may target:

- level 2
- level 3
- level 4
- level 5
- level 6
- level 7

Do not hard-code separate implementations for each level.

Use data-driven filtering.

---

# Promotions

Users will upload promotional images for each cycle.

Images are associated with the current organization and cycle.

Once a cycle is replaced and previous promotions are obsolete, those files can be removed.

Future WhatsApp campaigns may attach these promotional images.

---

# WhatsApp vision

Future communication will use the official Meta WhatsApp Cloud API.

Examples:

- debt reminders before due date
- reminders on due date
- overdue reminders
- promotional campaigns
- level-specific communications

The system should generate messages and allow review before sending bulk communications.

Future processing should use a serverless queue rather than blocking HTTP requests.

Preferred queue:

Upstash QStash.

---

# SaaS vision

Each paying consultant becomes an organization/tenant.

Each tenant must have isolated:

- contacts
- cycles
- debts
- payments
- imports
- promotions
- campaigns
- WhatsApp configuration

The pilot consultant receives a lifetime/free plan.

Future billing is expected to use Mercado Pago but is not currently being implemented.
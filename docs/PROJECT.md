# Vonatur — Product Rules & Decisions

This document captures the real domain model and product decisions gathered directly
from the founder in a structured interview (2026-09-17). It refines and, where it
conflicts, takes precedence over the more generic framing in `docs/PROJECT_CONTEXT.md`.
Treat unresolved items below as genuinely open — do not silently invent an answer for
them; ask before building.

---

## Domain model (critical context)

Vonatur serves independent Natura Perú **líderes** — high-rank consultants (team
leaders / gerentes) inside Natura's multi-level sales structure — who each manage a
**downline network** of lower-rank consultants.

- One Vonatur `organization` = one líder. One user per organization. A single,
  undifferentiated role — do **not** build an admin/member/viewer role hierarchy.
  `organization_members` exists for future multi-tenant onboarding, not for
  permission layers within a tenant.
- `contacts` = the líder's downline network (the consultoras she is responsible for),
  **not** external customers or clients.
- `debts` = balances those downline consultants owe **to Natura**, not to the líder.
  Vonatur's role today is tracking and follow-up (calls, WhatsApp), not acting as the
  creditor or payment processor.
- Natura Perú context: ~19 sales cycles/year; consultant levels are based on
  accumulated points (publicly documented tiers are Silver/Gold/Diamond-style; exact
  internal level labels used in the pilot's Excel reports are the source of truth).

## Multi-tenancy & growth

- The pilot's downline network is **150-400 consultoras** — design tables, imports,
  and pagination for this scale now. Avoid unpaginated full-table renders.
- Realistic near-term growth: **6-20 additional líderes** could become paying tenants
  within ~6 months. A self-service or admin onboarding flow is **not** a current
  priority — manual/SQL tenant creation is acceptable for now.
- Data isolation between líderes defaults to 100% via RLS (already implemented). A
  shared/common layer (e.g., Natura catalog content or promotions reused across
  tenants) is a plausible future need but not a current requirement — don't
  architect for it yet, and don't block it either.

## Cycles

- Importing outside the expected time window should **warn, not block** — Natura's
  report release dates vary.
- Draft cycles: the líder should be able to **edit and delete** a draft cycle (year /
  cycle number) before it has a confirmed import. This is new work — today only
  creation exists (`createDraftCycle`); there is no edit or delete action yet.
- Cycle numbers repeat every year (1-19). Historical views must always show the year.
  The **active/current cycle view** should show the cycle number plus the month
  instead of a bare year — confirm exact copy with the pilot when building this.
- A history view of past (archived) cycles with their normalized data is important —
  prioritize it.

## Contacts (downline consultoras)

- Source of truth is the Excel import; manual field-level edits after import are
  allowed (already exists — row editing in Consultoras).
- No "create from scratch" contact flow — contacts always originate from an import,
  then can be corrected manually.
- When a consultora disappears from a new Excel (dropped from Natura), **mark her
  inactive** — never delete her historical record.
- Table filters to prioritize (multi-select, in this order of importance): **nivel**,
  **estado/actividad**, **deuda pendiente**. District filter is lower priority.
- Ambiguous `external_code` matches during import: exact UX is unresolved (pilot
  wasn't sure). Default to the safe behavior already stated in `CLAUDE.md` — import
  unambiguous rows, flag ambiguous ones for manual review — but confirm the review
  screen's UX with the pilot before finalizing it.

## Debts & payments

- Debt is owed to Natura, not to the líder. The debts module is a **tracking/
  follow-up tool**, not a payment processor, at least for now.
- **OPEN QUESTION — ask the pilot before building any payment-recording feature:**
  how does she currently learn a debt was paid? Does the next Debt Report simply
  reflect the updated balance, does she track it herself outside the system, or does
  money pass through her physically before reaching Natura? This determines whether
  "register a payment" is a real Vonatur feature or purely a display of imported data.
- Priority order given that uncertainty:
  1. View/filter imported debts (already scoped as the first phase).
  2. Follow-up notes per consultora (confirmed high value — see below).
  3. Actual payment recording — deprioritized until the pilot clarifies her real
     process.
- **Follow-up notes**: the líder wants free-text notes per consultora (e.g. "prometió
  pagar el viernes", "no contesta"). This needs a **new table** (e.g.
  `contact_notes`), which is outside the original 5-table scope in `CLAUDE.md` —
  requires an explicit migration confirmation per the engineering rule below before
  implementing.

## Communications (WhatsApp)

- Debt reminders and level-based promotional campaigns are **equal priority** — build
  both together when this phase starts, not one before the other.
- The líder must **always review and approve every message before it sends** — no
  fully automatic sending, even for simple reminders. Model the message queue around
  a mandatory human-approval step, not a "send automatically after N days" rule.
- Whether the pilot already has a WhatsApp Business / Meta Cloud API account is
  **unknown** — confirm before starting any real integration work; don't assume it
  exists.

## Promotions

- Promotional images apply **both** at the whole-cycle level **and** at the
  nivel/segment level within a cycle. The schema must support scoping an asset either
  broadly (whole network) or to a specific nivel — not cycle-only.

## Imports

- A row that fails validation should be **excluded with a visible warning**, not
  block the entire import — matches the existing preview/validation requirement in
  `CLAUDE.md`.
- Past imports need a **dedicated, visible-in-UI history screen** (not just internal
  `audit_logs`) — what was uploaded, when, and the result.

## Engineering rules (reaffirmed/refined for this project)

- Tests are mandatory for business-critical logic: parsers, contact matching,
  financial/point calculations — this is the existing pattern, keep it. UI-only code
  does not need the same rigor.
- **RLS policies and new migrations: always ask for explicit confirmation before
  implementing** — no exceptions, even for a change that looks like a clear extension
  of an existing pattern (e.g., another `is_organization_member`-style helper). Stop
  and confirm the plan first, every time.

## Near-term roadmap (in order)

1. Debts module: view/filter (already scoped).
2. Follow-up notes per consultora (new table — needs a confirmed migration).
3. Promotions (cycle-wide **and** nivel-scoped image uploads).
4. WhatsApp integration (reminders + promotions, always human-approved sends) —
   blocked on confirming the Meta/WhatsApp Business account status.
5. Import history screen in the UI.

## Open questions to resolve with the pilot consultant

- How does a debt payment actually get reflected/recorded today (Excel-only update
  vs. manual tracking vs. cash passing through the líder)?
- Does she already have a WhatsApp Business / Meta Cloud API account?
- Exact copy for "cycle + month" in the active cycle view vs. "cycle + year" in the
  historical view.

# FAZIA Housing — Module Specifications (v1.0)

Each module follows the build order: **UX → Schema → API → Backend → Frontend → Integrate → Validate → Test → Refactor**.

---

## Module 0 — Foundation & Design System

**Purpose:** Runnable app shell, tokens, shared primitives, Prisma base, CI baselines.

**Includes:** Next.js 15 scaffold, Tailwind + Shadcn, fonts, layout shell, form kit, data-table kit, feedback states, env config, logging, health check, error boundaries.

**Actors:** Engineers.

**Exit criteria:** Empty authenticated shell renders; design tokens approved; `pnpm` scripts for lint/test/migrate.

---

## Module 1 — Authentication

**Purpose:** Secure sign-in, session, password reset, lockout basics.

**UX:** Login, forgot/reset password, session expiry handling.

**Key entities:** User, Account, Session, VerificationToken.

**APIs:** Auth.js routes, `/me`.

**Permissions:** Public login; authenticated `/me`.

---

## Module 2 — User Management

**Purpose:** Invite, activate, deactivate, profile, link to employee/contractor.

**UX:** Users list (search/filter by status/role/org), invite dialog, detail page.

**Services:** InviteUser, UpdateUser, DeactivateUser, ResetPassword.

---

## Module 3 — Roles & Permissions (RBAC)

**Purpose:** Configurable permissions; system roles seeded; custom roles allowed.

**UX:** Roles matrix (permissions grid), role detail, user role assignment.

**Rules:** `SUPER_ADMIN` irreversible system role; DENY overrides ALLOW on user permission.

**Permission code format:** `{module}.{action}` e.g. `grn.post`, `bills.approve`.

---

## Module 4 — Organization Hierarchy

**Purpose:** HQ → Region → Site → Store/Finance units; user placement.

**UX:** Tree view + table; drag reorder optional later.

**Rules:** Cannot delete OrgUnit with active users/children (soft-delete blocked).

---

## Module 5 — Project Management

**Purpose:** Create/manage projects; membership; project context switcher.

**UX:** Projects board/table; project overview dashboard stub; member management.

**Key KPI seed:** house counts by status (filled when houses exist).

---

## Module 6 — Phases · Sectors · Blocks

**Purpose:** Physical breakdown under project.

**UX:** Nested master-data screens with breadcrumb; bulk create codes.

**Rules:** Codes unique within parent; cascade soft-delete policy (block if children exist).

---

## Module 7 — House Types & Houses

**Purpose:** Typology catalog + individual house register at scale.

**UX:** House type CRUD; houses table with heavy filters (phase/sector/block/type/status); CSV bulk import; house detail with progress timeline.

**Rules:** Hierarchy integrity; status history on change.

---

## Module 8 — Contractors

**Purpose:** Contractor master + project assignments; portal user linkage.

**UX:** Contractor directory; assignment drawer; documents attach.

---

## Module 9 — Employees

**Purpose:** Internal staff register + project assignments.

**UX:** Employee directory; link/unlink User account.

---

## Module 10 — BOQ Management

**Purpose:** Structured Bill of Quantities with revisions.

**UX:** BOQ tree/table editor; revise flow (snapshot history); approve BOQ.

**Rules:** Amounts server-calculated; revisions immutable snapshots.

---

## Module 11 — Construction Activities

**Purpose:** Activity library linked to BOQ; per-house activity tracking.

**UX:** Activity catalog; house activity progress grid; weight-based rollup to house %.

---

## Module 12 — Inspection Requests (IR)

**Purpose:** Quality gate before marking work complete.

**UX:** IR inbox for QM/RE; schedule; pass/fail/conditional; photo attachments (Cloudinary).

**Workflow:** Draft → Submit → Review → Approve/Reject → (Reinspect).

**Side effects:** On PASS, may unlock next activity / update HouseActivity.

---

## Module 13 — Daily Progress Reports (DPR)

**Purpose:** Site daily execution log.

**UX:** Date-locked form; line items by house/activity; submit/approve.

**Rules:** One DPR per project per date.

---

## Module 14 — Weekly Progress Reports (WPR)

**Purpose:** Aggregated weekly status for management.

**UX:** Week picker; planned vs actual; risks; export PDF.

---

## Module 15 — Store Management

**Purpose:** Warehouses (central + site), store officers, stock overview.

**UX:** Warehouse CRUD; stock balances table; low-stock alerts.

---

## Module 16 — Material Management

**Purpose:** Material master & categories.

**UX:** Category tree; material catalog; units; min stock.

---

## Module 17 — Goods Receipt (GRN)

**Purpose:** Receive materials into warehouse.

**UX:** GRN form with lines; post action (irreversible without reverse doc).

**Posting:** Ledger IN + StockBalance↑ + moving average cost update + audit + notify.

---

## Module 18 — Material Requisitions

**Purpose:** Site requests materials.

**Workflow:** Draft → Submit → Approve/Reject.

---

## Module 19 — Demand Voucher

**Purpose:** Authorized demand bridging requisition → issue.

**Rules:** Quantities cannot exceed approved MR (configurable tolerance).

---

## Module 20 — Material Issue

**Purpose:** Issue stock to contractor/site/employee.

**Posting:** Ledger OUT; insufficient stock blocked.

---

## Module 21 — Material Consumption

**Purpose:** Book materials against house/activity for cost & progress correlation.

---

## Module 22 — Material Returns

**Purpose:** Return unused materials to warehouse.

**Posting:** Ledger IN; optional link to original Issue.

---

## Module 23 — Inventory Ledger

**Purpose:** Immutable movement history & valuation trail.

**UX:** Ledger explorer (filters by material/warehouse/ref/date); export CSV/Excel.

---

## Module 24 — Measurement Book (MB)

**Purpose:** Record measured quantities for contractor work.

**UX:** MB header + entries from BOQ; approve MB.

---

## Module 25 — Contractor Billing

**Purpose:** Bills from MB; retention & deductions; approval chain; payment link.

**Workflow:** Draft → Submit → Verify → Approve → (Payment).

**History:** Snapshot on every status/amount change.

---

## Module 26 — Finance

**Purpose:** Budgets, payment register, project cost vs budget KPIs.

**Note:** Construction finance — not full GL. Export hooks for external accounting later.

---

## Module 27 — HQ Directives

**Purpose:** Push instructions; track acknowledgements.

**UX:** Directive composer; distribution by role/project; ack checklist.

---

## Module 28 — Notifications

**Purpose:** In-app center + email via Resend.

**UX:** Bell unread count; list; mark read; preferences.

**Realtime:** Polling v1 (10–30s); SSE/Upstash later if needed.

---

## Module 29 — Document Management

**Purpose:** Central files + polymorphic links to entities.

**Storage:** Cloudinary (or S3-compatible later); virus scan out of scope v1.

---

## Module 30 — Reports

**Purpose:** Operational & management reports with PDF/Excel/CSV/Print.

**Examples:** House progress, IR aging, stock valuation, contractor bill register, material consumption by house.

---

## Module 31 — Dashboards

**Purpose:** Role-aware KPI home.

| Dashboard | Audience | KPIs |
|---|---|---|
| Executive | Senior Mgmt / ADH | Projects health, spend vs budget, completion % |
| Project | RE / Site | Houses by status, IR backlog, DPR compliance |
| Inventory | Store | Stock value, low stock, GRN/Issue volume |
| Financial | Finance | Bills pending, payments, retention |
| Construction | QM / Tech | Activity progress, fail rate, WPR trends |

Charts via Recharts; cards + progress; optional map later.

---

## Module 32 — Audit Logs

**Purpose:** Compliance trail for security & disputes.

**UX:** Searchable audit table (actor, entity, action, date); detail JSON diff.

**Immutable:** No update/delete APIs.

---

## Module 33 — Workflow Inbox

**Purpose:** Unified tasks across IR, DPR, WPR, MR, Bills, Directives.

**UX:** Inbox list; claim/complete; filters by type/due; deep link to document.

---

## Cross-Module Dependencies (simplified)

```
Foundation → Auth → Users → RBAC → Org
RBAC → all modules
Org → Projects → Phases/Sectors/Blocks → HouseTypes/Houses
Projects → Contractors/Employees
Houses + BOQ → Activities → IR / DPR / WPR / MB
Materials + Store → GRN → MR → DV → Issue → Consumption/Returns → Ledger
MB → Billing → Finance/Payments
All documents → Workflow + Notifications + Audit + Documents
Aggregations → Reports + Dashboards
```

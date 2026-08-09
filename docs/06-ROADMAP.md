# Falcon Housing — Development Roadmap (v1.0)

> Module-by-module delivery. No parallel “build everything.”  
> Each phase ends with demoable, testable software.

---

## Guiding Rules

1. Architecture approval **before** Module 0 coding.
2. One module at a time through the 10-step cycle.
3. Do not start Module N+1 until Module N exit criteria pass.
4. Prefer vertical slices (working UI + API + DB) over horizontal layers alone.
5. Seed only what the current module needs.

---

## Timeline Overview (indicative)

| Phase | Modules | Focus | Indicative duration |
|---|---|---|---|
| **P0** | Approval | Architecture sign-off | — |
| **P1** | 0–4 | Platform, IAM, Org | 2–3 weeks |
| **P2** | 5–9 | Project structure & parties | 2–3 weeks |
| **P3** | 10–14 + **11A** | Construction execution + Yard Stick | 3–5 weeks |
| **P4** | 15–23 | Store & inventory chain | 4–5 weeks |
| **P5** | 24–26 + **24A/24B** | MB, RAR, Voucher, billing, finance | 3–4 weeks |
| **P6** | 27–33 | Governance, reports, polish | 3–4 weeks |
| **P7** | Hardening | Perf, security, UAT, prod | 2–3 weeks |

*Durations assume a small senior team (2–4 engineers). Adjust for staffing.*

---

## Phase 0 — Architecture Approval (CURRENT)

**Deliverables:** Docs in `/docs` (this set).

**Exit:** Stakeholder approval of architecture, ERD, Prisma models, API conventions, roadmap.

---

## Phase 1 — Platform & Access

| Order | Module | Exit criteria |
|---|---|---|
| 0 | Foundation | App boots on Vercel preview; design system; Prisma connected; CI |
| 1 | Authentication | Login/logout/reset; secured dashboard shell |
| 2 | Users | Invite/list/deactivate |
| 3 | RBAC | Permission checks enforced server-side; roles seeded |
| 4 | Organization | Org tree CRUD; users assigned to units |

**Milestone demo:** Admin invites user, assigns role, user sees permission-filtered nav.

---

## Phase 2 — Projects & Master Data

| Order | Module | Exit criteria |
|---|---|---|
| 5 | Projects | CRUD + members + context switcher |
| 6 | Phases/Sectors/Blocks | Nested masters with integrity |
| 7 | House Types & Houses | Bulk import 1k+ houses; filters performant |
| 8 | Contractors | Assignments to projects |
| 9 | Employees | Assignments + user link |

**Milestone demo:** Full project hierarchy populated; house register searchable.

---

## Phase 3 — Construction Execution

| Order | Module | Exit criteria |
|---|---|---|
| 10 | BOQ | Tree editor + revision snapshots |
| 11 | Activities | House activity progress rollup |
| **11A** | **Yard Stick Management** | Templates + items (weight % / payment %); House Template binds one Yard Stick; activities inherit weights; version + effective date |
| 12 | Inspection Requests | Full workflow + attachments |
| 13 | DPR | Daily submit/approve |
| 14 | WPR | Weekly submit/approve + export |

**Milestone demo:** Contractor requests IR → QM passes → DPR reflects progress → house % updates (Yard Stick–weighted).

---

## Phase 4 — Materials & Store (critical path)

| Order | Module | Exit criteria |
|---|---|---|
| 15 | Store / Warehouses | Balances view |
| 16 | Materials | Catalog + categories |
| 17 | GRN | Post increases stock + ledger |
| 18 | Material Requisition | Approval workflow |
| 19 | Demand Voucher | Linked to MR |
| 20 | Material Issue | Post decreases stock |
| 21 | Consumption | Link to house/activity |
| 22 | Returns | Restock path |
| 23 | Inventory Ledger | Complete audit of movements |

**Milestone demo:** End-to-end stock cycle with zero balance drift under concurrency tests.

---

## Phase 5 — Commercial

| Order | Module | Exit criteria |
|---|---|---|
| 24 | Measurement Book | Entries from BOQ; multi-level / amount-based approval hooks |
| **24A** | **Running Account Receipt (RAR)** | MB → RAR → Approve; lines/deductions/adjustments/history; statuses through Paid/Cancelled |
| **24B** | **Payment Voucher** | From approved RAR; taxes/retention/recoveries/charges; net payable server-calculated; printable voucher |
| 25 | Contractor Billing | Retention, approvals, history (compatible with RAR path) |
| 26 | Finance | Budgets + payments + KPIs; Contract Payment Engine wiring |

**Milestone demo:** MB → RAR → Payment Voucher → Payment recorded; Progress Sheet export; budget variance visible.

**Payment calculation chain (engine):** BOQ → MB → Yard Stick → RAR → Voucher → Payment (no manual totals).

---

## Phase 6 — Governance & Intelligence

| Order | Module | Exit criteria |
|---|---|---|
| 27 | HQ Directives | Ack tracking |
| 28 | Notifications | In-app + email |
| 29 | Documents | Upload/link/search |
| 30 | Reports | PDF/Excel/CSV/Print including Progress Sheet, RAR/Voucher registers, retention, pending bills |
| 31 | Dashboards | Role-aware KPI pages + commercial placeholders (RAR/Voucher/Progress/Retention/…) |
| 32 | Audit Logs | Admin explorer |
| 33 | Workflow Inbox | Unified tasks including MB, RAR, Voucher, Payment |

**Milestone demo:** Management dashboard + inbox-driven approvals across modules.

---

## Phase 7 — Production Hardening

- Load test list endpoints (10k+ houses)
- Inventory concurrency stress
- Security review (headers, RBAC gaps, IDOR)
- Backup/restore drill for PostgreSQL
- UAT with real roles (RE, Store, QM, Finance, Contractor)
- Runbooks + env matrix
- Production deploy checklist

---

## Per-Module 10-Step Cycle (mandatory)

```
1. Design UX (wireframes / page inventory / empty-error-loading)
2. Design DB delta (tables/indexes)
3. Design Prisma models + migration plan
4. Design API (routes, DTOs, transitions)
5. Build backend (repo → service → thin route)
6. Build frontend (RHF forms, table, states)
7. Connect FE ↔ BE (TanStack Query)
8. Validate (Zod + permission + business rules)
9. Test (unit service + API integration + smoke e2e)
10. Refactor (remove duplication; tighten types)
```

---

## First Coding Sprint (after approval only)

**Module 0 — Foundation**

1. Initialize Next.js 15 + TypeScript + Tailwind + Shadcn  
2. Folder structure per architecture  
3. Prisma multi-file schema stub + `User`/`AuditLog` baselines  
4. Design tokens + app shell (unauthenticated + authenticated layouts)  
5. Shared DataTable, Form primitives, PageHeader, Feedback states  
6. Health API + logging  
7. Vercel + Postgres env wiring  
8. README with local setup  

**No domain modules until Module 0 exits.**

---

## Risk Register (early)

| Risk | Mitigation |
|---|---|
| Inventory race conditions | TX + optimistic `version` + idempotency keys |
| Huge house tables | Composite indexes, server pagination, import jobs |
| Permission sprawl | Permission registry codegen from single source |
| Vercel serverless timeouts | Keep heavy exports/jobs chunked; consider background later |
| Scope creep | Strict module gates; change control on schema |

---

## Approval Signature

| Role | Name | Date | Decision |
|---|---|---|---|
| Product Owner | | | Approve / Changes requested |
| Tech Lead | | | Approve / Changes requested |
| Domain Expert (Construction) | | | Approve / Changes requested |

# FAZIA Housing — Final Architecture Validation & Additions (v1.0)

> **Review type:** Principal Software Architect pre-development validation  
> **Constraint:** Existing architecture is **frozen**. This document only **appends** missing enterprise requirements.  
> **Do not:** redesign, rename entities, restructure modules, or rewrite prior docs.  
> **Status:** Awaiting approval to begin Module 0 implementation.

---

## Validation Scope

Reviewed:

- `01-ARCHITECTURE.md`
- `02-DATABASE-ERD.md`
- `03-PRISMA-MODELS.md`
- `04-MODULES.md`
- `05-API-STRUCTURE.md`
- `06-ROADMAP.md`
- `07-PERMISSIONS-MATRIX.md`

---

## A. Missing Enterprise Features (ADD)

Add the following capabilities during the relevant existing modules (no new module renumbering required unless noted as Platform cross-cut in Module 0/Foundation hardening):

| ID | Addition | Implement with |
|---|---|---|
| E-01 | **Document number sequences** (`NumberSequence`: scope, prefix, nextValue) for all coded documents | Module 0 / shared platform |
| E-02 | **Idempotency store** (`IdempotencyKey`: key, userId, route, requestHash, responseSnapshot, createdAt) | Module 0 + inventory/finance posts |
| E-03 | **Transactional outbox** for email/notification dispatch after commit | Module 28 (bring forward from “phase 2”) |
| E-04 | **Stock Adjustment** document + posting path (enum already has `ADJUST`) | Module 15–23 |
| E-05 | **Stock Transfer** between warehouses (enum already has `TRANSFER`) | Module 15–23 |
| E-06 | **Import/Export job tracking** (`ImportJob` / `ExportJob`: status, errors, row counts) for house bulk import & large reports | Modules 7, 30 |
| E-07 | **Fiscal / period lock** (project or org period: open/closed) blocking inventory & finance posts in closed periods | Modules 17–26 |
| E-08 | **Retention release** workflow (release retained amounts after defects liability) | Module 25–26 |
| E-09 | **Partial payments** as first-class (multiple `Payment` rows; paid/outstanding computed) | Module 25–26 |
| E-10 | **Maker–checker / anti self-approval** policy (submitter ≠ approver unless override permission) | All workflow docs |
| E-11 | **Approval delegation** (temporary delegate for assignee/role) | Module 33 |
| E-12 | **Workflow escalation** (overdue tasks → escalate to role/manager; cron) | Modules 33 + hardening |
| E-13 | **Document comments / activity timeline** on IR, DPR, MR, Bills, MB | Cross-cutting UI + API |
| E-14 | **Signed upload flow** (request signature → upload → confirm attach) | Module 12, 29 |
| E-15 | **Session management** (list/revoke sessions; idle + absolute timeout) | Module 1–2 |
| E-16 | **MFA for privileged roles** (SUPER_ADMIN, FINANCE, ADH at minimum) | Module 1 + hardening |
| E-17 | **Password policy** (complexity, history, expiry optional, breach basics) | Module 1 |
| E-18 | **Global search API** (projects, houses, documents, codes) | Module 0 shell + later enrichment |
| E-19 | **Material reservation** on approved MR/DV (soft allocate against stock) | Modules 18–20 |
| E-20 | **Cost center tagging** on bills/budgets/consumption (architecture mentions cost centers; model/API missing) — additive fields/table only, no rename | Module 26 |
| E-21 | **Notification preferences** fully modeled + enforced (entity listed; wire end-to-end) | Module 28 |
| E-22 | **Feature flags** store (architecture mentions; implement simple `FeatureFlag`) | Module 0 |
| E-23 | **Data archival policy** for closed projects / old ledger & audit partitions | Phase 7 hardening |
| E-24 | **Print templates** metadata for DPR/WPR/Bill/GRN official prints | Module 30 |
| E-25 | **UoM standardization** (allowed units registry; conversion out of scope v1 but validate against registry) | Module 16 |
| E-26 | **Currency code** on Project / Bill / Payment (single-currency deploy OK; field required for enterprise) | Modules 5, 25–26 |
| E-27 | **Void/Cancel** actions for pre-post documents; **reversal docs only** after post | All document modules |
| E-28 | **Restore soft-deleted** masters (admin-only) | Admin APIs |
| E-29 | **ActivityDependency** fully wired (entity listed; enforce predecessor gates for IR/progress) | Module 11–12 |
| E-30 | **ActivitySchedule** API already listed — ensure model + CRUD completeness | Module 11 |
| E-31 | **Warehouse officer assignment** (which users may post for which warehouse) | Module 15 |
| E-32 | **Background jobs runner** (Vercel Cron + queue/outbox worker pattern) for reminders, escalations, exports | Phase 7 / Module 0 infra |
| E-33 | **DB connection pooling** requirement (PgBouncer / pooler) documented as deploy mandatory | Phase 7 |
| E-34 | **Read-optimized dashboard queries** (materialized views or nightly aggregates) | Module 31 |
| E-35 | **Audit retention & export** policy (immutable online N months + cold export) | Module 32 |

---

## B. Missing Database Indexes (ADD)

Add these indexes at migration time (do not remove existing ones):

| ID | Table | Index |
|---|---|---|
| I-01 | All coded docs | **Partial unique** on `(projectId, code)` / `(code)` **WHERE `deletedAt IS NULL`** |
| I-02 | `House` | `(projectId, status, deletedAt)`, `(projectId, blockId)`, `(houseTypeId)`, `(code)` |
| I-03 | `HouseActivity` | `(activityId)`, `(houseId, status)`, `(updatedAt)` |
| I-04 | `InspectionRequest` | `(assignedToId, status)`, `(requestedById, status)`, `(result, status)` |
| I-05 | `DailyProgressReport` | `(projectId, status)`, `(reportDate)` |
| I-06 | `WeeklyProgressReport` | `(projectId, status)`, `(weekEnd)` |
| I-07 | `Grn` / `MaterialIssue` / `MaterialReturn` / `MaterialConsumption` | `(warehouseId, status)`, `(postedAt)`, `(status, deletedAt)` |
| I-08 | `MaterialRequisition` / `DemandVoucher` | `(projectId, status, deletedAt)`, `(requestedById)` where applicable |
| I-09 | `InventoryLedger` | `(createdAt)`, `(projectId, materialId, createdAt)`; consider **BRIN(createdAt)** at scale |
| I-10 | `StockBalance` | `(materialId)`, `(quantity)` for low-stock scans |
| I-11 | `ContractorBill` | `(projectId, status, deletedAt)`, `(billDate)`, `(contractorId, billDate)` |
| I-12 | `Payment` | `(billId, status)`, `(paidAt)` |
| I-13 | `MeasurementBook` | `(projectId, contractorId, status)` |
| I-14 | `WorkflowTask` | `(status, dueAt)`, `(instanceId, status)` |
| I-15 | `WorkflowInstance` | `(documentType, currentStatus)` |
| I-16 | `Notification` | `(userId, createdAt DESC)` |
| I-17 | `Document` / `DocumentLink` | `(projectId, createdAt)`, `(folder)` |
| I-18 | `AuditLog` | `(action, createdAt)`, `(createdAt)` — partition-ready |
| I-19 | `User` | `(email)` already unique; add `(status, deletedAt)`, `(orgUnitId, status)` |
| I-20 | `ProjectMember` | `(userId)` |
| I-21 | `Session` | `(expires)` for cleanup jobs |
| I-22 | `IdempotencyKey` (new) | **UNIQUE(key)** + `(createdAt)` TTL cleanup |
| I-23 | `NumberSequence` (new) | **UNIQUE(scopeType, scopeId, documentType)** |
| I-24 | Soft-delete lists | Prefer filtered indexes `WHERE deletedAt IS NULL` on hot list paths |
| I-25 | `BoqHeader` | `(projectId, status, deletedAt)`, `(houseTypeId)` |
| I-26 | `Directive` | `(projectId, status)`, `(dueAt)` |
| I-27 | `EmployeeAssignment` / `ContractorAssignment` | `(employeeId/contractorId, status)` |

---

## C. Missing Relationships (ADD)

Keep all existing entities. Add missing FKs/relations only:

| ID | Addition |
|---|---|
| R-01 | `House.phaseId` → `Phase`, `House.sectorId` → `Sector` (fields exist; enforce Prisma relations + service integrity) |
| R-02 | `DemandVoucher.mrId` → `MaterialRequisition` |
| R-03 | `MaterialIssue.dvId` → `DemandVoucher` |
| R-04 | `MaterialReturn.issueId` → `MaterialIssue` |
| R-05 | Optional `MaterialConsumption.issueId` → `MaterialIssue` (trace issued → consumed) |
| R-06 | `MeasurementBook.contractorId` → `Contractor`, `projectId` → `Project` |
| R-07 | `Grn.projectId` → `Project`, `warehouseId` → `Warehouse` |
| R-08 | `DailyProgressReport` / lines → optional FKs to `House`, `Activity` already implied — enforce in Prisma |
| R-09 | `ActivityDependency` (`activityId`, `dependsOnActivityId`) fully related |
| R-10 | `BoqItemRevision` (listed in ERD) **or** confirm JSON-only `BoqRevision.snapshot` as sufficient — if JSON-only, document as accepted; if relational history desired, add table without renaming `BoqRevision` |
| R-11 | `WorkflowTask.assigneeId` → `User` |
| R-12 | `Notification.userId` → `User` |
| R-13 | `Payment.billId` → `ContractorBill` (exists) + optional `createdById` |
| R-14 | `DocumentLink` uniqueness `(documentId, entityType, entityId)` |
| R-15 | `Warehouse` ↔ officer users M2M or assignment table (additive) |
| R-16 | `StockAdjustment` / `StockTransfer` headers+lines → `Warehouse`, `Material`, ledger refs |
| R-17 | `ImportJob.projectId` → `Project`; `createdById` → `User` |
| R-18 | `CostCenter` optional FK on `BudgetLine`, `ContractorBillLine`, `McLine` |
| R-19 | `InspectionRequest.houseId` / `activityId` / users — ensure all FKs declared in Prisma |
| R-20 | `ContractorBill.mbId` → `MeasurementBook` |

---

## D. Missing APIs (ADD)

Additive endpoints under `/api/v1` (same conventions):

| ID | Endpoint | Purpose |
|---|---|---|
| A-01 | `POST .../:id/cancel` / `POST .../:id/void` | Pre-post cancellation for IR, DPR, WPR, MR, DV, GRN, Issue, Bill, MB |
| A-02 | `POST .../:id/submit\|approve\|reject` | Complete for MR, DV, BOQ, MB, Budget, Payment (not only IR/DPR/Bill) |
| A-03 | `POST /grns/:id/post`, `/material-issues/:id/post`, `/material-consumptions/:id/post`, `/material-returns/:id/post` | Explicit post (Issue/Consumption/Return posting must be first-class) |
| A-04 | `CRUD /stock-adjustments` + `POST /:id/post` | Stock adjustment |
| A-05 | `CRUD /stock-transfers` + `POST /:id/post` | Inter-warehouse transfer |
| A-06 | `POST /houses/:id/restore` (and selected masters) | Soft-delete restore |
| A-07 | `GET/POST /uploads/sign` + `POST /uploads/confirm` | Signed Cloudinary/S3 uploads |
| A-08 | `GET /search?q=` | Global search |
| A-09 | `GET /notifications/unread-count` | Already in API doc — ensure in architecture endpoint map parity |
| A-10 | `GET/PATCH /notification-preferences` | Preferences |
| A-11 | `GET /me/sessions` + `DELETE /me/sessions/:id` | Session revoke |
| A-12 | `POST /me/password` | Authenticated password change |
| A-13 | `POST /me/mfa/setup|verify|disable` | MFA |
| A-14 | `CRUD /workflow-definitions` (admin) | Manage transitions |
| A-15 | `GET /reports` | Report catalog |
| A-16 | `POST /{resource}/export` | List-level export (CSV/XLSX) in addition to report exports |
| A-17 | `GET /houses/:id/activities` + `PATCH /house-activities/:id` | Progress updates |
| A-18 | `POST /contractor-bills/:id/pay` vs `CRUD /payments` | Keep both; pay creates Payment; clarify no double path without idempotency |
| A-19 | `CRUD /retention-releases` + workflow actions | Retention release |
| A-20 | `POST /projects/:id/period-close` / `period-open` | Period lock |
| A-21 | `GET /health/deep` | DB + storage dependency checks |
| A-22 | `POST /inbox/:taskId/delegate` | Delegation |
| A-23 | `GET /audit-logs/export` | Audit export |
| A-24 | `CRUD /activity-schedules` | Listed in architecture — ensure implemented |
| A-25 | `POST /boq-headers/:id/approve` | BOQ approve action |
| A-26 | `GET /inventory/low-stock` | Low stock alert feed |
| A-27 | `POST /imports/:id/retry` + `GET /imports/:id` | Import job status |
| A-28 | `POST /documents/:id/link` / `DELETE link` | Manage document links |
| A-29 | `GET /dashboards/:key` already defined — add `GET /dashboards/:key/widgets/:widgetId` if widget-level refresh needed |
| A-30 | Comments: `GET/POST /{resource}/:id/comments` | Document timeline |

---

## E. Missing Reports (ADD)

Extend Module 30 report catalog:

| ID | Report |
|---|---|
| RP-01 | House completion by Phase / Sector / Block |
| RP-02 | BOQ vs Measured vs Billed variance |
| RP-03 | Material wastage (Issued − Consumed − Returned) |
| RP-04 | Warehouse-wise stock & valuation |
| RP-05 | GRN register |
| RP-06 | Material Issue register |
| RP-07 | Contractor performance (progress, IR fail rate, bill cycle time) |
| RP-08 | Retention register (held / released / outstanding) |
| RP-09 | Payment register & outstanding liabilities |
| RP-10 | Budget vs Commitment vs Actual |
| RP-11 | IR aging & first-pass yield |
| RP-12 | Workflow SLA / overdue approvals |
| RP-13 | DPR compliance calendar (missing days) |
| RP-14 | House-wise material cost |
| RP-15 | User access review (roles/permissions snapshot) |
| RP-16 | Audit activity summary |
| RP-17 | Low-stock & stock-out incidents |
| RP-18 | Advance/mobilization vs recovery (if advances used) |

---

## F. Missing Dashboard KPIs (ADD)

Additive KPIs on existing dashboards (no dashboard redesign):

### Executive
- Overdue workflow tasks (org-wide)
- Open retention liability
- Projects at risk (completion &lt; planned threshold)
- Approval aging P50/P90

### Project
- Houses with zero progress in N days
- Open IR &gt; SLA
- Missing DPR days (last 30)
- Activity predecessor blockers count

### Inventory
- Stock-out count (7/30 days)
- Reservation vs available
- GRN→Issue cycle time
- Wastage %

### Financial
- Bills aging buckets (0–30/31–60/61–90/90+)
- Outstanding payable
- Retention outstanding
- Budget utilization by cost center

### Construction
- First-pass IR yield
- Rework / reinspect rate
- Weighted progress vs baseline schedule (when schedules exist)
- Contractor-wise completion

---

## G. Missing Workflows (ADD)

| ID | Document | States / notes |
|---|---|---|
| W-01 | BOQ | Draft → Submit → Approve (reject/revise) |
| W-02 | MB | Draft → Submit → Approve |
| W-03 | MR / DV | Draft → Submit → Approve / Reject (explicit) |
| W-04 | Budget | Draft → Submit → Approve |
| W-05 | Payment | Draft → Submit → Approve → Posted |
| W-06 | Stock Adjustment / Transfer | Draft → Submit → Approve → Post |
| W-07 | Retention Release | Draft → Submit → Verify → Approve → Posted |
| W-08 | Directive | Draft → Published → Closed (+ acknowledgements) |
| W-09 | Period Close | Request → Approve |
| W-10 | Escalation path | Pending &gt; dueAt → escalate (system transition) |
| W-11 | Cancel/Void | From Draft/Submitted/Rejected (not from Posted) |
| W-12 | Anti self-approval | Enforced on Approve transitions |

---

## H. Missing Validations (ADD)

Enforce in Zod + services:

| ID | Rule |
|---|---|
| V-01 | Quantities &gt; 0; money ≥ 0; percentages 0–100 |
| V-02 | `endDate` ≥ `startDate`; WPR `weekEnd` ≥ `weekStart`; MB period valid |
| V-03 | Document must have ≥ 1 line to submit/post |
| V-04 | No duplicate `materialId` lines on same document (or merge policy) |
| V-05 | Cannot mutate POSTED docs; reverse via Return/Adjustment/Transfer only |
| V-06 | Issue qty ≤ available − reserved (unless `stock.override`) |
| V-07 | DV qty ≤ approved MR qty (+ tolerance) |
| V-08 | Return qty ≤ issued − previously returned |
| V-09 | Consumption qty ≤ issued − returned − prior consumption (when linked) |
| V-10 | Bill quantities ≤ approved MB (cumulative control) |
| V-11 | Payment sum ≤ bill netAmount |
| V-12 | Retention % 0–100; server recomputes amounts |
| V-13 | IR approve requires `result` ∈ PASS/FAIL/CONDITIONAL; FAIL requires reason |
| V-14 | Progress updates blocked if predecessor incomplete (`ActivityDependency`) |
| V-15 | House hierarchy consistency (block→sector→phase→project) |
| V-16 | Codes trimmed; uniqueness case-insensitive within scope |
| V-17 | MIME allowlist + max size on uploads; block executables |
| V-18 | Password complexity + not equal to last N passwords |
| V-19 | Optimistic `version` check on all post/approve mutations |
| V-20 | Period-open check before inventory/finance post |
| V-21 | Active contractor assignment required to create MB/Bill |
| V-22 | Soft-deleted masters cannot be referenced by new docs |
| V-23 | Submitter ≠ approver (unless `workflow.self_approve`) |
| V-24 | Project ARCHIVED → read-only |
| V-25 | Timezone: store UTC; project-local date rules for DPR `reportDate` |
| V-26 | Decimal scale: qty 3 dp, money 2 dp, unitCost 4 dp (server round half-up) |

---

## I. Missing Permissions (ADD)

Additive permission codes (same `{module}.{action}` format):

```
users.invite
sessions.manage
mfa.manage
workflow.manage
workflow.self_approve
workflow.delegate
boq.submit
mb.submit
mr.submit
dv.submit
budgets.submit
budgets.approve
payments.approve
grn.submit
issue.submit
consumption.submit
returns.submit
stock.adjust
stock.transfer
documents.upload
imports.manage
exports.manage
audit.export
directives.publish
directives.close
period.close
period.open
retention.manage
retention.approve
masters.restore
comments.manage
search.use
notifications.broadcast
warehouses.post  // warehouse-scoped posting
```

Role seed updates during Module 3 / UAT — do not remove existing permissions.

---

## J. Missing Audit Requirements (ADD)

| ID | Requirement |
|---|---|
| AU-01 | Audit **auth events**: login success/failure, logout, password reset, MFA challenges |
| AU-02 | Audit all **workflow transitions** with before/after status |
| AU-03 | Audit **permission/role changes** and user activate/deactivate |
| AU-04 | Audit **exports/downloads** (who exported which report) |
| AU-05 | Audit **document upload/delete/link** |
| AU-06 | Audit **period close/open**, retention release, stock override |
| AU-07 | Audit **failed critical posts** (insufficient stock, lock conflicts) with reason codes |
| AU-08 | Audit log **append-only**; no update/delete API; DB role denies DELETE |
| AU-09 | Retain online audit ≥ 12 months; export/archive thereafter |
| AU-10 | Include `requestId`, IP, userAgent on mutating audits |
| AU-11 | Settings/feature-flag changes audited |

---

## K. Missing Security Concerns (ADD)

| ID | Control |
|---|---|
| S-01 | MFA mandatory for privileged roles before production |
| S-02 | Account lockout after N failed logins; unlock by admin / time |
| S-03 | Idle + absolute session timeouts; revoke-all on password change |
| S-04 | Signed uploads only; never trust client-provided final URLs without confirm |
| S-05 | Server-side MIME sniffing + extension allowlist |
| S-06 | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy via Next headers |
| S-07 | CORS allowlist (no `*` with credentials) |
| S-08 | DB SSL required; least-privilege DB users (`app` vs `migrate`) |
| S-09 | Secret rotation runbook; no secrets in client bundles |
| S-10 | IDOR test suite per resource (project/contractor scope) |
| S-11 | Email enumeration-safe login/forgot responses |
| S-12 | Dependency scanning + image/base update policy in CI |
| S-13 | PII minimization in logs; redact passwords/tokens |
| S-14 | Rate-limit forgot-password & invite endpoints separately |
| S-15 | Prevent mass assignment (Zod strip unknown) |
| S-16 | Contractor isolation automated tests |
| S-17 | Admin actions optionally step-up auth (re-enter password / MFA) |
| S-18 | Backup encryption + restore drill evidence in Phase 7 |

---

## L. Missing Scalability Considerations (ADD)

| ID | Requirement |
|---|---|
| SC-01 | **PgBouncer / pooled** connections mandatory on Vercel serverless |
| SC-02 | Prefer **cursor pagination** for houses, ledger, audit (keep page/pageSize; add `cursor` optional) |
| SC-03 | **Partition** (or archive) `InventoryLedger` & `AuditLog` by month/quarter at scale |
| SC-04 | Dashboard KPIs from **aggregate tables/materialized views**, not live heavy joins |
| SC-05 | Bulk import in **chunks** with job progress; avoid single request &gt; serverless limit |
| SC-06 | Export &gt; threshold → async job + download link |
| SC-07 | Cache permission sets per session (short TTL) |
| SC-08 | Prisma query budgets; forbid unbounded `findMany` |
| SC-09 | Read replica optional for reports (Phase 7+) |
| SC-10 | `maxDuration` configured for heavy routes; move harder work to cron/queue |
| SC-11 | Closed-project **cold storage** / archive flag to shrink hot dataset |
| SC-12 | Load targets documented: e.g. 10k+ houses/project, 100+ concurrent users, ledger millions of rows |

---

## M. Missing Mobile UX Considerations (ADD)

Responsive web is in scope; add these requirements to Module 0 UX contract:

| ID | Requirement |
|---|---|
| M-01 | Breakpoint-specific **app shell**: sidebar → drawer; filters → bottom sheet |
| M-02 | Data tables degrade to **card lists** on small screens; horizontal scroll only when necessary |
| M-03 | Touch targets ≥ 44px; sticky primary CTA on long forms |
| M-04 | IR attachments: **camera capture** (`capture` attribute) + compress before upload |
| M-05 | Respect `prefers-reduced-motion` |
| M-06 | Offline/connectivity banner (read-only messaging; online-first retained) |
| M-07 | Project switcher usable on mobile (full-screen select) |
| M-08 | Safe-area insets for notched devices |
| M-09 | Avoid hover-only actions; every action available via tap menus |
| M-10 | Large form wizards for GRN/MR/Bill on mobile (stepper), desktop can stay single page |
| M-11 | Inbox and notifications optimized as primary mobile workflows for field roles |

---

## N. Missing Edge Cases (ADD)

| ID | Edge case | Expected handling |
|---|---|---|
| EC-01 | Double-click post / retry | Idempotency key returns same result |
| EC-02 | Concurrent stock posts | Optimistic lock / TX serialization; `OPTIMISTIC_LOCK` error |
| EC-03 | Partial issue against DV | Allowed; track remaining qty |
| EC-04 | Over-return / over-consume | Hard validation fail |
| EC-05 | Bill against unapproved MB | Reject |
| EC-06 | Approver == submitter | Reject unless `workflow.self_approve` |
| EC-07 | User deactivated with open tasks | Reassign / escalate; block new claims |
| EC-08 | Role removed mid-flight | Task remains but claim checks current perms |
| EC-09 | Project archived with drafts | Block submit/post; allow read |
| EC-10 | Soft-deleted material referenced by draft | Block post; force line fix |
| EC-11 | Import partial failure | Per-row errors; job FAILED/PARTIAL; no silent truncate |
| EC-12 | Upload OK, DB fail | Orphan cleanup job / confirm step prevents attach |
| EC-13 | Email send fails after commit | Outbox retry; do not roll back business TX |
| EC-14 | Workflow claim race | Unique claim TX; second user gets conflict |
| EC-15 | DST / timezone on DPR date | Project timezone date boundary rules |
| EC-16 | Payment exceeds outstanding | Reject |
| EC-17 | Retention release &gt; held | Reject |
| EC-18 | Zero-line submit | Reject |
| EC-19 | House reassignment across blocks | Disallow in v1 (or controlled admin move with audit) — **additive policy** |
| EC-20 | Contractor assignment ended | Block new MB/Bill; allow view historical |
| EC-21 | Ledger vs StockBalance drift | Reconcile report + admin repair tool (Phase 7) |
| EC-22 | Clock skew on idempotency TTL | Server time only |
| EC-23 | Mass notification storm | Rate-limit broadcasts; batch inserts |
| EC-24 | Concurrent BOQ revise | Version/revision number uniqueness conflict handled |

---

## O. Roadmap Additions (no restructure)

Append these exit criteria into Phase 7 (and Module 0 where noted) without changing module order:

1. Idempotency + outbox tables in Foundation.
2. MFA + session revoke before production cutover.
3. Cursor pagination on Houses, Ledger, Audit.
4. Pooler + backup/restore drill evidence.
5. Inventory concurrency + IDOR test suites green.
6. Report catalog includes §E list (MVP subset acceptable; remainder scheduled).
7. Mobile UX checklist (§M) signed off for field roles (Contractor Engineer, Site Supervisor, Store Officer).

---

## Scores

| Dimension | Score | Rationale |
|---|---|---|
| **1. Architecture Score** | **8.5 / 10** | Clean modular monolith, clear boundaries, solid domain coverage. Gaps are additive enterprise controls (outbox, period lock, MFA), not structural flaws. |
| **2. Scalability Score** | **7.5 / 10** | Sound indexing & ledger model; needs pooling, cursor pagination, aggregates, partition/archive plan for millions of ledger/audit rows. |
| **3. Security Score** | **7.5 / 10** | Strong RBAC/validation baseline; production needs MFA, session hardening, signed uploads, IDOR suite, lockout, audit of auth/export events. |
| **4. Performance Score** | **7.5 / 10** | Good denormalization (`projectId` on houses) and balance table; dashboards/reports need pre-aggregation; offset pagination risk at large offsets. |
| **5. Maintainability Score** | **9.0 / 10** | Feature folders, thin APIs, Zod sharing, module roadmap — excellent for long-term team delivery. |
| **6. Production Readiness Score** | **8.0 / 10** | Ready to **start implementation** with additions tracked; not “go-live ready” until Phase 7 hardening absorbs §A–N. |

---

## Final Recommendation

**The frozen architecture is approved as the implementation baseline.**

It is **ready for implementation of Module 0 (Foundation)** provided the additions in this document are treated as a **mandatory backlog** to be incorporated module-by-module (not a redesign).

### Explicit statement

**Production-ready architecture for development start: YES.**  
**Production go-live ready without implementing additions: NO** — complete Phase 7 + critical additions (idempotency, outbox, MFA for privileged roles, period lock, stock adjust/transfer, anti self-approval, signed uploads, pooling, cursor pagination on hot lists).

### How to use this document

- Do **not** rewrite `01`–`07`.
- During each module’s step 2–4 (schema/API design), pull applicable rows from this file.
- Track IDs (E-xx, I-xx, …) in sprint boards until closed.

---

## Approval

| Role | Decision | Date |
|---|---|---|
| Product Owner | Approve architecture + additions / Changes requested | |
| Tech Lead | Approve architecture + additions / Changes requested | |
| Domain Expert | Approve architecture + additions / Changes requested | |

**Next step after approval:** Begin Module 0 — Foundation (no domain modules until Module 0 exits).

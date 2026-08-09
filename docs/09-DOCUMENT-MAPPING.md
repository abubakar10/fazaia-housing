# Falcon Housing — Client Document Mapping (v1.0)

> **Architecture reference only.** No application code.  
> Maps every client construction / payment document to ERP modules, tables, workflows, APIs, reports, and dashboard KPIs.  
> Use this document as the implementation checklist for Modules 10–26 and the additive modules 11A / 24A / 24B.

---

## 1. Purpose

The client construction workflow is document-driven:

```
BOQ → Yard Stick → Activities → Measurement Book → RAR → Payment Voucher → Payment
         ↓
   Progress Sheet / DPR / WPR / Inspection Request
```

Payment **must not** be calculated from Activities alone. Yard Stick weight % and payment % drive commercial calculations. All totals are produced by the **Contract Payment Engine** (domain service), never typed manually into net-payable fields.

---

## 2. Master Mapping Table

| Client Document | ERP Module(s) | Primary Tables | Workflow | Reserved APIs | Reports | Dashboard KPIs |
|---|---|---|---|---|---|---|
| **Progress Sheet** | 11, 11A, 30, 31 | `ProgressSheet`, `ProgressSheetLine`, `HouseActivity`, `YardStickItem` | Generated (system) → optional Approve | `/progress-sheets` | Progress Sheet (PDF/XLSX) | Progress %, Delayed Houses, Delayed Activities |
| **Yard Stick** | **11A** | `YardStickTemplate`, `YardStickItem` | Draft → Active → Archived (versioned) | `/yardsticks` | Yard Stick register | — (master data) |
| **RAR** | **24A** | `RunningAccountReceipt`, `RARLine`, `RARDeduction`, `RARAdjustment`, `RARHistory` | Draft → Submitted → Verified → Approved → Paid / Cancelled | `/rars` | RAR Register, Pending Bills | RAR Pending, Payment Pending |
| **Voucher** | **24B** | `PaymentVoucher`, `PaymentVoucherLine` | Draft → Submitted → Verified → Approved → Paid / Cancelled | `/payment-vouchers` | Voucher Register | Voucher Pending, Net Payable |
| **Measurement Book** | 24 | `MeasurementBook`, `MbEntry` | Draft → Submit → Approve (+ multi-level workflow) | `/measurement-books` | MB register (existing) | MB backlog |
| **BOQ** | 10 | `BoqHeader`, `BoqItem`, revisions | Draft → Submit → Approve | `/boq-headers` | BOQ vs Measured variance | — |
| **Inspection Request** | 12 | `InspectionRequest`, attachments | Draft → Submit → Review → Approve/Reject | `/inspection-requests` | IR aging | IR backlog, first-pass yield |
| **DPR** | 13 | `DailyProgressReport`, `DprLine` | Draft → Submit → Approve | `/daily-progress-reports` | DPR compliance | DPR compliance |
| **WPR** | 14 | `WeeklyProgressReport`, `WprLine` | Draft → Submit → Approve | `/weekly-progress-reports` | WPR export | WPR trends |

---

## 3. Document Detail Cards

### 3.1 Progress Sheet

| Aspect | Specification |
|---|---|
| **ERP Module** | Generated from Modules 11 (Activities) + **11A** (Yard Stick); export via Module 30; KPIs on Module 31 |
| **Database Tables** | `ProgressSheet` (header: project/house/period), `ProgressSheetLine` (activity, yardStickItemId, plannedWeight, completedPct, earnedWeight) |
| **Generation chain** | Project → House → Activities → Yard Stick → Progress → Completion % |
| **Workflow** | System-generated snapshot; optional RE approve for locked period sheets |
| **APIs (reserved)** | `GET/POST /api/v1/progress-sheets`, `GET /api/v1/progress-sheets/:id`, `POST /api/v1/progress-sheets/:id/export` |
| **Reports** | Progress Sheet PDF/Excel; House Progress Summary; Activity Completion Summary |
| **Dashboard KPIs** | Progress %, Delayed Houses, Delayed Activities |

### 3.2 Yard Stick

| Aspect | Specification |
|---|---|
| **ERP Module** | **Module 11A — Yard Stick Management** |
| **Database Tables** | `YardStickTemplate`, `YardStickItem` |
| **Key fields (item)** | Activity (FK), Sequence, Weight %, Payment %, Measurement Unit, House Type, House Template, Version (on template), Effective Date, Active Status |
| **Integration** | Every `HouseTemplate` references **one** `YardStickTemplate` (`yardStickTemplateId`). Future `Activity` / `HouseActivity` inherit weight & payment % from Yard Stick items — **not** from ad-hoc activity fields alone. |
| **Workflow** | Template versioning: Draft → Active; revise creates new version; prior versions archived |
| **APIs (reserved)** | `CRUD /api/v1/yardsticks`, `CRUD /api/v1/yardsticks/:id/items`, `POST /api/v1/yardsticks/:id/revise` |
| **Reports** | Yard Stick template listing; weight/payment checksum (must total 100% where policy requires) |
| **Dashboard KPIs** | None (master). Used as input to Progress % and payment engine |

### 3.3 Running Account Receipt (RAR)

| Aspect | Specification |
|---|---|
| **ERP Module** | **Module 24A — Running Account Receipt** |
| **Database Tables** | `RunningAccountReceipt`, `RARLine`, `RARDeduction`, `RARAdjustment`, `RARHistory` |
| **Upstream** | Approved `MeasurementBook` (+ Yard Stick weights for payment %) |
| **Downstream** | `PaymentVoucher` → `Payment` |
| **Workflow** | Measurement Book → **RAR** → Approval → Payment Voucher → Payment |
| **Statuses** | `DRAFT`, `SUBMITTED`, `VERIFIED`, `APPROVED`, `PAID`, `CANCELLED` |
| **APIs (reserved)** | `CRUD /api/v1/rars`, lines/deductions/adjustments nested or sub-resources, `POST .../submit\|verify\|approve\|cancel`, history `GET .../history` |
| **Reports** | RAR Register, Pending Bills, Contractor Ledger (partial) |
| **Dashboard KPIs** | RAR Pending, Payment Pending (from approved unpaid RARs) |

### 3.4 Payment Voucher

| Aspect | Specification |
|---|---|
| **ERP Module** | **Module 24B — Payment Voucher** |
| **Database Tables** | `PaymentVoucher`, `PaymentVoucherLine` |
| **Supports** | RAR reference, Contractor, Taxes, Retention, Mobilization Recovery, Material Recovery, Water Charges, Transportation Charges, Loading/Unloading, Bank Charges, Other Deductions, **Net Payable** (server-calculated) |
| **Print** | Government-style printable voucher (Module 30 template) |
| **Workflow** | Created from Approved RAR → Draft → Submitted → Verified → Approved → Paid / Cancelled |
| **APIs (reserved)** | `CRUD /api/v1/payment-vouchers`, `POST .../submit\|verify\|approve\|cancel`, `GET .../print` |
| **Reports** | Voucher Register, Retention Register, Mobilization Recovery |
| **Dashboard KPIs** | Voucher Pending, Retention, Mobilization Advance, Recovery Amount |

### 3.5 Measurement Book

| Aspect | Specification |
|---|---|
| **ERP Module** | Module 24 |
| **Database Tables** | `MeasurementBook`, `MbEntry` |
| **Workflow** | Draft → Submit → Approve; configurable multi-level / amount-based approvals via Workflow engine |
| **APIs** | `/api/v1/measurement-books` (existing architecture) |
| **Reports** | MB register; feeds RAR |
| **Dashboard KPIs** | MB pending approval |

### 3.6 BOQ

| Aspect | Specification |
|---|---|
| **ERP Module** | Module 10 |
| **Database Tables** | `BoqHeader`, `BoqItem`, `BoqRevision`, `BoqItemRevision` |
| **Role in payment chain** | Source rates/quantities for MB entries; Payment Engine reads approved BOQ rates |
| **APIs** | `/api/v1/boq-headers` |
| **Reports** | BOQ vs Measured vs Billed variance |
| **Dashboard KPIs** | — |

### 3.7 Inspection Request

| Aspect | Specification |
|---|---|
| **ERP Module** | Module 12 |
| **Database Tables** | `InspectionRequest`, `InspectionAttachment` |
| **Workflow** | Draft → Submit → Review → Approve/Reject → (Reinspect) |
| **APIs** | `/api/v1/inspection-requests` |
| **Reports** | IR aging, first-pass yield |
| **Dashboard KPIs** | IR backlog |

### 3.8 DPR (Daily Progress Report)

| Aspect | Specification |
|---|---|
| **ERP Module** | Module 13 |
| **Database Tables** | `DailyProgressReport`, `DprLine` |
| **Workflow** | Draft → Submit → Approve |
| **APIs** | `/api/v1/daily-progress-reports` |
| **Reports** | DPR compliance |
| **Dashboard KPIs** | DPR compliance |

### 3.9 WPR (Weekly Progress Report)

| Aspect | Specification |
|---|---|
| **ERP Module** | Module 14 |
| **Database Tables** | `WeeklyProgressReport`, `WprLine` |
| **Workflow** | Draft → Submit → Approve |
| **APIs** | `/api/v1/weekly-progress-reports` |
| **Reports** | WPR PDF export |
| **Dashboard KPIs** | WPR trends |

---

## 4. Contract Payment Engine (domain service)

**Not a numbered UI module.** Lives under Commercial & Finance as `PaymentCalculationService` (and related calculators).

```
BOQ (rates)
  → Measurement Book (measured qty)
  → Yard Stick (weight % / payment %)
  → RAR (gross / deductions / adjustments)
  → Payment Voucher (taxes, retention, recoveries, charges)
  → Payment (posted amount)
```

**Rules:**

1. No manual net-payable entry — UI may display computed fields as read-only.
2. Activities alone **do not** determine payment; Yard Stick payment % is mandatory for RAR line valuation when policy = yard-stick-driven.
3. Idempotent recalculation on document edit while `DRAFT`.
4. Snapshots of calculated totals stored on `RARHistory` / voucher lines at submit/approve.

---

## 5. Construction Reports Catalog (Module 30 extensions)

| Report Key | Source modules | Formats |
|---|---|---|
| `progress-sheet` | 11, 11A, ProgressSheet | PDF, XLSX |
| `rar-register` | 24A | PDF, XLSX, CSV |
| `voucher-register` | 24B | PDF, XLSX, CSV |
| `contractor-ledger` | 24A, 24B, 25, 26 | PDF, XLSX |
| `house-progress-summary` | 7, 11, 11A | PDF, XLSX |
| `activity-completion-summary` | 11, 11A | PDF, XLSX |
| `material-consumption-summary` | 21, 23 | PDF, XLSX, CSV |
| `mobilization-recovery` | 24B | PDF, XLSX |
| `retention-register` | 24B, 25 | PDF, XLSX |
| `pending-bills` | 24A, 24B, 25 | PDF, XLSX, CSV |

---

## 6. Workflow Coverage (configurable)

| Document | Multi-level | Conditional | Amount-based |
|---|---|---|---|
| Measurement Book | Yes | Yes | Yes |
| RAR | Yes | Yes | Yes |
| Payment Voucher | Yes | Yes | Yes |
| Payment | Yes | Yes | Yes |

Uses existing `WorkflowDefinition` / `WorkflowTransition` / `WorkflowInstance` / `WorkflowTask` (Module 33 + platform). Additive config keys only — no redesign.

---

## 7. Dashboard Placeholders (Module 31)

Additive KPI cards (zero until modules ship):

| KPI | Feeds from |
|---|---|
| RAR Pending | RAR status ∈ Submitted/Verified |
| Payment Pending | Approved RAR / Voucher unpaid |
| Voucher Pending | Voucher status ∈ Submitted/Verified |
| Progress % | Progress Sheet / Yard Stick rollup |
| Recovery Amount | Voucher recovery lines |
| Retention | Retention outstanding |
| Mobilization Advance | Mobilization balances |
| Top Contractors | RAR/voucher volume |
| Delayed Houses | Progress vs plan |
| Delayed Activities | HouseActivity vs schedule |

---

## 8. Integration Points (completed modules — additive only)

| Completed module | Additive integration (docs only until built) |
|---|---|
| **Module 7 — Houses / Templates** | `HouseTemplate.yardStickTemplateId` → `YardStickTemplate` (nullable until 11A) |
| **Module 5 — Projects** | Dashboard placeholders for commercial KPIs |
| **Module 10 — BOQ** | Rates feed Payment Engine |
| **Module 11 — Activities** | Inherit weight/payment from Yard Stick items |
| **Module 24 — MB** | Upstream of RAR |
| **Module 25 — Contractor Billing** | May reference RAR; remains compatible; RAR+Voucher become preferred government document path |
| **Module 26 — Finance** | Payment posts from Approved Voucher; budgets unchanged |
| **Module 30/31** | Report keys + KPI placeholders above |

**Backward compatibility:** Existing `ContractorBill` / `Payment` models remain. RAR and Payment Voucher are **additive**. No breaking change to Modules 0–7 implemented code in this architecture pass.

---

## 9. Numbering Codes (suggested)

| Document | Prefix example |
|---|---|
| Yard Stick Template | `YST-` |
| RAR | `RAR-` |
| Payment Voucher | `PV-` |
| Progress Sheet | `PS-` |

Allocated via existing number-sequence service pattern.

---

## 10. Stop / Non-Goals (this doc)

- Does **not** implement Module 8 or any application code.
- Does **not** replace Activities, MB, or Contractor Bills.
- Does **not** redesign Clean Architecture folders — new features follow `src/features/{yardsticks|rars|payment-vouchers|progress-sheets}/`.

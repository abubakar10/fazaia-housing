# FAZIA Housing — Permissions Matrix (v1.0 Draft)

Permission codes are seeded and fully configurable via Role → Permission mapping.

Format: `{module}.{action}`

---

## 1. Permission Catalog (core)

### Platform
- `users.read` `users.create` `users.update` `users.deactivate` `users.reset_password`
- `roles.read` `roles.create` `roles.update` `roles.assign`
- `permissions.read`
- `org.read` `org.create` `org.update` `org.delete`
- `audit.read`
- `settings.manage`

### Projects & Structure
- `projects.read` `projects.create` `projects.update` `projects.archive` `projects.members`
- `phases.manage` `sectors.manage` `blocks.manage`
- `house_types.manage`
- `houses.read` `houses.create` `houses.update` `houses.import` `houses.status`

### Parties
- `contractors.read` `contractors.manage` `contractors.assign`
- `employees.read` `employees.manage` `employees.assign`

### Construction
- `boq.read` `boq.manage` `boq.revise` `boq.approve`
- `activities.read` `activities.manage`
- `ir.read` `ir.create` `ir.submit` `ir.review` `ir.approve`
- `dpr.read` `dpr.create` `dpr.submit` `dpr.approve`
- `wpr.read` `wpr.create` `wpr.submit` `wpr.approve`
- `mb.read` `mb.manage` `mb.approve`

### Inventory
- `warehouses.read` `warehouses.manage`
- `materials.read` `materials.manage`
- `grn.read` `grn.create` `grn.post`
- `mr.read` `mr.create` `mr.approve`
- `dv.read` `dv.create` `dv.approve`
- `issue.read` `issue.create` `issue.post`
- `consumption.read` `consumption.create` `consumption.post`
- `returns.read` `returns.create` `returns.post`
- `ledger.read`
- `stock.override` // allow issue below min / force adjust

### Finance
- `bills.read` `bills.create` `bills.submit` `bills.verify` `bills.approve`
- `payments.read` `payments.create` `payments.post`
- `budgets.read` `budgets.manage`

### Governance
- `directives.read` `directives.create` `directives.acknowledge`
- `documents.read` `documents.manage`
- `notifications.read`
- `inbox.read` `inbox.act`
- `reports.read` `reports.export`
- `dashboards.read`

---

## 2. Default Role Grants (summary)

| Role | Primary capabilities |
|---|---|
| **Super Admin** | All permissions |
| **ADH** | Org-wide read; project oversight; directives; dashboards; approve high-level |
| **AD Tech** | Technical masters (BOQ, activities, house types); reports |
| **Resident Engineer** | Project ops: houses, DPR/WPR approve, IR review, MB, contractor coord |
| **Quality Manager** | IR review/approve; quality reports |
| **Contractor** | Limited project read; IR create/submit; own bills draft/submit; DPR create |
| **Contractor Engineer** | Site execution: activities progress, IR, DPR lines |
| **Store Officer** | Warehouses, GRN, issue, returns, ledger, MR/DV fulfill |
| **Finance** | Bills verify/approve, payments, budgets, financial reports |
| **Site Supervisor** | DPR/WPR create, MR create, consumption, houses read/update progress |
| **Senior Management** | Dashboards, reports, directives read, audit read (no operational post) |

Exact cell-level matrix will be implemented as seed data in Module 3 and tuned during UAT.

---

## 3. Resource Scoping

Even with permission, data is filtered by:

1. **Project membership** (unless role has `projects.read` with global scope flag)
2. **Org unit** (optional hierarchical visibility)
3. **Contractor ownership** (contractor users only see own contractorId records)

Service layer applies `VisibilityContext { userId, roleCodes, projectIds, contractorId?, globalRead? }`.

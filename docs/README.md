# FAZIA Housing ERP — Architecture Package

> **FROZEN** — Approved. No architecture changes unless explicitly requested.

| Doc | Contents |
|---|---|
| [01-ARCHITECTURE.md](./01-ARCHITECTURE.md) | Analysis, clean architecture, folder structure, security, UX |
| [02-DATABASE-ERD.md](./02-DATABASE-ERD.md) | ERD, inventory ledger rules, indexing, entity inventory |
| [03-PRISMA-MODELS.md](./03-PRISMA-MODELS.md) | Full Prisma model designs |
| [04-MODULES.md](./04-MODULES.md) | Module-by-module specifications |
| [05-API-STRUCTURE.md](./05-API-STRUCTURE.md) | API conventions, envelopes, route map |
| [06-ROADMAP.md](./06-ROADMAP.md) | Phased delivery plan & exit criteria |
| [07-PERMISSIONS-MATRIX.md](./07-PERMISSIONS-MATRIX.md) | RBAC catalog & default roles |
| [08-ARCHITECTURE-VALIDATION-ADDITIONS.md](./08-ARCHITECTURE-VALIDATION-ADDITIONS.md) | Final validation: additive gaps only + scores |
| [09-DOCUMENT-MAPPING.md](./09-DOCUMENT-MAPPING.md) | Client document → ERP module / tables / workflow / API / reports / KPIs |

> **Architecture refinement (pre–Module 8):** Yard Stick (11A), RAR (24A), Payment Voucher (24B), Contract Payment Engine, Progress Sheets, construction reports, workflow/dashboard/API reservations — **docs only**. No application code.

## Implementation status

- **Module 0 — Foundation: COMPLETE (frozen)**
- **Module 1 — Authentication: COMPLETE (frozen)**
- **Module 2 — User Management: COMPLETE (frozen)**
- **Module 3 — Roles & Permissions (RBAC): COMPLETE (frozen)**
- **Module 4 — Organization Hierarchy: COMPLETE**
- **Module 5 — Project Management: COMPLETE**
- **Module 6 — Project Structure (Phases, Sectors & Blocks): COMPLETE**
- **Module 7 — House Types, Templates & Houses: COMPLETE** (refinement: relational template lines, house detail, import dry-run/rollback)
- Module 8+ — waiting for explicit approval

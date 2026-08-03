# FAZIA Housing — Construction Management ERP
## Software Architecture Document (v1.0)

> **Status:** AWAITING APPROVAL — No application code until this architecture is approved.  
> **Product:** Enterprise Construction Management ERP for residential housing programs  
> **Stack:** Next.js 15 · TypeScript · Prisma · PostgreSQL · TanStack · Shadcn · Vercel

---

## 1. Project Analysis

### 1.1 Problem Statement

Construction authorities and developers managing large residential schemes (thousands of houses across sectors/blocks) need a single system of record for:

- Organizational hierarchy and multi-project control
- Physical structure (Project → Phase → Sector → Block → House)
- Contractors, workforce, and BOQ-driven execution
- Quality inspections and progress reporting
- Store / inventory / material lifecycle
- Contractor measurement & billing
- Finance, directives, documents, and auditability

Spreadsheet-driven or fragmented tools fail under volume, concurrent workflows, and compliance requirements.

### 1.2 System Characteristics

| Characteristic | Decision |
|---|---|
| Scale | Thousands of houses, hundreds of concurrent users, multi-year projects |
| Tenancy | Single organization (authority/developer) with hierarchical OUs; multi-project |
| Consistency | Strong consistency for inventory, billing, approvals (PostgreSQL transactions) |
| Auditability | Soft deletes + immutable audit log + history tables for financial/inventory mutations |
| Deployment | Vercel (Next.js App Router) + managed PostgreSQL |
| Offline | Not required in v1 (online-first; progressive enhancement later) |

### 1.3 Domain Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        IDENTITY & ACCESS                                 │
│  Auth · Users · Roles · Permissions · Org Hierarchy · Sessions          │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                     PROJECT STRUCTURE (Master Data)                      │
│  Projects · Phases · Sectors · Blocks · House Types · Houses            │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                        WORKFORCE & PARTIES                               │
│  Contractors · Employees · Assignments · Contacts                       │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONSTRUCTION EXECUTION                               │
│  BOQ · Activities · IR · DPR · WPR · Measurement Book                   │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                     MATERIALS & STORE                                    │
│  Items · Warehouse · GRN · Requisition · Demand · Issue ·               │
│  Consumption · Returns · Ledger                                         │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                     COMMERCIAL & FINANCE                                 │
│  Contractor Bills · Payments · Budgets · Cost Centers                   │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                     GOVERNANCE & COLLABORATION                           │
│  HQ Directives · Notifications · Documents · Workflow Inbox · Reports  │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                     PLATFORM CROSS-CUTTING                               │
│  Audit · History · Feature Flags · Rate Limit · File Storage            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Non-Goals (v1)

- Full double-entry accounting ERP (integrate later; Finance module is construction-finance focused)
- Mobile native apps (responsive web first)
- GIS / BIM / CAD integration (map pins optional later)
- Multi-tenant SaaS marketplace (single-org enterprise)

---

## 2. Software Architecture

### 2.1 Architectural Style

**Feature-based Clean Architecture** inside a Next.js 15 monolith (modular monolith).

```
┌──────────────────────────────────────────────────────────────────┐
│  Presentation (App Router pages, layouts, UI components)         │
├──────────────────────────────────────────────────────────────────┤
│  Application / Use Cases (services, workflows, DTOs)             │
├──────────────────────────────────────────────────────────────────┤
│  Domain (entities, policies, permission rules, domain errors)    │
├──────────────────────────────────────────────────────────────────┤
│  Infrastructure (Prisma repos, Cloudinary, Resend, Redis/KV)     │
└──────────────────────────────────────────────────────────────────┘
```

**Rules (enforced by convention + lint boundaries):**

1. UI never calls Prisma directly.
2. API route handlers are thin: parse → authorize → call service → map response.
3. Business rules live in `services/` / `domain/`.
4. Persistence lives in `repositories/` only.
5. Validation schemas (Zod) are shared between client forms and server.

### 2.2 Request Lifecycle

```
Browser
  → Next.js Server Component / Client Component
  → TanStack Query (client data) OR Server Action / Route Handler
  → Middleware (session, CSRF, rate limit headers)
  → API Adapter (validate Zod, resolve actor)
  → Authorization Policy (RBAC + resource scope)
  → Application Service (transaction boundary)
  → Repository (Prisma)
  → PostgreSQL
  → Audit writer (side effect in same TX where critical)
```

### 2.3 Key Cross-Cutting Patterns

| Pattern | Usage |
|---|---|
| Soft delete | `deletedAt` on all mutable business tables |
| Actor stamping | `createdById`, `updatedById` |
| Optimistic concurrency | `version` Int on inventory, bills, MB entries |
| Unit of Work | Prisma `$transaction` in services |
| Outbox (phase 2) | Reliable email/notification dispatch |
| CQRS-lite | Read models / dashboard aggregations via SQL views or dedicated query services |
| Workflow engine | Status + transitions + inbox tasks (configurable per document type) |

### 2.4 AuthN / AuthZ

- **AuthN:** NextAuth (Auth.js) v5 — credentials + optional magic link (Resend); JWT/session strategy suitable for Vercel.
- **AuthZ:** RBAC with permission codes (`module.action.resource`), role ↔ permission M2M, optional user permission overrides.
- **Scopes:** Org unit + Project membership constrain data visibility (row-level via service filters, not Prisma middleware alone).

### 2.5 Deployment Architecture

```
                    ┌─────────────┐
   Users ──────────►│   Vercel    │  Next.js 15 (SSR/RSC + Route Handlers)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        PostgreSQL    Cloudinary     Resend
        (Neon/Supabase/ (media)      (email)
         RDS)
              ▲
              │  Prisma Migrate / Prisma Client
```

Optional later: Upstash Redis for rate limiting & realtime pub/sub; Vercel Cron for reminders.

---

## 3. Folder Structure

```
fazia-housing/
├── apps/                          # reserved if we later split; v1 uses root Next app
├── prisma/
│   ├── schema/
│   │   ├── schema.prisma          # generator + datasource
│   │   ├── auth.prisma
│   │   ├── org.prisma
│   │   ├── project.prisma
│   │   ├── workforce.prisma
│   │   ├── construction.prisma
│   │   ├── inventory.prisma
│   │   ├── finance.prisma
│   │   ├── governance.prisma
│   │   └── platform.prisma
│   ├── migrations/
│   └── seed/
│       ├── roles.ts
│       ├── permissions.ts
│       └── demo.ts                  # opt-in, not production
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # shell: sidebar, topbar, inbox badge
│   │   │   ├── page.tsx             # executive dashboard
│   │   │   ├── projects/
│   │   │   ├── organization/
│   │   │   ├── contractors/
│   │   │   ├── employees/
│   │   │   ├── boq/
│   │   │   ├── activities/
│   │   │   ├── inspections/
│   │   │   ├── progress/
│   │   │   │   ├── daily/
│   │   │   │   └── weekly/
│   │   │   ├── store/
│   │   │   ├── materials/
│   │   │   ├── billing/
│   │   │   ├── finance/
│   │   │   ├── directives/
│   │   │   ├── documents/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   ├── inbox/               # workflow inbox
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   ├── roles/
│   │   │   │   └── audit/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── v1/
│   │   │   │   ├── projects/
│   │   │   │   ├── ...              # versioned REST-ish JSON APIs
│   │   │   │   └── health/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # shadcn primitives
│   │   ├── forms/                   # RHF wrappers
│   │   ├── data-table/              # TanStack Table shell
│   │   ├── charts/
│   │   ├── feedback/                # empty, error, skeleton, toasts
│   │   └── layout/                  # sidebar, command palette, etc.
│   ├── features/                    # FEATURE MODULES (primary code home)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── rbac/
│   │   ├── organization/
│   │   ├── projects/
│   │   ├── contractors/
│   │   ├── employees/
│   │   ├── boq/
│   │   ├── activities/
│   │   ├── inspections/
│   │   ├── progress/
│   │   ├── store/
│   │   ├── materials/
│   │   ├── billing/
│   │   ├── finance/
│   │   ├── directives/
│   │   ├── documents/
│   │   ├── notifications/
│   │   ├── workflow/
│   │   ├── reports/
│   │   ├── dashboard/
│   │   └── audit/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── schemas/             # Zod
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── types/
│   │       └── index.ts             # public barrel
│   ├── domain/
│   │   ├── errors/
│   │   ├── policies/                # permission + transition policies
│   │   └── value-objects/
│   ├── infrastructure/
│   │   ├── db/                      # prisma client singleton
│   │   ├── storage/                 # cloudinary
│   │   ├── email/                   # resend
│   │   ├── cache/
│   │   └── logger/
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   ├── export/                  # pdf/excel/csv
│   │   └── http/
│   ├── stores/                      # zustand (UI state only)
│   ├── styles/
│   └── types/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

### 3.1 Feature Module Contract

Every feature folder exposes:

- `schemas/` — Zod input/output
- `repositories/` — Prisma access
- `services/` — use cases + transactions
- `hooks/` — TanStack Query keys & mutations
- `components/` — feature UI
- `types/` — domain/DTO types
- `index.ts` — public API of the feature

---

## 4. API Structure

### 4.1 Conventions

| Item | Standard |
|---|---|
| Base path | `/api/v1` |
| Style | Resource-oriented JSON REST |
| IDs | UUID in path |
| Errors | RFC 7807-inspired `{ code, message, details?, requestId }` |
| Pagination | `?page=&pageSize=&sort=&order=&q=` + filter query params |
| Auth | Session cookie / bearer (server) |
| Idempotency | `Idempotency-Key` header on POST for inventory & finance mutations |
| Versioning | URL `/v1`; breaking changes → `/v2` |

### 4.2 Endpoint Map (by module)

```
AUTH
  POST   /api/auth/*                    # Auth.js
  GET    /api/v1/me
  PATCH  /api/v1/me

USERS & RBAC
  CRUD   /api/v1/users
  POST   /api/v1/users/:id/activate|deactivate|reset-password
  CRUD   /api/v1/roles
  PUT    /api/v1/roles/:id/permissions
  GET    /api/v1/permissions

ORGANIZATION
  CRUD   /api/v1/org-units
  GET    /api/v1/org-units/tree

PROJECT STRUCTURE
  CRUD   /api/v1/projects
  CRUD   /api/v1/projects/:id/phases
  CRUD   /api/v1/phases/:id/sectors
  CRUD   /api/v1/sectors/:id/blocks
  CRUD   /api/v1/house-types
  CRUD   /api/v1/houses
  POST   /api/v1/houses/bulk-import

CONTRACTORS / EMPLOYEES
  CRUD   /api/v1/contractors
  CRUD   /api/v1/contractor-assignments
  CRUD   /api/v1/employees
  CRUD   /api/v1/employee-assignments

BOQ & ACTIVITIES
  CRUD   /api/v1/boq-headers
  CRUD   /api/v1/boq-headers/:id/items
  POST   /api/v1/boq-headers/:id/revise
  CRUD   /api/v1/activities
  CRUD   /api/v1/activity-schedules

INSPECTIONS
  CRUD   /api/v1/inspection-requests
  POST   /api/v1/inspection-requests/:id/submit|approve|reject|reinspect

PROGRESS
  CRUD   /api/v1/daily-progress-reports
  POST   /api/v1/daily-progress-reports/:id/submit|approve
  CRUD   /api/v1/weekly-progress-reports
  POST   /api/v1/weekly-progress-reports/:id/submit|approve

STORE / MATERIALS
  CRUD   /api/v1/warehouses
  CRUD   /api/v1/material-categories
  CRUD   /api/v1/materials
  CRUD   /api/v1/grns
  POST   /api/v1/grns/:id/post
  CRUD   /api/v1/material-requisitions
  CRUD   /api/v1/demand-vouchers
  CRUD   /api/v1/material-issues
  CRUD   /api/v1/material-consumptions
  CRUD   /api/v1/material-returns
  GET    /api/v1/inventory/ledger
  GET    /api/v1/inventory/balances

BILLING / MB / FINANCE
  CRUD   /api/v1/measurement-books
  CRUD   /api/v1/measurement-books/:id/entries
  CRUD   /api/v1/contractor-bills
  POST   /api/v1/contractor-bills/:id/submit|verify|approve|pay
  CRUD   /api/v1/budgets
  CRUD   /api/v1/payments

GOVERNANCE
  CRUD   /api/v1/directives
  POST   /api/v1/directives/:id/acknowledge
  CRUD   /api/v1/documents
  GET    /api/v1/notifications
  PATCH  /api/v1/notifications/:id/read
  POST   /api/v1/notifications/read-all
  GET    /api/v1/inbox
  POST   /api/v1/inbox/:taskId/claim|complete|reject
  GET    /api/v1/audit-logs
  GET    /api/v1/reports/:reportKey
  POST   /api/v1/reports/:reportKey/export
  GET    /api/v1/dashboards/:key
```

### 4.3 Service Layer Example Contract

```ts
// features/materials/services/grn.service.ts
export class GrnService {
  constructor(private deps: { grnRepo, stockRepo, audit, notifier }) {}

  async createDraft(actor, input): Promise<GrnDto> { ... }
  async post(actor, grnId, idempotencyKey): Promise<GrnDto> {
    // TX: validate → increase stock → ledger rows → status POSTED → audit → notify
  }
}
```

---

## 5. UX / Design System Principles

### 5.1 Visual Direction

- Light theme, premium SaaS (Linear / Vercel / Stripe / Notion cues)
- CSS variables for brand tokens; expressive typography (not Inter default stack)
- Soft surfaces, large whitespace, subtle borders, restrained glass on overlays
- Motion: page enter, table row presence, dialog/overlay — Framer Motion (2–3 intentional patterns)

### 5.2 App Shell

- Collapsible sidebar (module nav, permission-filtered)
- Top bar: project context switcher, global search, notifications, inbox, user menu
- Content: page header (title, description, primary actions) + toolbar (search/filter/export) + table/canvas

### 5.3 Page Contract (every list/detail)

Search · Filters · Sort · Pagination · Export · Actions · Loading skeletons · Empty · Error · Confirm dialogs · Toast success

### 5.4 Design Tokens (initial)

```
--background, --foreground, --muted, --border
--primary, --primary-foreground
--success, --warning, --danger
--radius-sm|md|lg
--font-sans, --font-display
--shadow-soft
```

Brand palette finalized in Module 0 (Foundation) with stakeholder approval — avoid purple/cream AI defaults.

---

## 6. Security Architecture

| Control | Implementation |
|---|---|
| Authentication | Auth.js, hashed passwords (argon2/bcrypt), session rotation |
| Authorization | Permission checks in services; UI hides unauthorized actions |
| Validation | Zod on every mutation |
| CSRF | Auth.js + SameSite cookies; double-submit for custom posts if needed |
| XSS | React escaping; CSP headers; sanitize rich text |
| SQL Injection | Prisma parameterized queries only |
| Rate limiting | Middleware + Upstash (or in-memory fallback for single instance) |
| Secure headers | `helmet`-equivalent via `next.config` headers |
| Secrets | Env vars; never commit |
| Audit | Immutable `AuditLog` for auth + mutations |
| Soft delete | No hard delete of business records in app layer |

---

## 7. Quality Gates

- TypeScript strict
- ESLint + import boundaries (features cannot deep-import other features' internals)
- Unit tests for services (inventory posting, bill approval, RBAC)
- Integration tests for critical APIs
- Playwright smoke for login + one happy path per major module
- Prisma migrate in CI
- Preview deployments on Vercel per PR

---

## 8. Approval Checklist

- [ ] Architecture style accepted (modular monolith + clean layers)
- [ ] Folder structure accepted
- [ ] API conventions accepted
- [ ] Security model accepted
- [ ] UX page contract accepted
- [ ] Database ERD & Prisma models accepted (see companion docs)
- [ ] Roadmap & module order accepted

**Next step after approval:** Module 0 — Foundation (scaffold, design tokens, auth shell, Prisma base).

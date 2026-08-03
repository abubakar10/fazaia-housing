# FAZIA Housing ERP

Enterprise Construction Management ERP for residential housing programs.

**Current milestone:** Module 0 — Foundation (complete)

Architecture documents in [`docs/`](./docs) are **frozen**. Do not change them unless explicitly requested.

---

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Shadcn UI
- Prisma · PostgreSQL
- React Hook Form · Zod · TanStack Query · TanStack Table · Zustand · Framer Motion · Lucide

---

## Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable`)
- PostgreSQL 14+ (local or managed)

---

## Local setup

```bash
# Install
pnpm install

# Environment
cp .env.example .env
# Set DATABASE_URL

# Prisma client
pnpm db:generate

# Apply schema (when database is available)
pnpm db:migrate

# Dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Auth shell placeholder: [http://localhost:3000/login](http://localhost:3000/login)

Health API: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

---

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate` | Run migrations (dev) |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:validate` | Validate Prisma schema |

---

## Module 0 deliverables

- Feature-based folder structure
- Design tokens + light premium theme
- Authenticated app shell (sidebar/topbar/mobile drawer) — auth deferred to Module 1
- Unauthenticated auth layout + login placeholder
- Shared Form fields, DataTable, PageHeader, Empty/Error/Skeleton/Confirm/ErrorBoundary
- Prisma multi-file schema baselines: `User`, Auth.js stubs, `AuditLog`, `IdempotencyKey`, `NumberSequence`, `FeatureFlag`
- `/api/v1/health` + structured logging
- Secure headers via `next.config.ts`
- Vercel-ready Next.js app + `.env.example`

---

## What is intentionally NOT built yet

- Authentication (Module 1)
- Users / RBAC / Organization
- Any construction, store, finance, or governance business modules

Await approval before starting Module 1.

---

## Deploy (Vercel)

1. Import repository in Vercel
2. Set `DATABASE_URL` (and later Module 1 secrets)
3. Build command: `pnpm db:generate && pnpm build`
4. Install command: `pnpm install`

Use a pooled Postgres URL on serverless (Neon/Supabase pooler / PgBouncer).

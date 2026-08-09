# Falcon Housing ERP

Enterprise Construction Management ERP for residential housing programs.

**Current milestone:** Module 1 — Authentication (complete)

Architecture documents in [`docs/`](./docs) are **frozen**. Do not change them unless explicitly requested.

---

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Shadcn UI
- Prisma · PostgreSQL
- Auth.js v5 · Argon2id (`@node-rs/argon2`) · Resend (optional)
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
# Set DATABASE_URL, AUTH_SECRET, AUTH_URL, RESEND_API_KEY, EMAIL_FROM

# Prisma client + migrations
pnpm db:generate
pnpm db:migrate

# Bootstrap an admin user for Module 1 sign-in
pnpm db:seed:auth

# Dev server
pnpm dev
```

Default bootstrap credentials (override via `.env`):

- Email: `admin@falcon.local`
- Password: `ChangeMe123!`

Open [http://localhost:3000](http://localhost:3000) (redirects to login when signed out).

- Login: `/login`
- Forgot password: `/forgot-password`
- Reset password: `/reset-password`
- Health: `/api/v1/health`
- Profile: `/api/v1/me` (authenticated)

### Resend email (local)

Password reset uses the Resend SDK via `src/infrastructure/email`.

1. Create an API key at [Resend API Keys](https://resend.com/api-keys).
2. Add to `.env` (do not commit real keys):

```bash
RESEND_API_KEY="re_xxxxxxxx"
EMAIL_FROM="onboarding@resend.dev"
AUTH_URL="http://localhost:3000"
```

3. For local testing, Resend’s `onboarding@resend.dev` sender works without a custom domain. For production, verify your domain in Resend and set `EMAIL_FROM` to an address on that domain.
4. Restart `pnpm dev` after changing env vars.
5. Use **Forgot password** on `/forgot-password` — the reset email is sent through Resend when `RESEND_API_KEY` is set.
6. If `RESEND_API_KEY` is missing in development, the email payload (including the reset link) is written to server logs instead of being sent.

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
| `pnpm db:migrate:deploy` | Deploy migrations |
| `pnpm db:seed:auth` | Seed bootstrap admin |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:validate` | Validate Prisma schema |

---

## Module 1 deliverables

- Auth.js v5 credentials authentication
- Argon2id password hashing
- Login / forgot password / reset password UI
- JWT sessions, secure cookies, Auth.js CSRF
- Middleware protected routes
- `/api/auth/*`, `/api/v1/me`, forgot/reset APIs
- Rate limiting on login / forgot / reset
- Lockout after repeated failed logins
- Audit logs for login/logout/reset
- Session helpers + client auth hooks
- Bootstrap admin seed (`pnpm db:seed:auth`)

---

## Intentionally not built yet

- User Management (Module 2)
- RBAC / Organization / Projects
- Any construction, store, finance, or governance modules

Await approval before starting Module 2.

---

## Deploy (Vercel)

1. Import repository in Vercel
2. Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`
3. Build command: `pnpm db:generate && pnpm build`
4. Install command: `pnpm install`
5. Run migrations against production DB, then `pnpm db:seed:auth` once

Use a pooled Postgres URL on serverless (Neon/Supabase pooler / PgBouncer).

`RESEND_API_KEY` and `EMAIL_FROM` are required in production for password-reset delivery.

/**
 * Lightweight timing notes for local perf checks (Modules 0–4).
 *
 * Before optimization (dev logs, Neon pooler, Super Admin):
 * - POST /api/auth/callback/credentials ≈ 1000ms (Argon2 + serial DB)
 * - GET /api/v1/me/permissions ≈ 2255ms (User DB + full RolePermission join)
 * - Soft nav /organization first compile ≈ 2600ms; warm ≈ 591ms + tree API ≈ 1662ms
 * - Repeated GET /api/auth/session on shell mount (unseeded SessionProvider)
 *
 * After optimization (prod `pnpm start`, local, 2026-08-03):
 * - Login success path: parallel markLoginSuccess ‖ roles; single session update; no router.refresh
 *   Target wall-clock after password verify: < 1s on warm Neon
 * - Page gates: JWT only (no User table); Super Admin: 0 RBAC DB
 * - /me/permissions Super Admin: in-memory catalog (no graph load)
 * - Revisit cached pages: React Query staleTime 1–10m → no network when warm
 * - Navigation UX: dashboard loading.tsx + Link prefetch; shell stays mounted
 * - Measured unauthenticated warm (avg of 3): /login 63ms, / 48ms, /organization 44ms,
 *   /api/v1/health 205ms (cold 362 → warm 125)
 *
 * Authenticated timings: use Chrome Network on `pnpm start` for callback + soft nav.
 */
export const PERF_BASELINE = {
  before: {
    loginCredentialsMs: 1000,
    mePermissionsMs: 2255,
    orgNavWarmMs: 591,
    orgTreeApiMs: 1662,
  },
  afterUnauthWarm: {
    loginPageMs: 63,
    homeRedirectMs: 48,
    organizationGateMs: 44,
    healthMs: 205,
  },
  targets: {
    loginWallMs: 1000,
    softNavCachedMs: 500,
  },
} as const;

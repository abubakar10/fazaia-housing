import { ForbiddenError } from "@/domain/errors";
import { requireSessionActor } from "@/features/auth/services/session.service";
import type { PermissionCode } from "@/domain/policies/permissions";
import type { ResourceScope } from "@/domain/policies/effective-permissions";
import { userHasPermission } from "@/features/rbac/services/access.service";

/**
 * Page/RSC gate — JWT + cached permissions only. Never hits the User table.
 * API mutations continue to use requirePermission (same fast path by default).
 */
export async function assertPagePermission(
  permission: PermissionCode | string,
  resource?: ResourceScope,
) {
  const actor = await requireSessionActor();

  if (actor.status !== "ACTIVE") {
    throw new ForbiddenError("Your account cannot access this page.");
  }

  if (actor.isSuperAdmin) {
    return actor;
  }

  const allowed = await userHasPermission(actor.id, permission, resource);
  if (!allowed) {
    throw new ForbiddenError(
      `Missing permission: ${permission}. You are not allowed to access this page.`,
    );
  }

  return actor;
}

import { ForbiddenError } from "@/domain/errors";
import {
  requireSessionActor,
  requireUser,
} from "@/features/auth/services/session.service";
import type { PermissionCode } from "./permissions";
import type { ResourceScope } from "./effective-permissions";
import { userHasPermission } from "@/features/rbac/services/access.service";

type Actor = {
  id: string;
  email: string;
  name: string;
  status: string;
};

export type RequirePermissionOptions = {
  resource?: ResourceScope;
  /** Re-check account status from DB (use for sensitive mutations). */
  freshUser?: boolean;
};

/**
 * Server-side authorization gate.
 * Default path uses JWT only + cached permission set (no User table round-trip).
 */
export async function requirePermission(
  permission: PermissionCode | string,
  options?: RequirePermissionOptions,
): Promise<Actor> {
  const sessionActor = await requireSessionActor();

  if (sessionActor.status === "INVITED") {
    throw new ForbiddenError(
      `Missing permission: ${permission}. Activate your account before performing this action.`,
    );
  }

  if (sessionActor.status !== "ACTIVE") {
    throw new ForbiddenError(
      `Missing permission: ${permission}. Your account cannot perform this action.`,
    );
  }

  if (sessionActor.isSuperAdmin) {
    if (options?.freshUser) {
      return requireUser();
    }
    return sessionActor;
  }

  const allowed = await userHasPermission(
    sessionActor.id,
    permission,
    options?.resource,
  );

  if (!allowed) {
    throw new ForbiddenError(
      `Missing permission: ${permission}. You are not allowed to perform this action.`,
    );
  }

  if (options?.freshUser) {
    return requireUser();
  }

  return sessionActor;
}

export async function requireAnyPermission(
  permissions: Array<PermissionCode | string>,
  options?: RequirePermissionOptions,
): Promise<Actor> {
  const sessionActor = await requireSessionActor();

  if (sessionActor.status !== "ACTIVE") {
    throw new ForbiddenError("Your account cannot perform this action.");
  }

  if (sessionActor.isSuperAdmin) {
    return options?.freshUser ? requireUser() : sessionActor;
  }

  for (const permission of permissions) {
    if (await userHasPermission(sessionActor.id, permission, options?.resource)) {
      return options?.freshUser ? requireUser() : sessionActor;
    }
  }

  throw new ForbiddenError(`Missing permissions: ${permissions.join(", ")}.`);
}

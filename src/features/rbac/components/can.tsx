"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useMyPermissionsQuery } from "../hooks/use-rbac";

type CanProps = {
  permission?: string | string[];
  role?: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function usePermissions() {
  const { data: session, status } = useSession();
  const sessionReady = status !== "loading";
  const query = useMyPermissionsQuery({
    enabled: status === "authenticated",
  });
  const jwtSuperAdmin = Boolean(session?.user?.isSuperAdmin);
  const jwtRoleCodes = session?.user?.roleCodes ?? [];
  const permissions = new Set(query.data?.permissions ?? []);
  const roleCodes = new Set(query.data?.roleCodes ?? jwtRoleCodes);
  const isSuperAdmin = query.data?.isSuperAdmin ?? jwtSuperAdmin;

  // Super Admin can render immediately from JWT.
  // Everyone else waits for the permission catalog once the session is known.
  const permissionsReady =
    isSuperAdmin ||
    (sessionReady && status !== "authenticated") ||
    query.isSuccess ||
    query.isError;

  return {
    ...query,
    isLoading:
      !sessionReady ||
      (status === "authenticated" &&
        !isSuperAdmin &&
        query.isLoading &&
        !permissionsReady),
    permissionsReady,
    permissions,
    roleCodes,
    isSuperAdmin,
    globalRead: query.data?.globalRead ?? Boolean(session?.user?.globalRead),
    can: (code: string | string[]) => {
      if (isSuperAdmin) return true;
      if (!query.data) return false;
      const codes = Array.isArray(code) ? code : [code];
      return codes.some((c) => permissions.has(c));
    },
    hasRole: (role: string | string[]) => {
      const roles = Array.isArray(role) ? role : [role];
      return roles.some((r) => roleCodes.has(r));
    },
  };
}

/** Client-side UI guard. Never rely on this alone — services enforce AuthZ. */
export function Can({ permission, role, fallback = null, children }: CanProps) {
  const { can, hasRole, isLoading, isSuperAdmin } = usePermissions();

  if (isLoading && !isSuperAdmin) return null;

  const allowedPermission = permission ? can(permission) : true;
  const allowedRole = role ? hasRole(role) : true;

  if (!allowedPermission || !allowedRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

import { describe, expect, it } from "vitest";
import {
  calculateEffectivePermissions,
  canAccessResource,
  type VisibilityContext,
} from "@/domain/policies/effective-permissions";
import {
  ALL_PERMISSION_CODES,
  PERMISSIONS,
  SYSTEM_ROLE_CODES,
} from "@/domain/policies/permissions";
import { SEED_ROLES } from "@/domain/policies/role-grants";

describe("permissions catalog", () => {
  it("includes platform and additive codes", () => {
    expect(PERMISSIONS.USERS_READ).toBe("users.read");
    expect(PERMISSIONS.ROLES_ASSIGN).toBe("roles.assign");
    expect(ALL_PERMISSION_CODES).toContain("users.invite");
    expect(ALL_PERMISSION_CODES).toContain("workflow.self_approve");
    expect(ALL_PERMISSION_CODES).toContain("stock.adjust");
  });

  it("has unique permission codes", () => {
    expect(new Set(ALL_PERMISSION_CODES).size).toBe(ALL_PERMISSION_CODES.length);
  });
});

describe("seed roles", () => {
  it("includes SUPER_ADMIN with all permissions", () => {
    const superAdmin = SEED_ROLES.find(
      (r) => r.code === SYSTEM_ROLE_CODES.SUPER_ADMIN,
    );
    expect(superAdmin?.permissions).toBe("*");
    expect(superAdmin?.globalRead).toBe(true);
    expect(SEED_ROLES).toHaveLength(11);
  });
});

describe("calculateEffectivePermissions", () => {
  it("unions role grants", () => {
    const result = calculateEffectivePermissions({
      rolePermissionCodes: ["users.read", "roles.read"],
      overrides: [],
    });
    expect(result.has("users.read")).toBe(true);
    expect(result.has("roles.read")).toBe(true);
  });

  it("DENY overrides ALLOW and role grants", () => {
    const result = calculateEffectivePermissions({
      rolePermissionCodes: ["users.read", "users.update"],
      overrides: [
        { code: "users.invite", effect: "ALLOW", scopeType: "GLOBAL", orgUnitId: null, projectId: null },
        { code: "users.update", effect: "DENY", scopeType: "GLOBAL", orgUnitId: null, projectId: null },
      ],
    });
    expect(result.has("users.invite")).toBe(true);
    expect(result.has("users.update")).toBe(false);
    expect(result.has("users.read")).toBe(true);
  });

  it("applies project-scoped DENY only for matching project", () => {
    const projectA = "11111111-1111-1111-1111-111111111111";
    const projectB = "22222222-2222-2222-2222-222222222222";
    const base = {
      rolePermissionCodes: ["houses.update"],
      overrides: [
        {
          code: "houses.update",
          effect: "DENY" as const,
          scopeType: "PROJECT" as const,
          orgUnitId: null,
          projectId: projectA,
        },
      ],
    };

    const denied = calculateEffectivePermissions({
      ...base,
      resource: { projectId: projectA },
    });
    const allowed = calculateEffectivePermissions({
      ...base,
      resource: { projectId: projectB },
    });

    expect(denied.has("houses.update")).toBe(false);
    expect(allowed.has("houses.update")).toBe(true);
  });

  it("gives super admin all permissions", () => {
    const result = calculateEffectivePermissions({
      rolePermissionCodes: [],
      overrides: [
        {
          code: "users.read",
          effect: "DENY",
          scopeType: "GLOBAL",
          orgUnitId: null,
          projectId: null,
        },
      ],
      isSuperAdmin: true,
      allPermissionCodes: ALL_PERMISSION_CODES,
    });
    expect(result.size).toBe(ALL_PERMISSION_CODES.length);
    expect(result.has("users.read")).toBe(true);
  });
});

describe("canAccessResource", () => {
  const base: VisibilityContext = {
    userId: "u1",
    roleCodes: ["SITE_SUPERVISOR"],
    permissions: new Set(["houses.read"]),
    projectIds: ["p1"],
    orgUnitIds: ["o1"],
    contractorId: null,
    globalRead: false,
    isSuperAdmin: false,
  };

  it("allows globalRead / super admin anywhere", () => {
    expect(
      canAccessResource({ ...base, globalRead: true }, { projectId: "other" }),
    ).toBe(true);
    expect(
      canAccessResource({ ...base, isSuperAdmin: true }, { orgUnitId: "x" }),
    ).toBe(true);
  });

  it("requires membership for scoped resources", () => {
    expect(canAccessResource(base, { projectId: "p1" })).toBe(true);
    expect(canAccessResource(base, { projectId: "p2" })).toBe(false);
    expect(canAccessResource(base, { orgUnitId: "o1" })).toBe(true);
    expect(canAccessResource(base, { orgUnitId: "o2" })).toBe(false);
  });
});

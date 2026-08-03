import { describe, expect, it } from "vitest";
import {
  createRoleSchema,
  setUserRolesSchema,
  userPermissionOverrideSchema,
} from "@/features/rbac/schemas/rbac.schemas";

describe("rbac schemas", () => {
  it("accepts valid create role payload", () => {
    const parsed = createRoleSchema.parse({
      code: "CUSTOM_AUDITOR",
      name: "Custom Auditor",
      description: "Read-only audit role",
      permissionCodes: ["audit.read"],
    });
    expect(parsed.code).toBe("CUSTOM_AUDITOR");
    expect(parsed.globalRead).toBe(false);
  });

  it("rejects invalid role codes", () => {
    expect(() =>
      createRoleSchema.parse({ code: "bad-code", name: "Bad" }),
    ).toThrow();
  });

  it("requires projectId for PROJECT-scoped role assignment", () => {
    const result = setUserRolesSchema.safeParse({
      assignments: [{ roleId: "11111111-1111-1111-1111-111111111111", scopeType: "PROJECT" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts GLOBAL user permission override", () => {
    const parsed = userPermissionOverrideSchema.parse({
      permissionCode: "users.update",
      effect: "DENY",
    });
    expect(parsed.scopeType).toBe("GLOBAL");
  });
});

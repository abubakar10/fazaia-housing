import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/db", () => ({
  prisma: {},
}));

vi.mock("../repositories/rbac.repository", () => ({
  loadAccessGraph: vi.fn(),
}));

import { loadAccessGraph } from "../repositories/rbac.repository";
import {
  invalidateUserPermissionCache,
  resolveEffectivePermissionCodes,
  userHasPermission,
} from "../services/access.service";
import { ALL_PERMISSION_CODES } from "@/domain/policies/permissions";

const loadAccessGraphMock = vi.mocked(loadAccessGraph);

describe("access.service integration", () => {
  beforeEach(() => {
    invalidateUserPermissionCache();
    loadAccessGraphMock.mockReset();
  });

  it("resolves SUPER_ADMIN to all permissions", async () => {
    loadAccessGraphMock.mockResolvedValue({
      user: {
        id: "u1",
        orgUnitId: null,
        status: "ACTIVE",
        contractorUser: null,
      },
      userRoles: [
        {
          id: "ur1",
          userId: "u1",
          roleId: "r1",
          scopeType: "GLOBAL",
          orgUnitId: null,
          projectId: null,
          assignedAt: new Date(),
          assignedBy: null,
          role: {
            id: "r1",
            code: "SUPER_ADMIN",
            name: "Super Admin",
            description: null,
            isSystem: true,
            globalRead: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            permissions: [],
          },
        },
      ],
      overrides: [],
    } as never);

    const permissions = await resolveEffectivePermissionCodes("u1");
    expect(permissions.size).toBe(ALL_PERMISSION_CODES.length);
    expect(await userHasPermission("u1", "roles.assign")).toBe(true);
  });

  it("applies DENY override against role grants", async () => {
    loadAccessGraphMock.mockResolvedValue({
      user: {
        id: "u2",
        orgUnitId: null,
        status: "ACTIVE",
        contractorUser: null,
      },
      userRoles: [
        {
          id: "ur2",
          userId: "u2",
          roleId: "r2",
          scopeType: "GLOBAL",
          orgUnitId: null,
          projectId: null,
          assignedAt: new Date(),
          assignedBy: null,
          role: {
            id: "r2",
            code: "FINANCE",
            name: "Finance",
            description: null,
            isSystem: true,
            globalRead: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            permissions: [
              {
                roleId: "r2",
                permissionId: "p1",
                permission: {
                  id: "p1",
                  code: "bills.approve",
                  module: "bills",
                  action: "approve",
                  description: null,
                  createdAt: new Date(),
                },
              },
              {
                roleId: "r2",
                permissionId: "p2",
                permission: {
                  id: "p2",
                  code: "payments.create",
                  module: "payments",
                  action: "create",
                  description: null,
                  createdAt: new Date(),
                },
              },
            ],
          },
        },
      ],
      overrides: [
        {
          id: "up1",
          userId: "u2",
          permissionId: "p1",
          effect: "DENY",
          scopeType: "GLOBAL",
          orgUnitId: null,
          projectId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: null,
          permission: {
            id: "p1",
            code: "bills.approve",
            module: "bills",
            action: "approve",
            description: null,
            createdAt: new Date(),
          },
        },
      ],
    } as never);

    expect(await userHasPermission("u2", "bills.approve")).toBe(false);
    expect(await userHasPermission("u2", "payments.create")).toBe(true);
  });
});

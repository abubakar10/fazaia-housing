import { z } from "zod";

export const permissionScopeSchema = z.enum([
  "GLOBAL",
  "ORGANIZATION",
  "PROJECT",
]);

export const permissionEffectSchema = z.enum(["ALLOW", "DENY"]);

export const listRolesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
});

export const listPermissionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().trim().max(200).optional().default(""),
  module: z.string().trim().max(80).optional(),
});

export const createRoleSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[A-Z][A-Z0-9_]*$/, "Use UPPER_SNAKE_CASE codes"),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  globalRead: z.boolean().optional().default(false),
  permissionCodes: z.array(z.string().min(3).max(120)).optional().default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  globalRead: z.boolean().optional(),
});

export const setRolePermissionsSchema = z.object({
  permissionCodes: z.array(z.string().min(3).max(120)),
});

export const userRoleAssignmentSchema = z
  .object({
    roleId: z.string().uuid(),
    scopeType: permissionScopeSchema.default("GLOBAL"),
    orgUnitId: z.string().uuid().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.scopeType === "ORGANIZATION" && !value.orgUnitId) {
      ctx.addIssue({
        code: "custom",
        message: "orgUnitId is required for ORGANIZATION scope",
        path: ["orgUnitId"],
      });
    }
    if (value.scopeType === "PROJECT" && !value.projectId) {
      ctx.addIssue({
        code: "custom",
        message: "projectId is required for PROJECT scope",
        path: ["projectId"],
      });
    }
  });

export const setUserRolesSchema = z.object({
  assignments: z.array(userRoleAssignmentSchema),
});

export const userPermissionOverrideSchema = z
  .object({
    permissionCode: z.string().min(3).max(120),
    effect: permissionEffectSchema,
    scopeType: permissionScopeSchema.default("GLOBAL"),
    orgUnitId: z.string().uuid().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.scopeType === "ORGANIZATION" && !value.orgUnitId) {
      ctx.addIssue({
        code: "custom",
        message: "orgUnitId is required for ORGANIZATION scope",
        path: ["orgUnitId"],
      });
    }
    if (value.scopeType === "PROJECT" && !value.projectId) {
      ctx.addIssue({
        code: "custom",
        message: "projectId is required for PROJECT scope",
        path: ["projectId"],
      });
    }
  });

export const setUserPermissionOverridesSchema = z.object({
  overrides: z.array(userPermissionOverrideSchema),
});

export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
export type ListPermissionsQuery = z.infer<typeof listPermissionsQuerySchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;
export type SetUserRolesInput = z.infer<typeof setUserRolesSchema>;
export type SetUserPermissionOverridesInput = z.infer<
  typeof setUserPermissionOverridesSchema
>;

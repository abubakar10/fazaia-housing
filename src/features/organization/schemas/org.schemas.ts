import { z } from "zod";

export const orgUnitTypeSchema = z.enum([
  "HQ",
  "REGION",
  "DIVISION",
  "SITE",
  "OFFICE",
  "STORE",
  "FINANCE",
  "OTHER",
]);

export const orgUnitStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const listOrgUnitsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  type: orgUnitTypeSchema.optional(),
  status: orgUnitStatusSchema.optional(),
  parentId: z.union([z.string().uuid(), z.literal("root")]).optional(),
  sort: z.enum(["name", "code", "type", "status", "createdAt", "sortOrder"]).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const createOrgUnitSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[A-Z0-9][A-Z0-9_-]*$/i, "Use letters, numbers, underscore, or hyphen")
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2).max(160),
  type: orgUnitTypeSchema,
  status: orgUnitStatusSchema.optional().default("ACTIVE"),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
});

export const updateOrgUnitSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[A-Z0-9][A-Z0-9_-]*$/i, "Use letters, numbers, underscore, or hyphen")
    .transform((v) => v.toUpperCase())
    .optional(),
  name: z.string().trim().min(2).max(160).optional(),
  type: orgUnitTypeSchema.optional(),
  status: orgUnitStatusSchema.optional(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});

export const assignOrgUsersSchema = z.object({
  userIds: z.array(z.string().uuid()),
});

export type ListOrgUnitsQuery = z.infer<typeof listOrgUnitsQuerySchema>;
export type CreateOrgUnitInput = z.infer<typeof createOrgUnitSchema>;
export type UpdateOrgUnitInput = z.infer<typeof updateOrgUnitSchema>;
export type AssignOrgUsersInput = z.infer<typeof assignOrgUsersSchema>;

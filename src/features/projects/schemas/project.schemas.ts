import { z } from "zod";

export const projectStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
]);

export const projectTypeSchema = z.enum([
  "RESIDENTIAL",
  "COMMERCIAL",
  "MIXED_USE",
  "INFRASTRUCTURE",
  "RENOVATION",
  "OTHER",
]);

export const projectPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .max(2048)
  .optional()
  .nullable();

const gpsLatitude = z.coerce
  .number()
  .min(-90)
  .max(90)
  .optional()
  .nullable();

const gpsLongitude = z.coerce
  .number()
  .min(-180)
  .max(180)
  .optional()
  .nullable();

const fiscalYear = z.coerce
  .number()
  .int()
  .min(2000)
  .max(2100)
  .optional()
  .nullable();

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  status: projectStatusSchema.optional(),
  orgUnitId: z.string().uuid().optional(),
  sort: z
    .enum(["name", "code", "status", "startDate", "createdAt", "updatedAt"])
    .default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  includeArchived: z.coerce.boolean().optional().default(false),
});

export const listProjectMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  status: z.enum(["ACTIVE", "INACTIVE", "INVITED", "LOCKED"]).optional(),
  roleId: z.string().uuid().optional(),
  sort: z.enum(["createdAt", "name", "email"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const listProjectActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const projectSettingsFields = {
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(500).optional().nullable(),
  projectType: projectTypeSchema.optional(),
  projectPriority: projectPrioritySchema.optional(),
  clientOwner: z.string().trim().max(200).optional().nullable(),
  consultant: z.string().trim().max(200).optional().nullable(),
  mainContractorId: z.string().uuid().optional().nullable(),
  fiscalYear,
  gpsLatitude,
  gpsLongitude,
  logoUrl: optionalUrl,
  internalNotes: z.string().trim().max(10000).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  expectedEndDate: z.coerce.date().optional().nullable(),
  actualEndDate: z.coerce.date().optional().nullable(),
  orgUnitId: z.string().uuid().optional().nullable(),
  projectManagerId: z.string().uuid().optional().nullable(),
  currencyCode: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Z]{3}$/)
    .optional(),
  timezone: z.string().trim().min(2).max(64).optional(),
  defaultWarehouseId: z.string().uuid().optional().nullable(),
};

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(200),
  status: projectStatusSchema.optional().default("DRAFT"),
  ...projectSettingsFields,
  currencyCode: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Z]{3}$/)
    .optional()
    .default("PKR"),
  timezone: z.string().trim().min(2).max(64).optional().default("Asia/Karachi"),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  status: projectStatusSchema.optional(),
  ...projectSettingsFields,
});

export const setProjectMembersSchema = z.object({
  members: z
    .array(
      z.object({
        userId: z.string().uuid(),
        employeeId: z.string().uuid().optional().nullable(),
        contractorId: z.string().uuid().optional().nullable(),
        roleId: z.string().uuid().optional().nullable(),
        roleHint: z.string().trim().max(120).optional().nullable(),
      }),
    )
    .max(500),
});

export const setProjectContextSchema = z.object({
  projectId: z.string().uuid().nullable(),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type ListProjectMembersQuery = z.infer<typeof listProjectMembersQuerySchema>;
export type ListProjectActivityQuery = z.infer<typeof listProjectActivityQuerySchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SetProjectMembersInput = z.infer<typeof setProjectMembersSchema>;
export type SetProjectContextInput = z.infer<typeof setProjectContextSchema>;

import { z } from "zod";

export const structureStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

const codeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Z0-9][A-Z0-9_-]*$/i, "Use letters, numbers, underscore, or hyphen")
  .transform((v) => v.toUpperCase());

const optionalCodeSchema = codeSchema.optional().nullable();


export const listPhasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  projectId: z.string().uuid(),
  status: structureStatusSchema.optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
  sort: z.enum(["name", "code", "sortOrder", "status", "createdAt", "updatedAt"]).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const listSectorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  projectId: z.string().uuid().optional(),
  phaseId: z.string().uuid().optional(),
  status: structureStatusSchema.optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
  sort: z.enum(["name", "code", "sortOrder", "status", "createdAt", "updatedAt"]).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
}).refine((v) => !!v.projectId || !!v.phaseId, {
  message: "projectId or phaseId is required",
});

export const listBlocksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  projectId: z.string().uuid().optional(),
  phaseId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  status: structureStatusSchema.optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
  sort: z.enum(["name", "code", "sortOrder", "status", "createdAt", "updatedAt"]).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
}).refine((v) => !!v.projectId || !!v.sectorId || !!v.phaseId, {
  message: "projectId, phaseId, or sectorId is required",
});

export const createPhaseSchema = z.object({
  projectId: z.string().uuid(),
  code: optionalCodeSchema,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  status: structureStatusSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export const updatePhaseSchema = z.object({
  code: codeSchema.optional(),
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: structureStatusSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  version: z.coerce.number().int().min(1).optional(),
});

export const createSectorSchema = z.object({
  phaseId: z.string().uuid(),
  code: optionalCodeSchema,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  status: structureStatusSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

export const updateSectorSchema = z.object({
  code: codeSchema.optional(),
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: structureStatusSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  phaseId: z.string().uuid().optional(),
  version: z.coerce.number().int().min(1).optional(),
});

export const createBlockSchema = z.object({
  sectorId: z.string().uuid(),
  code: optionalCodeSchema,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  status: structureStatusSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

export const updateBlockSchema = z.object({
  code: codeSchema.optional(),
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: structureStatusSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  sectorId: z.string().uuid().optional(),
  version: z.coerce.number().int().min(1).optional(),
});

export const bulkStructureActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    items: z.array(z.record(z.string(), z.unknown())).min(1).max(200),
  }),
  z.object({
    action: z.literal("archive"),
    ids: z.array(z.string().uuid()).min(1).max(200),
  }),
  z.object({
    action: z.literal("restore"),
    ids: z.array(z.string().uuid()).min(1).max(200),
  }),
  z.object({
    action: z.literal("delete"),
    ids: z.array(z.string().uuid()).min(1).max(200),
  }),
]);

export const bulkCreatePhasesSchema = z.object({
  projectId: z.string().uuid(),
  items: z
    .array(
      z.object({
        code: optionalCodeSchema,
        name: z.string().trim().min(2).max(200),
        description: z.string().trim().max(2000).optional().nullable(),
        sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
      }),
    )
    .min(1)
    .max(200),
});

export const bulkCreateSectorsSchema = z.object({
  phaseId: z.string().uuid(),
  items: z
    .array(
      z.object({
        code: optionalCodeSchema,
        name: z.string().trim().min(2).max(200),
        description: z.string().trim().max(2000).optional().nullable(),
        sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
      }),
    )
    .min(1)
    .max(200),
});

export const bulkCreateBlocksSchema = z.object({
  sectorId: z.string().uuid(),
  items: z
    .array(
      z.object({
        code: optionalCodeSchema,
        name: z.string().trim().min(2).max(200),
        description: z.string().trim().max(2000).optional().nullable(),
        sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
      }),
    )
    .min(1)
    .max(200),
});

export type ListPhasesQuery = z.infer<typeof listPhasesQuerySchema>;
export type ListSectorsQuery = z.infer<typeof listSectorsQuerySchema>;
export type ListBlocksQuery = z.infer<typeof listBlocksQuerySchema>;
export type CreatePhaseInput = z.infer<typeof createPhaseSchema>;
export type UpdatePhaseInput = z.infer<typeof updatePhaseSchema>;
export type CreateSectorInput = z.infer<typeof createSectorSchema>;
export type UpdateSectorInput = z.infer<typeof updateSectorSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type BulkStructureActionInput = z.infer<typeof bulkStructureActionSchema>;
export type BulkCreatePhasesInput = z.infer<typeof bulkCreatePhasesSchema>;
export type BulkCreateSectorsInput = z.infer<typeof bulkCreateSectorsSchema>;
export type BulkCreateBlocksInput = z.infer<typeof bulkCreateBlocksSchema>;

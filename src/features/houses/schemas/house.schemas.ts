import { z } from "zod";

export const houseTypeStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);
export const houseTypeCategorySchema = z.enum([
  "RESIDENTIAL",
  "COMMERCIAL",
  "MIXED",
  "OTHER",
]);
export const houseTemplateStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export const houseStatusSchema = z.enum([
  "PLANNING",
  "ALLOCATED",
  "UNDER_CONSTRUCTION",
  "INSPECTION",
  "COMPLETED",
  "DELIVERED",
  "ARCHIVED",
]);

const codeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Z0-9][A-Z0-9_-]*$/i, "Use letters, numbers, underscore, or hyphen")
  .transform((v) => v.toUpperCase());

const optionalCodeSchema = codeSchema.optional().nullable();
const optionalDecimal = z.coerce.number().min(0).max(1_000_000_000).optional().nullable();
const optionalInt = z.coerce.number().int().min(0).max(1000).optional().nullable();
const quantitySchema = z.coerce.number().min(0).max(1_000_000_000).default(1);
const sortOrderSchema = z.coerce.number().int().min(0).max(1_000_000).default(0);

export const templateActivityInputSchema = z.object({
  code: z.string().trim().max(64).optional().nullable(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  quantity: quantitySchema,
  unit: z.string().trim().max(32).optional().nullable(),
  estimatedDurationDays: optionalInt,
  sortOrder: sortOrderSchema,
});

export const templateBoqInputSchema = z.object({
  code: z.string().trim().max(64).optional().nullable(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  quantity: quantitySchema,
  unit: z.string().trim().max(32).optional().nullable(),
  unitRate: optionalDecimal,
  sortOrder: sortOrderSchema,
});

export const templateMaterialInputSchema = z.object({
  code: z.string().trim().max(64).optional().nullable(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  quantity: quantitySchema,
  unit: z.string().trim().max(32).optional().nullable(),
  sortOrder: sortOrderSchema,
});

export const listHouseTypesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  projectId: z.string().uuid().optional(),
  includeGlobal: z.coerce.boolean().optional().default(true),
  status: houseTypeStatusSchema.optional(),
  category: houseTypeCategorySchema.optional(),
  sort: z.enum(["name", "code", "category", "status", "createdAt", "updatedAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const createHouseTypeSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  code: optionalCodeSchema,
  name: z.string().trim().min(2).max(200),
  category: houseTypeCategorySchema.optional(),
  coveredArea: optionalDecimal,
  plotSize: optionalDecimal,
  bedrooms: optionalInt,
  bathrooms: optionalInt,
  floors: optionalInt,
  drawingNumber: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: houseTypeStatusSchema.optional(),
  defaultTemplateId: z.string().uuid().optional().nullable(),
});

export const updateHouseTypeSchema = createHouseTypeSchema
  .omit({ projectId: true })
  .partial()
  .extend({
    code: codeSchema.optional(),
    name: z.string().trim().min(2).max(200).optional(),
  });

export const listHouseTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  houseTypeId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  status: houseTemplateStatusSchema.optional(),
  sort: z.enum(["name", "code", "version", "status", "createdAt"]).default("version"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const createHouseTemplateSchema = z.object({
  houseTypeId: z.string().uuid(),
  projectId: z.string().uuid().optional().nullable(),
  code: optionalCodeSchema,
  name: z.string().trim().min(2).max(200),
  status: houseTemplateStatusSchema.optional(),
  estimatedDurationDays: optionalInt,
  estimatedCost: optionalDecimal,
  isDefault: z.boolean().optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  activities: z.array(templateActivityInputSchema).max(500).optional(),
  boqItems: z.array(templateBoqInputSchema).max(500).optional(),
  materials: z.array(templateMaterialInputSchema).max(500).optional(),
});

export const updateHouseTemplateSchema = z.object({
  code: codeSchema.optional(),
  name: z.string().trim().min(2).max(200).optional(),
  status: houseTemplateStatusSchema.optional(),
  estimatedDurationDays: optionalInt,
  estimatedCost: optionalDecimal,
  isDefault: z.boolean().optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  activities: z.array(templateActivityInputSchema).max(500).optional(),
  boqItems: z.array(templateBoqInputSchema).max(500).optional(),
  materials: z.array(templateMaterialInputSchema).max(500).optional(),
});

export const reviseHouseTemplateSchema = z.object({
  revisionNote: z.string().trim().max(1000).optional().nullable(),
  name: z.string().trim().min(2).max(200).optional(),
  estimatedDurationDays: optionalInt,
  estimatedCost: optionalDecimal,
  activate: z.boolean().optional().default(false),
  activities: z.array(templateActivityInputSchema).max(500).optional(),
  boqItems: z.array(templateBoqInputSchema).max(500).optional(),
  materials: z.array(templateMaterialInputSchema).max(500).optional(),
});

export const listHousesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  projectId: z.string().uuid(),
  phaseId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  blockId: z.string().uuid().optional(),
  houseTypeId: z.string().uuid().optional(),
  houseTemplateId: z.string().uuid().optional(),
  status: houseStatusSchema.optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
  sort: z
    .enum(["code", "plotNo", "status", "createdAt", "updatedAt", "progressPct"])
    .default("code"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const createHouseSchema = z.object({
  projectId: z.string().uuid(),
  phaseId: z.string().uuid(),
  sectorId: z.string().uuid(),
  blockId: z.string().uuid(),
  houseTypeId: z.string().uuid(),
  houseTemplateId: z.string().uuid().optional().nullable(),
  code: optionalCodeSchema,
  plotNo: z.string().trim().max(100).optional().nullable(),
  status: houseStatusSchema.optional(),
  gpsLatitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  gpsLongitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  ownerName: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(10000).optional().nullable(),
});

export const updateHouseSchema = z.object({
  phaseId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  blockId: z.string().uuid().optional(),
  houseTypeId: z.string().uuid().optional(),
  houseTemplateId: z.string().uuid().optional().nullable(),
  code: codeSchema.optional(),
  plotNo: z.string().trim().max(100).optional().nullable(),
  status: houseStatusSchema.optional(),
  gpsLatitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  gpsLongitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  ownerName: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(10000).optional().nullable(),
  version: z.coerce.number().int().min(1).optional(),
  statusNote: z.string().trim().max(1000).optional().nullable(),
});

export const changeHouseStatusSchema = z.object({
  status: houseStatusSchema,
  note: z.string().trim().max(1000).optional().nullable(),
});

export const bulkHouseIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

export const houseImportRowSchema = z.object({
  code: z.string().trim().max(64).optional().nullable(),
  plotNo: z.string().trim().max(100).optional().nullable(),
  phaseCode: z.string().trim().min(1).max(64),
  sectorCode: z.string().trim().min(1).max(64),
  blockCode: z.string().trim().min(1).max(64),
  houseTypeCode: z.string().trim().min(1).max(64),
  houseTemplateCode: z.string().trim().max(64).optional().nullable(),
  status: houseStatusSchema.optional(),
  ownerName: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  gpsLatitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  gpsLongitude: z.coerce.number().min(-180).max(180).optional().nullable(),
});

export const houseImportPreviewSchema = z.object({
  projectId: z.string().uuid(),
  rows: z.array(houseImportRowSchema).min(1).max(5000),
  dryRun: z.boolean().optional().default(true),
});

export const houseImportCommitSchema = z.object({
  projectId: z.string().uuid(),
  rows: z.array(houseImportRowSchema).min(1).max(5000),
  dryRun: z.literal(false).optional(),
});

export const savedFilterSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(120),
  payload: z.record(z.string(), z.unknown()),
});

export type ListHouseTypesQuery = z.infer<typeof listHouseTypesQuerySchema>;
export type CreateHouseTypeInput = z.infer<typeof createHouseTypeSchema>;
export type UpdateHouseTypeInput = z.infer<typeof updateHouseTypeSchema>;
export type ListHouseTemplatesQuery = z.infer<typeof listHouseTemplatesQuerySchema>;
export type CreateHouseTemplateInput = z.infer<typeof createHouseTemplateSchema>;
export type UpdateHouseTemplateInput = z.infer<typeof updateHouseTemplateSchema>;
export type ReviseHouseTemplateInput = z.infer<typeof reviseHouseTemplateSchema>;
export type ListHousesQuery = z.infer<typeof listHousesQuerySchema>;
export type CreateHouseInput = z.infer<typeof createHouseSchema>;
export type UpdateHouseInput = z.infer<typeof updateHouseSchema>;
export type ChangeHouseStatusInput = z.infer<typeof changeHouseStatusSchema>;
export type BulkHouseIdsInput = z.infer<typeof bulkHouseIdsSchema>;
export type HouseImportPreviewInput = z.infer<typeof houseImportPreviewSchema>;
export type HouseImportCommitInput = z.infer<typeof houseImportCommitSchema>;
export type SavedFilterInput = z.infer<typeof savedFilterSchema>;
export type HouseImportRow = z.infer<typeof houseImportRowSchema>;
export type TemplateActivityInput = z.infer<typeof templateActivityInputSchema>;
export type TemplateBoqInput = z.infer<typeof templateBoqInputSchema>;
export type TemplateMaterialInput = z.infer<typeof templateMaterialInputSchema>;

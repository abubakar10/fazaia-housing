import type {
  House,
  HouseStatusHistory,
  HouseTemplate,
  HouseTemplateActivity,
  HouseTemplateBOQ,
  HouseTemplateMaterial,
  HouseType,
} from "@prisma/client";

export type HouseTypeDto = {
  id: string;
  projectId: string | null;
  code: string;
  name: string;
  category: string;
  coveredArea: number | null;
  plotSize: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  drawingNumber: string | null;
  description: string | null;
  status: string;
  defaultTemplateId: string | null;
  templateCount: number;
  houseCount: number;
  createdAt: string;
  updatedAt: string;
};

export type HouseTemplateActivityDto = {
  id: string;
  houseTemplateId: string;
  code: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  estimatedDurationDays: number | null;
  sortOrder: number;
};

export type HouseTemplateBoqDto = {
  id: string;
  houseTemplateId: string;
  code: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitRate: number | null;
  sortOrder: number;
};

export type HouseTemplateMaterialDto = {
  id: string;
  houseTemplateId: string;
  code: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  sortOrder: number;
};

export type HouseTemplateDto = {
  id: string;
  houseTypeId: string;
  projectId: string | null;
  code: string;
  name: string;
  version: number;
  status: string;
  estimatedDurationDays: number | null;
  estimatedCost: number | null;
  revisionOfId: string | null;
  revisionNote: string | null;
  isDefault: boolean;
  description: string | null;
  houseType?: { id: string; code: string; name: string } | null;
  activities: HouseTemplateActivityDto[];
  boqItems: HouseTemplateBoqDto[];
  materials: HouseTemplateMaterialDto[];
  activityCount: number;
  boqCount: number;
  materialCount: number;
  createdAt: string;
  updatedAt: string;
};

export type HouseDto = {
  id: string;
  projectId: string;
  phaseId: string;
  sectorId: string;
  blockId: string;
  houseTypeId: string;
  houseTemplateId: string | null;
  code: string;
  plotNo: string | null;
  status: string;
  statusBeforeArchive: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  ownerName: string | null;
  notes: string | null;
  progressPct: number;
  version: number;
  seededFromTemplate: boolean;
  phase?: { id: string; code: string; name: string } | null;
  sector?: { id: string; code: string; name: string } | null;
  block?: { id: string; code: string; name: string } | null;
  houseType?: { id: string; code: string; name: string } | null;
  houseTemplate?: {
    id: string;
    code: string;
    name: string;
    version: number;
    activityCount?: number;
    boqCount?: number;
    materialCount?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type HouseStatusHistoryDto = {
  id: string;
  houseId: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  changedById: string | null;
  createdAt: string;
};

export type HouseStatsDto = {
  total: number;
  byStatus: Record<string, number>;
  houseTypeCount: number;
  completed: number;
  planning: number;
  constructionProgressPercent: number;
  /** Placeholders until execution / BOQ / inspection modules. */
  placeholders: {
    activities: number;
    boq: number;
    inspections: number;
    materials: number;
    progress: number;
    budget: number | null;
  };
};

export type HouseImportIssue = {
  row: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
};

export type HouseImportDuplicate = {
  row: number;
  field: "code" | "plotNo";
  value: string;
  source: "file" | "database";
};

export type HouseImportPreviewDto = {
  dryRun: boolean;
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  warnings: number;
  issues: HouseImportIssue[];
  errorReport: HouseImportIssue[];
  duplicatePreview: HouseImportDuplicate[];
  summary: {
    wouldImport: number;
    blocked: number;
    autoCoded: number;
  };
  rows: Array<{
    row: number;
    ok: boolean;
    data: Record<string, unknown>;
  }>;
};

export type HouseImportResultDto = {
  imported: number;
  ids: string[];
  rolledBack: boolean;
  summary: {
    requested: number;
    imported: number;
    failed: number;
  };
};

export const HOUSE_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ALLOCATED: "Allocated",
  UNDER_CONSTRUCTION: "Under Construction",
  INSPECTION: "Inspection",
  COMPLETED: "Completed",
  DELIVERED: "Delivered",
  ARCHIVED: "Archived",
};

export const HOUSE_TYPE_CATEGORY_LABELS: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  MIXED: "Mixed",
  OTHER: "Other",
};

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type HouseTypeRow = HouseType & {
  _count?: { templates: number; houses: number };
};

type HouseTemplateRow = HouseTemplate & {
  houseType?: { id: string; code: string; name: string } | null;
  activities?: HouseTemplateActivity[];
  boqItems?: HouseTemplateBOQ[];
  materials?: HouseTemplateMaterial[];
  _count?: {
    activities?: number;
    boqItems?: number;
    materials?: number;
  };
};

type HouseRow = House & {
  phase?: { id: string; code: string; name: string } | null;
  sector?: { id: string; code: string; name: string } | null;
  block?: { id: string; code: string; name: string } | null;
  houseType?: { id: string; code: string; name: string } | null;
  houseTemplate?: {
    id: string;
    code: string;
    name: string;
    version: number;
    _count?: {
      activities?: number;
      boqItems?: number;
      materials?: number;
    };
  } | null;
};

export function toTemplateActivityDto(
  row: HouseTemplateActivity,
): HouseTemplateActivityDto {
  return {
    id: row.id,
    houseTemplateId: row.houseTemplateId,
    code: row.code,
    name: row.name,
    description: row.description,
    quantity: decimalToNumber(row.quantity) ?? 1,
    unit: row.unit,
    estimatedDurationDays: row.estimatedDurationDays,
    sortOrder: row.sortOrder,
  };
}

export function toTemplateBoqDto(row: HouseTemplateBOQ): HouseTemplateBoqDto {
  return {
    id: row.id,
    houseTemplateId: row.houseTemplateId,
    code: row.code,
    name: row.name,
    description: row.description,
    quantity: decimalToNumber(row.quantity) ?? 1,
    unit: row.unit,
    unitRate: decimalToNumber(row.unitRate),
    sortOrder: row.sortOrder,
  };
}

export function toTemplateMaterialDto(
  row: HouseTemplateMaterial,
): HouseTemplateMaterialDto {
  return {
    id: row.id,
    houseTemplateId: row.houseTemplateId,
    code: row.code,
    name: row.name,
    description: row.description,
    quantity: decimalToNumber(row.quantity) ?? 1,
    unit: row.unit,
    sortOrder: row.sortOrder,
  };
}

export function toHouseTypeDto(row: HouseTypeRow): HouseTypeDto {
  return {
    id: row.id,
    projectId: row.projectId,
    code: row.code,
    name: row.name,
    category: row.category,
    coveredArea: decimalToNumber(row.coveredArea),
    plotSize: decimalToNumber(row.plotSize),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    floors: row.floors,
    drawingNumber: row.drawingNumber,
    description: row.description,
    status: row.status,
    defaultTemplateId: row.defaultTemplateId,
    templateCount: row._count?.templates ?? 0,
    houseCount: row._count?.houses ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toHouseTemplateDto(row: HouseTemplateRow): HouseTemplateDto {
  const activities = (row.activities ?? []).map(toTemplateActivityDto);
  const boqItems = (row.boqItems ?? []).map(toTemplateBoqDto);
  const materials = (row.materials ?? []).map(toTemplateMaterialDto);

  return {
    id: row.id,
    houseTypeId: row.houseTypeId,
    projectId: row.projectId,
    code: row.code,
    name: row.name,
    version: row.version,
    status: row.status,
    estimatedDurationDays: row.estimatedDurationDays,
    estimatedCost: decimalToNumber(row.estimatedCost),
    revisionOfId: row.revisionOfId,
    revisionNote: row.revisionNote,
    isDefault: row.isDefault,
    description: row.description,
    houseType: row.houseType ?? null,
    activities,
    boqItems,
    materials,
    activityCount: row._count?.activities ?? activities.length,
    boqCount: row._count?.boqItems ?? boqItems.length,
    materialCount: row._count?.materials ?? materials.length,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toHouseDto(row: HouseRow): HouseDto {
  return {
    id: row.id,
    projectId: row.projectId,
    phaseId: row.phaseId,
    sectorId: row.sectorId,
    blockId: row.blockId,
    houseTypeId: row.houseTypeId,
    houseTemplateId: row.houseTemplateId,
    code: row.code,
    plotNo: row.plotNo,
    status: row.status,
    statusBeforeArchive: row.statusBeforeArchive ?? null,
    gpsLatitude: decimalToNumber(row.gpsLatitude),
    gpsLongitude: decimalToNumber(row.gpsLongitude),
    ownerName: row.ownerName,
    notes: row.notes,
    progressPct: decimalToNumber(row.progressPct) ?? 0,
    version: row.version,
    seededFromTemplate: row.seededFromTemplate,
    phase: row.phase ?? null,
    sector: row.sector ?? null,
    block: row.block ?? null,
    houseType: row.houseType ?? null,
    houseTemplate: row.houseTemplate
      ? {
          id: row.houseTemplate.id,
          code: row.houseTemplate.code,
          name: row.houseTemplate.name,
          version: row.houseTemplate.version,
          activityCount: row.houseTemplate._count?.activities,
          boqCount: row.houseTemplate._count?.boqItems,
          materialCount: row.houseTemplate._count?.materials,
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toHouseStatusHistoryDto(row: HouseStatusHistory): HouseStatusHistoryDto {
  return {
    id: row.id,
    houseId: row.houseId,
    fromStatus: row.fromStatus,
    toStatus: row.toStatus,
    note: row.note,
    changedById: row.changedById,
    createdAt: row.createdAt.toISOString(),
  };
}

export { toIso };

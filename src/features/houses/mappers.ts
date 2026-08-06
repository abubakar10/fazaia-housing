import type { House, HouseStatusHistory, HouseTemplate, HouseType } from "@prisma/client";

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
  defaultActivities: unknown;
  defaultBoq: unknown;
  defaultMaterials: unknown;
  revisionOfId: string | null;
  revisionNote: string | null;
  isDefault: boolean;
  description: string | null;
  houseType?: { id: string; code: string; name: string } | null;
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
  houseTemplate?: { id: string; code: string; name: string; version: number } | null;
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
};

export type HouseImportIssue = {
  row: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
};

export type HouseImportPreviewDto = {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  issues: HouseImportIssue[];
  rows: Array<{
    row: number;
    ok: boolean;
    data: Record<string, unknown>;
  }>;
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
};

type HouseRow = House & {
  phase?: { id: string; code: string; name: string } | null;
  sector?: { id: string; code: string; name: string } | null;
  block?: { id: string; code: string; name: string } | null;
  houseType?: { id: string; code: string; name: string } | null;
  houseTemplate?: { id: string; code: string; name: string; version: number } | null;
};

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
    defaultActivities: row.defaultActivities,
    defaultBoq: row.defaultBoq,
    defaultMaterials: row.defaultMaterials,
    revisionOfId: row.revisionOfId,
    revisionNote: row.revisionNote,
    isDefault: row.isDefault,
    description: row.description,
    houseType: row.houseType ?? null,
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
    houseTemplate: row.houseTemplate ?? null,
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

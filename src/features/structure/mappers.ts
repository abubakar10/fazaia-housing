import type { Block, Phase, Sector } from "@prisma/client";

export type PhaseDto = {
  id: string;
  projectId: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  statusBeforeArchive: string | null;
  sortOrder: number;
  version: number;
  startDate: string | null;
  endDate: string | null;
  sectorCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SectorDto = {
  id: string;
  phaseId: string;
  projectId: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  statusBeforeArchive: string | null;
  sortOrder: number;
  version: number;
  blockCount: number;
  phase?: { id: string; code: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type BlockDto = {
  id: string;
  sectorId: string;
  projectId: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  statusBeforeArchive: string | null;
  sortOrder: number;
  version: number;
  sector?: { id: string; code: string; name: string; phaseId: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type HierarchyBlockNode = {
  id: string;
  type: "block";
  code: string;
  name: string;
  status: string;
  sortOrder: number;
};

export type HierarchySectorNode = {
  id: string;
  type: "sector";
  code: string;
  name: string;
  status: string;
  sortOrder: number;
  children: HierarchyBlockNode[];
};

export type HierarchyPhaseNode = {
  id: string;
  type: "phase";
  code: string;
  name: string;
  status: string;
  sortOrder: number;
  children: HierarchySectorNode[];
};

export type ProjectHierarchyDto = {
  projectId: string;
  phases: HierarchyPhaseNode[];
  counts: {
    phases: number;
    sectors: number;
    blocks: number;
  };
};

export type StructureBreadcrumbItem = {
  id: string;
  type: "project" | "phase" | "sector" | "block";
  code: string;
  name: string;
};

export const STRUCTURE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

type PhaseRow = Phase & { _count?: { sectors: number } };
type SectorRow = Sector & {
  _count?: { blocks: number };
  phase?: { id: string; code: string; name: string } | null;
};
type BlockRow = Block & {
  sector?: { id: string; code: string; name: string; phaseId: string } | null;
};

export function toPhaseDto(row: PhaseRow): PhaseDto {
  return {
    id: row.id,
    projectId: row.projectId,
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status,
    statusBeforeArchive: row.statusBeforeArchive ?? null,
    sortOrder: row.sortOrder,
    version: row.version,
    startDate: toIso(row.startDate),
    endDate: toIso(row.endDate),
    sectorCount: row._count?.sectors ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toSectorDto(row: SectorRow): SectorDto {
  return {
    id: row.id,
    phaseId: row.phaseId,
    projectId: row.projectId,
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status,
    statusBeforeArchive: row.statusBeforeArchive ?? null,
    sortOrder: row.sortOrder,
    version: row.version,
    blockCount: row._count?.blocks ?? 0,
    phase: row.phase ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toBlockDto(row: BlockRow): BlockDto {
  return {
    id: row.id,
    sectorId: row.sectorId,
    projectId: row.projectId,
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status,
    statusBeforeArchive: row.statusBeforeArchive ?? null,
    sortOrder: row.sortOrder,
    version: row.version,
    sector: row.sector ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function buildProjectHierarchy(input: {
  projectId: string;
  phases: Array<Phase & { sectors: Array<Sector & { blocks: Block[] }> }>;
}): ProjectHierarchyDto {
  const phases = [...input.phases]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((phase) => ({
      id: phase.id,
      type: "phase" as const,
      code: phase.code,
      name: phase.name,
      status: phase.status,
      sortOrder: phase.sortOrder,
      children: [...phase.sectors]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((sector) => ({
          id: sector.id,
          type: "sector" as const,
          code: sector.code,
          name: sector.name,
          status: sector.status,
          sortOrder: sector.sortOrder,
          children: [...sector.blocks]
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
            .map((block) => ({
              id: block.id,
              type: "block" as const,
              code: block.code,
              name: block.name,
              status: block.status,
              sortOrder: block.sortOrder,
            })),
        })),
    }));

  return {
    projectId: input.projectId,
    phases,
    counts: {
      phases: phases.length,
      sectors: phases.reduce((n, p) => n + p.children.length, 0),
      blocks: phases.reduce(
        (n, p) => n + p.children.reduce((m, s) => m + s.children.length, 0),
        0,
      ),
    },
  };
}

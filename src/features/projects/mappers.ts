import type { ProjectMemberRecord, ProjectRecord } from "./repositories/project.repository";

export type ProjectDto = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  status: string;
  statusBeforeArchive: string | null;
  projectType: string;
  projectPriority: string;
  clientOwner: string | null;
  consultant: string | null;
  mainContractorId: string | null;
  fiscalYear: number | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  logoUrl: string | null;
  internalNotes: string | null;
  startDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  orgUnitId: string | null;
  projectManagerId: string | null;
  currencyCode: string;
  timezone: string;
  defaultWarehouseId: string | null;
  memberCount: number;
  orgUnit: {
    id: string;
    code: string;
    name: string;
    type: string;
  } | null;
  projectManager: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  mainContractor: {
    id: string;
    code: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMemberDto = {
  id: string;
  projectId: string;
  userId: string;
  employeeId: string | null;
  contractorId: string | null;
  roleId: string | null;
  roleHint: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
    avatarUrl: string | null;
  };
  employee: { id: string; code: string; name: string } | null;
  contractor: { id: string; code: string; name: string } | null;
  role: { id: string; code: string; name: string } | null;
  joinedAt: string;
};

export type ProjectKpiSnapshot = {
  houses: number;
  phases: number;
  sectors: number;
  blocks: number;
  budget: number;
  progressPercent: number;
  contractors: number;
  employees: number;
  inventoryItems: number;
  openInspections: number;
};

export type ProjectActivityEvent = {
  id: string;
  action: string;
  label: string;
  actorId: string | null;
  createdAt: string;
  meta?: unknown;
};

export type ProjectDashboardDto = {
  summary: ProjectDto;
  kpis: ProjectKpiSnapshot;
  houseStats: {
    total: number;
    houseTypeCount: number;
    completed: number;
    planning: number;
    constructionProgressPercent: number;
    placeholders: {
      activities: number;
      boq: number;
      inspections: number;
      materials: number;
      progress: number;
      budget: number | null;
    };
  };
  memberPreview: ProjectMemberDto[];
  memberCount: number;
  deadlines: Array<{
    id: string;
    label: string;
    date: string;
    kind: "start" | "expected_end" | "actual_end";
  }>;
  recentActivity: ProjectActivityEvent[];
  placeholders: {
    workflowTasks: boolean;
    documents: boolean;
    notifications: boolean;
  };
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  MIXED_USE: "Mixed use",
  INFRASTRUCTURE: "Infrastructure",
  RENOVATION: "Renovation",
  OTHER: "Other",
};

export const PROJECT_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const PROJECT_ACTIVITY_LABELS: Record<string, string> = {
  "projects.create": "Project created",
  "projects.update": "Project updated",
  "projects.archive": "Project archived",
  "projects.restore": "Project restored",
  "projects.delete": "Project deleted",
  "projects.members.update": "Members updated",
  "projects.members.add": "Member added",
  "projects.members.remove": "Member removed",
  "projects.context.switch": "Project context changed",
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

export function toProjectDto(row: ProjectRecord): ProjectDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    location: row.location,
    status: row.status,
    statusBeforeArchive: row.statusBeforeArchive ?? null,
    projectType: row.projectType,
    projectPriority: row.projectPriority,
    clientOwner: row.clientOwner,
    consultant: row.consultant,
    mainContractorId: row.mainContractorId,
    fiscalYear: row.fiscalYear,
    gpsLatitude: decimalToNumber(row.gpsLatitude),
    gpsLongitude: decimalToNumber(row.gpsLongitude),
    logoUrl: row.logoUrl,
    internalNotes: row.internalNotes,
    startDate: toIso(row.startDate),
    expectedEndDate: toIso(row.expectedEndDate),
    actualEndDate: toIso(row.actualEndDate),
    orgUnitId: row.orgUnitId,
    projectManagerId: row.projectManagerId,
    currencyCode: row.currencyCode,
    timezone: row.timezone,
    defaultWarehouseId: row.defaultWarehouseId,
    memberCount: row._count.members,
    orgUnit: row.orgUnit
      ? {
          id: row.orgUnit.id,
          code: row.orgUnit.code,
          name: row.orgUnit.name,
          type: row.orgUnit.type,
        }
      : null,
    projectManager: row.projectManager
      ? {
          id: row.projectManager.id,
          name: row.projectManager.name,
          email: row.projectManager.email,
          avatarUrl: row.projectManager.avatarUrl,
        }
      : null,
    mainContractor: row.mainContractor
      ? {
          id: row.mainContractor.id,
          code: row.mainContractor.code,
          name: row.mainContractor.name,
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toProjectMemberDto(row: ProjectMemberRecord): ProjectMemberDto {
  return {
    id: row.id,
    projectId: row.projectId,
    userId: row.userId,
    employeeId: row.employeeId,
    contractorId: row.contractorId,
    roleId: row.roleId,
    roleHint: row.roleHint,
    user: {
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
      status: row.user.status,
      avatarUrl: row.user.avatarUrl,
    },
    employee: row.employee,
    contractor: row.contractor,
    role: row.role,
    joinedAt: row.createdAt.toISOString(),
  };
}

export function buildZeroKpis(): ProjectKpiSnapshot {
  return {
    houses: 0,
    phases: 0,
    sectors: 0,
    blocks: 0,
    budget: 0,
    progressPercent: 0,
    contractors: 0,
    employees: 0,
    inventoryItems: 0,
    openInspections: 0,
  };
}

export function toActivityEvent(row: {
  id: string;
  action: string;
  actorId: string | null;
  createdAt: Date;
  meta?: unknown;
}): ProjectActivityEvent {
  return {
    id: row.id,
    action: row.action,
    label: PROJECT_ACTIVITY_LABELS[row.action] ?? row.action,
    actorId: row.actorId,
    createdAt: row.createdAt.toISOString(),
    meta: row.meta,
  };
}

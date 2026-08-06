import { NotFoundError } from "@/domain/errors";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { requirePermission } from "@/domain/policies/require-permission";
import {
  buildZeroKpis,
  toActivityEvent,
  toProjectDto,
  toProjectMemberDto,
  type ProjectDashboardDto,
} from "../mappers";
import {
  getProjectById,
  getProjectMemberPreview,
  listProjectAuditEvents,
} from "../repositories/project.repository";
import { countStructureForProject } from "@/features/structure/repositories/structure.repository";
import { getProjectHouseStats } from "@/features/houses/repositories/house.repository";
import type { ListProjectActivityQuery } from "../schemas/project.schemas";

async function assertProjectVisible(
  actorId: string,
  projectId: string,
  resolveVisible: (id: string) => Promise<string[] | null>,
) {
  const visible = await resolveVisible(actorId);
  if (visible && !visible.includes(projectId)) {
    const { ForbiddenError } = await import("@/domain/errors");
    throw new ForbiddenError("You cannot access this project.");
  }
}

export const projectDashboardService = {
  async getDashboard(
    projectId: string,
    actorId: string,
    resolveVisible: (id: string) => Promise<string[] | null>,
    activityQuery?: ListProjectActivityQuery,
  ): Promise<ProjectDashboardDto> {
    await requirePermission(PERMISSIONS.PROJECTS_READ);
    await assertProjectVisible(actorId, projectId, resolveVisible);

    const [project, memberPreview, auditRows, structureCounts, houseStats] =
      await Promise.all([
        getProjectById(projectId),
        getProjectMemberPreview(projectId, 6),
        listProjectAuditEvents(projectId, activityQuery?.limit ?? 30),
        countStructureForProject(projectId),
        getProjectHouseStats(projectId),
      ]);

    if (!project) throw new NotFoundError("Project", projectId);

    const summary = toProjectDto(project);
    const deadlines: ProjectDashboardDto["deadlines"] = [];

    if (summary.startDate) {
      deadlines.push({
        id: "start",
        label: "Start date",
        date: summary.startDate,
        kind: "start",
      });
    }
    if (summary.expectedEndDate) {
      deadlines.push({
        id: "expected_end",
        label: "Expected completion",
        date: summary.expectedEndDate,
        kind: "expected_end",
      });
    }
    if (summary.actualEndDate) {
      deadlines.push({
        id: "actual_end",
        label: "Actual completion",
        date: summary.actualEndDate,
        kind: "actual_end",
      });
    }

    const kpis = buildZeroKpis();
    kpis.phases = structureCounts.phases;
    kpis.sectors = structureCounts.sectors;
    kpis.blocks = structureCounts.blocks;
    kpis.houses = houseStats.total;
    kpis.progressPercent = houseStats.constructionProgressPercent;

    return {
      summary,
      kpis,
      houseStats: {
        total: houseStats.total,
        houseTypeCount: houseStats.houseTypeCount,
        completed: houseStats.completed,
        planning: houseStats.planning,
        constructionProgressPercent: houseStats.constructionProgressPercent,
      },
      memberPreview: memberPreview.map(toProjectMemberDto),
      memberCount: summary.memberCount,
      deadlines,
      recentActivity: auditRows.map(toActivityEvent),
      placeholders: {
        workflowTasks: true,
        documents: true,
        notifications: true,
      },
    };
  },
};

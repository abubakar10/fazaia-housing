import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { requireSessionActor } from "@/features/auth/services/session.service";
import { listProjectActivityQuerySchema } from "@/features/projects/schemas/project.schemas";
import { projectDashboardService } from "@/features/projects/services/project-dashboard.service";
import { resolveVisibleProjectIds } from "@/features/projects/services/projects.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = await requireSessionActor();
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const activityQuery = listProjectActivityQuerySchema.parse(raw);
    const dashboard = await projectDashboardService.getDashboard(
      id,
      actor.id,
      resolveVisibleProjectIds,
      activityQuery,
    );
    return ok(dashboard);
  } catch (error) {
    return handleApiError(error, "projects.dashboard.failed");
  }
}

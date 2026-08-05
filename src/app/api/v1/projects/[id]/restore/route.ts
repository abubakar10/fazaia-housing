import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { projectsService } from "@/features/projects/services/projects.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = await projectsService.restore(id);
    return ok(project);
  } catch (error) {
    return handleApiError(error, "projects.restore.failed");
  }
}

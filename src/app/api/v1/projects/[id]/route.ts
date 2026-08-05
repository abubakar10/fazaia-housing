import { NextRequest } from "next/server";
import { ok, noContent } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updateProjectSchema } from "@/features/projects/schemas/project.schemas";
import { projectsService } from "@/features/projects/services/projects.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = await projectsService.getById(id);
    return ok(project);
  } catch (error) {
    return handleApiError(error, "projects.get.failed");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = updateProjectSchema.parse(body);
    const project = await projectsService.update(id, input);
    return ok(project);
  } catch (error) {
    return handleApiError(error, "projects.update.failed");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await projectsService.softDelete(id);
    return noContent();
  } catch (error) {
    return handleApiError(error, "projects.delete.failed");
  }
}

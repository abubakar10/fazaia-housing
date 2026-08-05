import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { listProjectActivityQuerySchema } from "@/features/projects/schemas/project.schemas";
import { projectsService } from "@/features/projects/services/projects.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listProjectActivityQuerySchema.parse(raw);
    const events = await projectsService.listActivity(id, query);
    return ok(events);
  } catch (error) {
    return handleApiError(error, "projects.activity.failed");
  }
}

import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { requireSessionActor } from "@/features/auth/services/session.service";
import { setProjectContextSchema } from "@/features/projects/schemas/project.schemas";
import { projectContextService } from "@/features/projects/services/projects.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireSessionActor();
    const ctx = await projectContextService.get(actor.id);
    return ok(ctx);
  } catch (error) {
    return handleApiError(error, "project-context.get.failed");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireSessionActor();
    const body = await parseJsonBody(request);
    const input = setProjectContextSchema.parse(body);
    const ctx = await projectContextService.set(actor.id, input.projectId);
    return ok(ctx);
  } catch (error) {
    return handleApiError(error, "project-context.set.failed");
  }
}

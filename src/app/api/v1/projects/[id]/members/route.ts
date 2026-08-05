import { NextRequest } from "next/server";
import { ok, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  listProjectMembersQuerySchema,
  setProjectMembersSchema,
} from "@/features/projects/schemas/project.schemas";
import { projectsService } from "@/features/projects/services/projects.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const hasQuery = Object.keys(raw).length > 0;
    const query = hasQuery
      ? listProjectMembersQuerySchema.parse(raw)
      : undefined;
    const result = await projectsService.listMembers(id, query);
    if (query) {
      return listOk(result.data, result.meta);
    }
    return ok(result.data);
  } catch (error) {
    return handleApiError(error, "projects.members.list.failed");
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = setProjectMembersSchema.parse(body);
    const members = await projectsService.setMembers(id, input);
    return ok(members);
  } catch (error) {
    return handleApiError(error, "projects.members.update.failed");
  }
}

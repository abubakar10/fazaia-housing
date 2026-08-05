import { NextRequest } from "next/server";
import { created, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  createProjectSchema,
  listProjectsQuerySchema,
} from "@/features/projects/schemas/project.schemas";
import { projectsService } from "@/features/projects/services/projects.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listProjectsQuerySchema.parse(raw);
    const result = await projectsService.list(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "projects.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const input = createProjectSchema.parse(body);
    const project = await projectsService.create(input);
    return created(project);
  } catch (error) {
    return handleApiError(error, "projects.create.failed");
  }
}

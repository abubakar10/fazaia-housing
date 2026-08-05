import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { hierarchyService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const includeArchived =
      request.nextUrl.searchParams.get("includeArchived") === "true";
    const hierarchy = await hierarchyService.get(id, includeArchived);
    return ok(hierarchy);
  } catch (error) {
    return handleApiError(error, "projects.hierarchy.failed");
  }
}

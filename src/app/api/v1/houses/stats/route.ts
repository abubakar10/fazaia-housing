import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { housesService } from "@/features/houses/services/houses.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) throw new Error("projectId is required");
    return ok(await housesService.stats(projectId));
  } catch (error) {
    return handleApiError(error, "houses.stats.failed");
  }
}

import { NextRequest } from "next/server";
import { created, ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { savedFilterSchema } from "@/features/houses/schemas/house.schemas";
import { savedFiltersService } from "@/features/houses/services/houses.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    return ok(await savedFiltersService.list(projectId));
  } catch (error) {
    return handleApiError(error, "houses.saved_filters.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    return created(await savedFiltersService.create(savedFilterSchema.parse(body)));
  } catch (error) {
    return handleApiError(error, "houses.saved_filters.create.failed");
  }
}

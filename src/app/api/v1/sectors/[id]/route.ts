import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updateSectorSchema } from "@/features/structure/schemas/structure.schemas";
import { sectorsService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return ok(await sectorsService.get(id));
  } catch (error) {
    return handleApiError(error, "sectors.get.failed");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = updateSectorSchema.parse(body);
    return ok(await sectorsService.update(id, input));
  } catch (error) {
    return handleApiError(error, "sectors.update.failed");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return ok(await sectorsService.softDelete(id));
  } catch (error) {
    return handleApiError(error, "sectors.delete.failed");
  }
}

import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updateBlockSchema } from "@/features/structure/schemas/structure.schemas";
import { blocksService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return ok(await blocksService.get(id));
  } catch (error) {
    return handleApiError(error, "blocks.get.failed");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    return ok(await blocksService.update(id, updateBlockSchema.parse(body)));
  } catch (error) {
    return handleApiError(error, "blocks.update.failed");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return ok(await blocksService.softDelete(id));
  } catch (error) {
    return handleApiError(error, "blocks.delete.failed");
  }
}

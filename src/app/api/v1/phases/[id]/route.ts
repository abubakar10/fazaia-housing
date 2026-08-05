import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updatePhaseSchema } from "@/features/structure/schemas/structure.schemas";
import { phasesService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const phase = await phasesService.get(id);
    return ok(phase);
  } catch (error) {
    return handleApiError(error, "phases.get.failed");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = updatePhaseSchema.parse(body);
    const phase = await phasesService.update(id, input);
    return ok(phase);
  } catch (error) {
    return handleApiError(error, "phases.update.failed");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const phase = await phasesService.softDelete(id);
    return ok(phase);
  } catch (error) {
    return handleApiError(error, "phases.delete.failed");
  }
}

import { NextRequest } from "next/server";
import { created, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  createPhaseSchema,
  listPhasesQuerySchema,
} from "@/features/structure/schemas/structure.schemas";
import { phasesService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listPhasesQuerySchema.parse(raw);
    const result = await phasesService.list(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "phases.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const input = createPhaseSchema.parse(body);
    const phase = await phasesService.create(input);
    return created(phase);
  } catch (error) {
    return handleApiError(error, "phases.create.failed");
  }
}

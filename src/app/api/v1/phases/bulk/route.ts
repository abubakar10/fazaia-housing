import { NextRequest } from "next/server";
import { created, ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  bulkCreatePhasesSchema,
  bulkStructureActionSchema,
} from "@/features/structure/schemas/structure.schemas";
import { phasesService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);

    if (body && typeof body === "object" && "projectId" in body && "items" in body) {
      const input = bulkCreatePhasesSchema.parse(body);
      const phases = await phasesService.bulkCreate(input);
      return created(phases);
    }

    const action = bulkStructureActionSchema.parse(body);
    if (action.action === "create") {
      const input = bulkCreatePhasesSchema.parse({
        projectId: (action.items[0] as { projectId?: string })?.projectId,
        items: action.items,
      });
      const phases = await phasesService.bulkCreate(input);
      return created(phases);
    }
    if (action.action === "archive") {
      return ok(await phasesService.bulkArchive(action.ids));
    }
    if (action.action === "restore") {
      return ok(await phasesService.bulkRestore(action.ids));
    }
    return ok(await phasesService.bulkDelete(action.ids));
  } catch (error) {
    return handleApiError(error, "phases.bulk.failed");
  }
}

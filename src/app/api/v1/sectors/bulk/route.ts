import { NextRequest } from "next/server";
import { created, ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  bulkCreateSectorsSchema,
  bulkStructureActionSchema,
} from "@/features/structure/schemas/structure.schemas";
import { sectorsService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    if (body && typeof body === "object" && "phaseId" in body && "items" in body) {
      const input = bulkCreateSectorsSchema.parse(body);
      return created(await sectorsService.bulkCreate(input));
    }
    const action = bulkStructureActionSchema.parse(body);
    if (action.action === "create") {
      throw new Error("Use { phaseId, items } for sector bulk create");
    }
    if (action.action === "archive") return ok(await sectorsService.bulkArchive(action.ids));
    if (action.action === "restore") return ok(await sectorsService.bulkRestore(action.ids));
    return ok(await sectorsService.bulkDelete(action.ids));
  } catch (error) {
    return handleApiError(error, "sectors.bulk.failed");
  }
}

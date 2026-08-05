import { NextRequest } from "next/server";
import { created, ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  bulkCreateBlocksSchema,
  bulkStructureActionSchema,
} from "@/features/structure/schemas/structure.schemas";
import { blocksService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    if (body && typeof body === "object" && "sectorId" in body && "items" in body) {
      return created(await blocksService.bulkCreate(bulkCreateBlocksSchema.parse(body)));
    }
    const action = bulkStructureActionSchema.parse(body);
    if (action.action === "create") {
      throw new Error("Use { sectorId, items } for block bulk create");
    }
    if (action.action === "archive") return ok(await blocksService.bulkArchive(action.ids));
    if (action.action === "restore") return ok(await blocksService.bulkRestore(action.ids));
    return ok(await blocksService.bulkDelete(action.ids));
  } catch (error) {
    return handleApiError(error, "blocks.bulk.failed");
  }
}

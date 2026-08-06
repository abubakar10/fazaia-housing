import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { bulkHouseIdsSchema } from "@/features/houses/schemas/house.schemas";
import { housesService } from "@/features/houses/services/houses.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    if (!body || typeof body !== "object" || !("action" in body)) {
      throw new Error("action is required: archive | restore | delete");
    }
    const action = String((body as { action: string }).action);
    const input = bulkHouseIdsSchema.parse(body);
    if (action === "archive") return ok(await housesService.bulkArchive(input));
    if (action === "restore") return ok(await housesService.bulkRestore(input));
    if (action === "delete") return ok(await housesService.bulkDelete(input));
    throw new Error("Unsupported bulk action");
  } catch (error) {
    return handleApiError(error, "houses.bulk.failed");
  }
}

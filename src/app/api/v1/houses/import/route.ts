import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  houseImportCommitSchema,
  houseImportPreviewSchema,
} from "@/features/houses/schemas/house.schemas";
import { housesService } from "@/features/houses/services/houses.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const mode =
      body && typeof body === "object" && "commit" in body && (body as { commit?: boolean }).commit
        ? "commit"
        : "preview";

    if (mode === "commit") {
      const input = houseImportCommitSchema.parse(body);
      return ok(await housesService.importCommit(input));
    }

    const input = houseImportPreviewSchema.parse(body);
    return ok(await housesService.importPreview(input));
  } catch (error) {
    return handleApiError(error, "houses.import.failed");
  }
}

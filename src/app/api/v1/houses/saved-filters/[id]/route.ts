import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { savedFiltersService } from "@/features/houses/services/houses.service";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await savedFiltersService.remove(id));
  } catch (error) {
    return handleApiError(error, "houses.saved_filters.delete.failed");
  }
}

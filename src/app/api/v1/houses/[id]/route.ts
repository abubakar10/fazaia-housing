import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updateHouseSchema } from "@/features/houses/schemas/house.schemas";
import { housesService } from "@/features/houses/services/houses.service";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await housesService.get(id));
  } catch (error) {
    return handleApiError(error, "houses.get.failed");
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    return ok(await housesService.update(id, updateHouseSchema.parse(body)));
  } catch (error) {
    return handleApiError(error, "houses.update.failed");
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await housesService.softDelete(id));
  } catch (error) {
    return handleApiError(error, "houses.delete.failed");
  }
}

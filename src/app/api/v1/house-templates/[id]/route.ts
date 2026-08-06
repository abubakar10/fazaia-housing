import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updateHouseTemplateSchema } from "@/features/houses/schemas/house.schemas";
import { houseTemplatesService } from "@/features/houses/services/house-types.service";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await houseTemplatesService.get(id));
  } catch (error) {
    return handleApiError(error, "house_templates.get.failed");
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    return ok(
      await houseTemplatesService.update(id, updateHouseTemplateSchema.parse(body)),
    );
  } catch (error) {
    return handleApiError(error, "house_templates.update.failed");
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await houseTemplatesService.softDelete(id));
  } catch (error) {
    return handleApiError(error, "house_templates.delete.failed");
  }
}

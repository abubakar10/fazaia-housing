import { NextRequest } from "next/server";
import { created, ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { reviseHouseTemplateSchema } from "@/features/houses/schemas/house.schemas";
import { houseTemplatesService } from "@/features/houses/services/house-types.service";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await houseTemplatesService.listRevisions(id));
  } catch (error) {
    return handleApiError(error, "house_templates.revisions.failed");
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    return created(
      await houseTemplatesService.revise(id, reviseHouseTemplateSchema.parse(body)),
    );
  } catch (error) {
    return handleApiError(error, "house_templates.revise.failed");
  }
}

import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { changeHouseStatusSchema } from "@/features/houses/schemas/house.schemas";
import { housesService } from "@/features/houses/services/houses.service";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await housesService.statusHistory(id));
  } catch (error) {
    return handleApiError(error, "houses.status_history.failed");
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    return ok(
      await housesService.changeStatus(id, changeHouseStatusSchema.parse(body)),
    );
  } catch (error) {
    return handleApiError(error, "houses.status.failed");
  }
}

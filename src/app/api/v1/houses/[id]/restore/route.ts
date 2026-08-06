import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { housesService } from "@/features/houses/services/houses.service";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await housesService.restore(id));
  } catch (error) {
    return handleApiError(error, "houses.restore.failed");
  }
}

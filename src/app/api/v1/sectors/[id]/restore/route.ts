import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { sectorsService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return ok(await sectorsService.restore(id));
  } catch (error) {
    return handleApiError(error, "sectors.restore.failed");
  }
}

import { NextRequest } from "next/server";
import { created, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  createBlockSchema,
  listBlocksQuerySchema,
} from "@/features/structure/schemas/structure.schemas";
import { blocksService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listBlocksQuerySchema.parse(raw);
    const result = await blocksService.list(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "blocks.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const input = createBlockSchema.parse(body);
    return created(await blocksService.create(input));
  } catch (error) {
    return handleApiError(error, "blocks.create.failed");
  }
}

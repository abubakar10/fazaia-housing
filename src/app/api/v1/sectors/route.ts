import { NextRequest } from "next/server";
import { created, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  createSectorSchema,
  listSectorsQuerySchema,
} from "@/features/structure/schemas/structure.schemas";
import { sectorsService } from "@/features/structure/services/structure.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listSectorsQuerySchema.parse(raw);
    const result = await sectorsService.list(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "sectors.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const input = createSectorSchema.parse(body);
    const sector = await sectorsService.create(input);
    return created(sector);
  } catch (error) {
    return handleApiError(error, "sectors.create.failed");
  }
}

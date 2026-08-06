import { NextRequest } from "next/server";
import { created, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  createHouseSchema,
  listHousesQuerySchema,
} from "@/features/houses/schemas/house.schemas";
import { housesService } from "@/features/houses/services/houses.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listHousesQuerySchema.parse(raw);
    const result = await housesService.list(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "houses.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    return created(await housesService.create(createHouseSchema.parse(body)));
  } catch (error) {
    return handleApiError(error, "houses.create.failed");
  }
}

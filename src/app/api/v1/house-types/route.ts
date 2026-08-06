import { NextRequest } from "next/server";
import { created, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  createHouseTypeSchema,
  listHouseTypesQuerySchema,
} from "@/features/houses/schemas/house.schemas";
import { houseTypesService } from "@/features/houses/services/house-types.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listHouseTypesQuerySchema.parse(raw);
    const result = await houseTypesService.list(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "house_types.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const input = createHouseTypeSchema.parse(body);
    return created(await houseTypesService.create(input));
  } catch (error) {
    return handleApiError(error, "house_types.create.failed");
  }
}

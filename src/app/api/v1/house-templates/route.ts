import { NextRequest } from "next/server";
import { created, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  createHouseTemplateSchema,
  listHouseTemplatesQuerySchema,
} from "@/features/houses/schemas/house.schemas";
import { houseTemplatesService } from "@/features/houses/services/house-types.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listHouseTemplatesQuerySchema.parse(raw);
    const result = await houseTemplatesService.list(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "house_templates.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    return created(
      await houseTemplatesService.create(createHouseTemplateSchema.parse(body)),
    );
  } catch (error) {
    return handleApiError(error, "house_templates.create.failed");
  }
}

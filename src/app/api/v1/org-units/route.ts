import { NextRequest } from "next/server";
import { created, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  createOrgUnitSchema,
  listOrgUnitsQuerySchema,
} from "@/features/organization/schemas/org.schemas";
import { organizationService } from "@/features/organization/services/organization.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listOrgUnitsQuerySchema.parse(raw);
    const result = await organizationService.list(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "org-units.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const input = createOrgUnitSchema.parse(body);
    const unit = await organizationService.create(input);
    return created(unit);
  } catch (error) {
    return handleApiError(error, "org-units.create.failed");
  }
}

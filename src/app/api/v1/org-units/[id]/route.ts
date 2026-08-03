import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updateOrgUnitSchema } from "@/features/organization/schemas/org.schemas";
import { organizationService } from "@/features/organization/services/organization.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const unit = await organizationService.get(id);
    return ok(unit);
  } catch (error) {
    return handleApiError(error, "org-units.get.failed");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const input = updateOrgUnitSchema.parse(body);
    const unit = await organizationService.update(id, input);
    return ok(unit);
  } catch (error) {
    return handleApiError(error, "org-units.update.failed");
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const unit = await organizationService.softDelete(id);
    return ok(unit);
  } catch (error) {
    return handleApiError(error, "org-units.delete.failed");
  }
}

import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { organizationService } from "@/features/organization/services/organization.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const crumbs = await organizationService.breadcrumb(id);
    return ok(crumbs);
  } catch (error) {
    return handleApiError(error, "org-units.breadcrumb.failed");
  }
}

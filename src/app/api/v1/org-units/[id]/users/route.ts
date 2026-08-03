import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { assignOrgUsersSchema } from "@/features/organization/schemas/org.schemas";
import { organizationService } from "@/features/organization/services/organization.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const members = await organizationService.listMembers(id);
    return ok(members);
  } catch (error) {
    return handleApiError(error, "org-units.users.get.failed");
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const input = assignOrgUsersSchema.parse(body);
    const members = await organizationService.assignUsers(id, input);
    return ok(members);
  } catch (error) {
    return handleApiError(error, "org-units.users.assign.failed");
  }
}

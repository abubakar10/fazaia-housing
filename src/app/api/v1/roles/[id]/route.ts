import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updateRoleSchema } from "@/features/rbac/schemas/rbac.schemas";
import { rbacService } from "@/features/rbac/services/rbac.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const role = await rbacService.getRole(id);
    return ok(role);
  } catch (error) {
    return handleApiError(error, "roles.get.failed");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const input = updateRoleSchema.parse(body);
    const role = await rbacService.updateRole(id, input);
    return ok(role);
  } catch (error) {
    return handleApiError(error, "roles.update.failed");
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const role = await rbacService.deleteRole(id);
    return ok(role);
  } catch (error) {
    return handleApiError(error, "roles.delete.failed");
  }
}

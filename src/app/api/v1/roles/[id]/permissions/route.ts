import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { setRolePermissionsSchema } from "@/features/rbac/schemas/rbac.schemas";
import { rbacService } from "@/features/rbac/services/rbac.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const input = setRolePermissionsSchema.parse(body);
    const role = await rbacService.setRolePermissions(id, input);
    return ok(role);
  } catch (error) {
    return handleApiError(error, "roles.permissions.failed");
  }
}

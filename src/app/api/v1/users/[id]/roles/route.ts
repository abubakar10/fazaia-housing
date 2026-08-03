import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { setUserRolesSchema } from "@/features/rbac/schemas/rbac.schemas";
import { rbacService } from "@/features/rbac/services/rbac.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const roles = await rbacService.getUserRoles(id);
    return ok(roles);
  } catch (error) {
    return handleApiError(error, "users.roles.get.failed");
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const input = setUserRolesSchema.parse(body);
    const roles = await rbacService.setUserRoles(id, input);
    return ok(roles);
  } catch (error) {
    return handleApiError(error, "users.roles.set.failed");
  }
}

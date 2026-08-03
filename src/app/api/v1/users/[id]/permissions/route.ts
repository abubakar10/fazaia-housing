import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { setUserPermissionOverridesSchema } from "@/features/rbac/schemas/rbac.schemas";
import { rbacService } from "@/features/rbac/services/rbac.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const overrides = await rbacService.getUserPermissionOverrides(id);
    return ok(overrides);
  } catch (error) {
    return handleApiError(error, "users.permissions.get.failed");
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const input = setUserPermissionOverridesSchema.parse(body);
    const overrides = await rbacService.setUserPermissionOverrides(id, input);
    return ok(overrides);
  } catch (error) {
    return handleApiError(error, "users.permissions.set.failed");
  }
}

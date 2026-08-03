import { NextRequest } from "next/server";
import { created, listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import {
  createRoleSchema,
  listRolesQuerySchema,
} from "@/features/rbac/schemas/rbac.schemas";
import { rbacService } from "@/features/rbac/services/rbac.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listRolesQuerySchema.parse(raw);
    const result = await rbacService.listRoles(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "roles.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const input = createRoleSchema.parse(body);
    const role = await rbacService.createRole(input);
    return created(role);
  } catch (error) {
    return handleApiError(error, "roles.create.failed");
  }
}

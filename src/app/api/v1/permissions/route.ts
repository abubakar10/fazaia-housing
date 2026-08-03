import { NextRequest } from "next/server";
import { listOk, ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { listPermissionsQuerySchema } from "@/features/rbac/schemas/rbac.schemas";
import { rbacService } from "@/features/rbac/services/rbac.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get("all");
    if (all === "1" || all === "true") {
      const data = await rbacService.listAllPermissions();
      return ok(data);
    }

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listPermissionsQuerySchema.parse(raw);
    const result = await rbacService.listPermissions(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "permissions.list.failed");
  }
}

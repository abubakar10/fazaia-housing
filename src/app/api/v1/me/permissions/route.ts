import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { requireUser } from "@/features/auth";
import {
  resolveEffectivePermissionCodes,
  resolveVisibilityContext,
} from "@/features/rbac/services/access.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireUser();
    const [permissions, ctx] = await Promise.all([
      resolveEffectivePermissionCodes(actor.id),
      resolveVisibilityContext(actor.id),
    ]);

    return ok({
      permissions: [...permissions].sort(),
      roleCodes: ctx?.roleCodes ?? [],
      globalRead: ctx?.globalRead ?? false,
      isSuperAdmin: ctx?.isSuperAdmin ?? false,
      projectIds: ctx?.projectIds ?? [],
      orgUnitIds: ctx?.orgUnitIds ?? [],
      contractorId: ctx?.contractorId ?? null,
    });
  } catch (error) {
    return handleApiError(error, "me.permissions.failed");
  }
}

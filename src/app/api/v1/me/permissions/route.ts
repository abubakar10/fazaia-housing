import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { requireSessionActor } from "@/features/auth/services/session.service";
import { ALL_PERMISSION_CODES } from "@/domain/policies/permissions";
import {
  getCachedAccessBundle,
} from "@/features/rbac/services/access.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireSessionActor();

    if (actor.isSuperAdmin) {
      return ok({
        permissions: ALL_PERMISSION_CODES,
        roleCodes: actor.roleCodes,
        globalRead: true,
        isSuperAdmin: true,
        projectIds: [] as string[],
        orgUnitIds: [] as string[],
        contractorId: null as string | null,
      });
    }

    const cached = await getCachedAccessBundle(actor.id);
    const ctx = cached?.ctx;

    return ok({
      permissions: [...(ctx?.permissions ?? new Set<string>())].sort(),
      roleCodes: ctx?.roleCodes ?? actor.roleCodes,
      globalRead: ctx?.globalRead ?? actor.globalRead,
      isSuperAdmin: ctx?.isSuperAdmin ?? false,
      projectIds: ctx?.projectIds ?? [],
      orgUnitIds: ctx?.orgUnitIds ?? [],
      contractorId: ctx?.contractorId ?? null,
    });
  } catch (error) {
    return handleApiError(error, "me.permissions.failed");
  }
}

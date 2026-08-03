import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { organizationService } from "@/features/organization/services/organization.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await organizationService.listAssignableUsers();
    return ok(users);
  } catch (error) {
    return handleApiError(error, "org-units.assignable-users.failed");
  }
}

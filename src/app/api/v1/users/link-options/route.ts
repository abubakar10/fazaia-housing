import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { usersService } from "@/features/users/services/users.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await usersService.listLinkOptions();
    return ok(data);
  } catch (error) {
    return handleApiError(error, "users.link_options.failed");
  }
}

import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return ok({
      ready: false,
      message: "CSV import for sectors is prepared and will be enabled in a later release.",
    });
  } catch (error) {
    return handleApiError(error, "sectors.import.failed");
  }
}

import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";

export const dynamic = "force-dynamic";

/** CSV import placeholder — Module 6 prepares the endpoint; import lands later. */
export async function POST() {
  try {
    return ok({
      ready: false,
      message: "CSV import for phases is prepared and will be enabled in a later release.",
    });
  } catch (error) {
    return handleApiError(error, "phases.import.failed");
  }
}

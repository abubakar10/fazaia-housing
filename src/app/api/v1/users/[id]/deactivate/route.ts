import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError } from "@/lib/http/api-handler";
import { usersService } from "@/features/users/services/users.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await usersService.deactivate(id);
    return ok(user);
  } catch (error) {
    return handleApiError(error, "users.deactivate.failed");
  }
}

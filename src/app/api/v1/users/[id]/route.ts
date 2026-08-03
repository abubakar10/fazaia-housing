import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updateUserSchema } from "@/features/users/schemas/user.schemas";
import { usersService } from "@/features/users/services/users.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await usersService.getById(id);
    return ok(user);
  } catch (error) {
    return handleApiError(error, "users.get.failed");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const input = updateUserSchema.parse(body);
    const user = await usersService.update(id, input);
    return ok(user);
  } catch (error) {
    return handleApiError(error, "users.update.failed");
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await usersService.softDelete(id);
    return ok(user);
  } catch (error) {
    return handleApiError(error, "users.delete.failed");
  }
}

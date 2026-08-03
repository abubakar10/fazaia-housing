import { NextRequest } from "next/server";
import { requireUser } from "@/features/auth";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { updateProfileSchema } from "@/features/users/schemas/user.schemas";
import { usersService } from "@/features/users/services/users.service";
import { getUserById } from "@/features/users/repositories/user.repository";
import { toUserDto } from "@/features/users/mappers";
import { NotFoundError } from "@/domain/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireUser();
    const user = await getUserById(actor.id);
    if (!user) throw new NotFoundError("User", actor.id);
    return ok(toUserDto(user));
  } catch (error) {
    return handleApiError(error, "me.get.failed");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const input = updateProfileSchema.parse(body);
    const user = await usersService.updateProfile(input);
    return ok(user);
  } catch (error) {
    return handleApiError(error, "me.patch.failed");
  }
}

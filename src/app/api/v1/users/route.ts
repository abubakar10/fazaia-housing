import { NextRequest } from "next/server";
import { listOk } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { created } from "@/lib/http";
import {
  createUserSchema,
  inviteUserSchema,
  listUsersQuerySchema,
} from "@/features/users/schemas/user.schemas";
import { usersService } from "@/features/users/services/users.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listUsersQuerySchema.parse(raw);
    const result = await usersService.list(query);
    return listOk(result.data, result.meta);
  } catch (error) {
    return handleApiError(error, "users.list.failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const mode = request.nextUrl.searchParams.get("mode");

    if (mode === "invite") {
      const input = inviteUserSchema.parse(body);
      const result = await usersService.invite(input);
      return created(result);
    }

    const input = createUserSchema.parse(body);
    const result = await usersService.create(input);
    return created(result);
  } catch (error) {
    return handleApiError(error, "users.create.failed");
  }
}

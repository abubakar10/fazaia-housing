import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleApiError, parseJsonBody } from "@/lib/http/api-handler";
import { linkEmployeeSchema } from "@/features/users/schemas/user.schemas";
import { usersService } from "@/features/users/services/users.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const input = linkEmployeeSchema.parse(body);
    const user = await usersService.linkEmployee(id, input.employeeId);
    return ok(user);
  } catch (error) {
    return handleApiError(error, "users.link_employee.failed");
  }
}

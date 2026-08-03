import { auth } from "@/auth";
import { ForbiddenError, AppError } from "@/domain/errors";
import { findUserById } from "@/features/auth/repositories/user.repository";

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "Authentication required.", {
      status: 401,
    });
  }
  return session;
}

export async function requireUser() {
  const session = await requireSession();
  const user = await findUserById(session.user.id);
  if (!user || user.status === "INACTIVE" || user.status === "LOCKED") {
    throw new ForbiddenError("Your account is not allowed to access this resource.");
  }
  return user;
}

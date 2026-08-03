import { cache } from "react";
import { auth } from "@/auth";
import { ForbiddenError, AppError } from "@/domain/errors";
import { findUserById } from "@/features/auth/repositories/user.repository";

export type SessionActor = {
  id: string;
  email: string;
  name: string;
  status: string;
  avatarUrl?: string | null;
  roleCodes: string[];
  isSuperAdmin: boolean;
  globalRead: boolean;
};

/** One JWT decode per React/server request. */
const getAuth = cache(async () => auth());

export async function getSession() {
  return getAuth();
}

export async function getCurrentUser() {
  const session = await getAuth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireSession() {
  const session = await getAuth();
  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "Authentication required.", {
      status: 401,
    });
  }
  return session;
}

/**
 * Fast path: JWT session only (no DB). Use for page gates / permission checks.
 * Mutations that need a fresh DB status should call requireUser().
 */
export async function requireSessionActor(): Promise<SessionActor> {
  const session = await requireSession();
  const user = session.user;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    avatarUrl: user.avatarUrl,
    roleCodes: user.roleCodes ?? [],
    isSuperAdmin: Boolean(user.isSuperAdmin),
    globalRead: Boolean(user.globalRead || user.isSuperAdmin),
  };
}

export async function requireUser() {
  const session = await requireSession();
  const user = await findUserById(session.user.id);
  if (!user || user.status === "INACTIVE" || user.status === "LOCKED") {
    throw new ForbiddenError("Your account is not allowed to access this resource.");
  }
  return user;
}

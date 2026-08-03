import type { User, UserStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/db";

export type AuthUser = Pick<
  User,
  | "id"
  | "email"
  | "name"
  | "status"
  | "passwordHash"
  | "avatarUrl"
  | "failedLoginAttempts"
  | "lockedUntil"
  | "deletedAt"
>;

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const normalized = email.toLowerCase();
  // Unique email index — prefer findUnique over findFirst for login hot path.
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      passwordHash: true,
      avatarUrl: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) return null;
  return user;
}

export async function findUserById(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      phone: true,
      avatarUrl: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function markLoginSuccess(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: "ACTIVE" satisfies UserStatus,
    },
  });
}

export async function registerFailedLogin(
  userId: string,
  attempts: number,
  lockedUntil: Date | null,
  currentStatus: UserStatus,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: attempts,
      lockedUntil,
      status: lockedUntil
        ? "LOCKED"
        : currentStatus === "LOCKED"
          ? "ACTIVE"
          : undefined,
    },
  });
}

export async function updatePassword(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: "ACTIVE",
    },
  });
}

export async function createPasswordResetToken(
  email: string,
  token: string,
  expires: Date,
) {
  await prisma.verificationToken.deleteMany({
    where: { identifier: email.toLowerCase() },
  });

  return prisma.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token,
      expires,
    },
  });
}

export async function findPasswordResetToken(email: string, token: string) {
  return prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email.toLowerCase(),
        token,
      },
    },
  });
}

export async function deletePasswordResetTokens(email: string) {
  return prisma.verificationToken.deleteMany({
    where: { identifier: email.toLowerCase() },
  });
}

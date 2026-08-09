import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/features/auth/schemas/auth.schemas";
import {
  findUserByEmail,
  markLoginSuccess,
  registerFailedLogin,
} from "@/features/auth/repositories/user.repository";
import { verifyPassword } from "@/features/auth/services/password.service";
import {
  getLockoutState,
  nextFailedLoginState,
} from "@/features/auth/services/password-reset.service";
import { writeAuditLogAsync } from "@/features/auth/services/audit.service";
import {
  AUTH_RATE_LIMITS,
  rateLimit,
} from "@/features/auth/services/rate-limit.service";
import { logger } from "@/infrastructure/logger";
import { prisma } from "@/infrastructure/db";
import { SYSTEM_ROLE_CODES } from "@/domain/policies/permissions";

class AccountLockedError extends CredentialsSignin {
  code = "ACCOUNT_LOCKED";
}

class RateLimitedError extends CredentialsSignin {
  code = "RATE_LIMITED";
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required in production");
    }
    return "falcon-dev-auth-secret-change-me";
  }
  return secret;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // JWT credentials auth does not need PrismaAdapter (avoids extra DB round-trips).
  // Cookie names/secure flags must stay Auth.js defaults so middleware (authConfig)
  // and Node handlers agree — forcing __Secure__/__Host__ under NODE_ENV=production
  // breaks http://localhost (pnpm start) session, nav permissions, and sign-out.
  secret: getAuthSecret(),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        clientIp: { label: "IP", type: "text" },
        userAgent: { label: "UA", type: "text" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });

        if (!parsed.success) {
          return null;
        }

        const ip =
          typeof credentials?.clientIp === "string"
            ? credentials.clientIp
            : "unknown";
        const userAgent =
          typeof credentials?.userAgent === "string"
            ? credentials.userAgent
            : null;

        const limit = rateLimit(
          `login:${ip}`,
          AUTH_RATE_LIMITS.login.limit,
          AUTH_RATE_LIMITS.login.windowMs,
        );

        if (!limit.success) {
          writeAuditLogAsync({
            action: "auth.login.rate_limited",
            ip,
            userAgent,
            meta: { email: parsed.data.email },
          });
          throw new RateLimitedError();
        }

        const user = await findUserByEmail(parsed.data.email);

        if (!user || !user.passwordHash) {
          writeAuditLogAsync({
            action: "auth.login.failed",
            ip,
            userAgent,
            meta: { email: parsed.data.email, reason: "invalid_credentials" },
          });
          return null;
        }

        const lockout = getLockoutState(user);
        if (lockout.locked) {
          writeAuditLogAsync({
            actorId: user.id,
            action: "auth.login.locked",
            entityId: user.id,
            ip,
            userAgent,
          });
          throw new AccountLockedError();
        }

        if (user.status === "INACTIVE") {
          writeAuditLogAsync({
            actorId: user.id,
            action: "auth.login.failed",
            entityId: user.id,
            ip,
            userAgent,
            meta: { reason: "inactive" },
          });
          return null;
        }

        const valid = await verifyPassword(
          user.passwordHash,
          parsed.data.password,
        );

        if (!valid) {
          const next = nextFailedLoginState(user.failedLoginAttempts);
          await registerFailedLogin(
            user.id,
            next.attempts,
            next.lockedUntil,
            user.status,
          );
          writeAuditLogAsync({
            actorId: user.id,
            action: "auth.login.failed",
            entityId: user.id,
            ip,
            userAgent,
            meta: {
              reason: "invalid_credentials",
              attempts: next.attempts,
              locked: Boolean(next.lockedUntil),
            },
          });
          if (next.lockedUntil) {
            throw new AccountLockedError();
          }
          return null;
        }

        // Parallel: login stamp does not block role snapshot for JWT.
        const [, roleRows] = await Promise.all([
          markLoginSuccess(user.id),
          prisma.userRole.findMany({
            where: { userId: user.id },
            select: {
              role: { select: { code: true, globalRead: true } },
            },
          }),
        ]);

        writeAuditLogAsync({
          actorId: user.id,
          action: "auth.login.success",
          entityId: user.id,
          ip,
          userAgent,
        });

        const roleCodes = roleRows.map((row) => row.role.code);
        const isSuperAdmin = roleCodes.includes(SYSTEM_ROLE_CODES.SUPER_ADMIN);
        const globalRead =
          isSuperAdmin || roleRows.some((row) => row.role.globalRead);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          status: "ACTIVE",
          avatarUrl: user.avatarUrl,
          roleCodes,
          isSuperAdmin,
          globalRead,
        };
      },
    }),
  ],
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      writeAuditLogAsync({
        actorId: typeof token?.id === "string" ? token.id : null,
        action: "auth.logout",
        entityId: typeof token?.id === "string" ? token.id : null,
      });
    },
  },
  logger: {
    error(error) {
      logger.error("auth.error", { message: error.message });
    },
    warn(code) {
      logger.warn("auth.warn", { code });
    },
  },
});

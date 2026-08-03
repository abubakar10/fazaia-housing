import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config used by middleware.
 * Credentials provider + Prisma stay in `src/auth.ts` (Node runtime).
 */
export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 30,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const publicPaths = [
        "/login",
        "/forgot-password",
        "/reset-password",
        "/api/auth",
        "/api/v1/health",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
      ];

      const isPublic = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      );

      if (isPublic) return true;
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = String(user.id);
        token.email = user.email ?? "";
        token.name = user.name ?? "";
        token.status = String(user.status ?? "ACTIVE");
        token.avatarUrl =
          typeof user.avatarUrl === "string" ? user.avatarUrl : null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: String(token.id ?? ""),
        email: String(token.email ?? ""),
        name: String(token.name ?? ""),
        status: String(token.status ?? "ACTIVE"),
        avatarUrl:
          typeof token.avatarUrl === "string" ? token.avatarUrl : null,
      };
      return session;
    },
  },
} satisfies NextAuthConfig;

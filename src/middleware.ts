import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const loginBuckets = new Map<string, { count: number; resetAt: number }>();

function limitLogin(ip: string) {
  const windowMs = 15 * 60 * 1000;
  const limit = 10;
  const now = Date.now();
  const current = loginBuckets.get(ip);
  if (!current || current.resetAt <= now) {
    loginBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!request.auth?.user;

  if (
    pathname.startsWith("/api/auth/callback/credentials") ||
    pathname.startsWith("/api/auth/signin")
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!limitLogin(ip)) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many sign-in attempts. Please try again later.",
          },
        },
        { status: 429 },
      );
    }
  }

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

  if (isPublic) {
    if (
      isLoggedIn &&
      (pathname === "/login" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
          },
        },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

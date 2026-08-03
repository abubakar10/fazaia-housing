import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      status: string;
      avatarUrl?: string | null;
      roleCodes: string[];
      isSuperAdmin: boolean;
      globalRead: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    status: string;
    avatarUrl?: string | null;
    roleCodes?: string[];
    isSuperAdmin?: boolean;
    globalRead?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    status: string;
    avatarUrl?: string | null;
    roleCodes?: string[];
    isSuperAdmin?: boolean;
    globalRead?: boolean;
  }
}

export {};

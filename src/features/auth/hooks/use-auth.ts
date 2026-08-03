"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useState } from "react";

export function useAuth() {
  const { data, status, update } = useSession();
  return {
    user: data?.user ?? null,
    session: data,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    update,
  };
}

export function useLogin() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (input: {
      email: string;
      password: string;
      clientIp?: string;
      userAgent?: string;
    }) => {
      setIsPending(true);
      setError(null);
      try {
        const result = await signIn("credentials", {
          email: input.email,
          password: input.password,
          clientIp: input.clientIp ?? "browser",
          userAgent: input.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : ""),
          redirect: false,
        });

        if (!result) {
          setError("Unable to sign in. Please try again.");
          return { ok: false as const };
        }

        if (result.error) {
          const code = result.code ?? result.error;
          const message =
            code === "ACCOUNT_LOCKED"
              ? "Account temporarily locked due to failed sign-in attempts. Try again later."
              : code === "RATE_LIMITED"
                ? "Too many sign-in attempts. Please wait and try again."
                : "Invalid email or password.";
          setError(message);
          return { ok: false as const, error: message };
        }

        return { ok: true as const };
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { login, isPending, error, setError };
}

export function useLogout() {
  const [isPending, setIsPending] = useState(false);

  const logout = useCallback(async () => {
    setIsPending(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setIsPending(false);
    }
  }, []);

  return { logout, isPending };
}

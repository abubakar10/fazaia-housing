"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { APP_FULL_NAME, APP_SHORT_NAME } from "@/lib/constants";
import { loginSchema, type LoginInput } from "@/features/auth/schemas/auth.schemas";
import { useAuth, useLogin } from "@/features/auth/hooks/use-auth";
import { TextField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo, FalconLoader } from "@/components/brand";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { update } = useAuth();
  const { login, isPending, error, setError } = useLogin();
  const reduceMotion = useReducedMotion();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);
    const result = await login(values);
    if (!result.ok) return;
    toast.success("Signed in successfully");
    await update();
    router.replace(callbackUrl);
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="relative overflow-hidden border-white/30 bg-white/92 shadow-[0_28px_80px_-28px_rgba(0,174,239,0.75)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(0,174,239,0.24),transparent_68%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_72%)]" />
        <CardHeader className="relative space-y-5">
          <div className="flex items-center gap-4">
            <BrandLogo size="lg" floating priority className="rounded-3xl" />
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary">
                {APP_SHORT_NAME}
              </p>
              <p className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
                {APP_FULL_NAME}
              </p>
            </div>
          </div>
          <div>
            <CardTitle className="font-display text-2xl tracking-tight">
              Sign in to {APP_SHORT_NAME}
            </CardTitle>
            <CardDescription className="mt-2 text-[15px] leading-relaxed">
              Access a modern housing operations dashboard with secure credentials.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {isPending ? (
            <FalconLoader label="Signing you in…" compact />
          ) : null}
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            hidden={isPending}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <TextField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="admin@afohs.local"
                required
                disabled={isPending}
              />
            </motion.div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TextField
                control={form.control}
                name="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                required
                disabled={isPending}
              />
            </motion.div>

            {error ? (
              <p
                className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" className="min-h-11 w-full shadow-glow" disabled={isPending}>
              Sign in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="relative flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
          <p className="text-xs text-muted-foreground">
            Demo admin: <span className="font-medium text-foreground">admin@afohs.local</span>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

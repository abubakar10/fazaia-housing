"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { APP_SHORT_NAME } from "@/lib/constants";
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
import { BrandLogo, BrandTitle, FalconLoader } from "@/components/brand";

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
      initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="glass-panel relative overflow-hidden rounded-3xl border-0 ring-0">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 gradient-primary opacity-[0.08]" />

        <CardHeader className="relative space-y-5 pb-2">
          <div className="flex items-center gap-4 lg:hidden">
            <BrandLogo size="lg" floating priority className="rounded-2xl" />
            <BrandTitle />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="mt-2 text-[15px] leading-relaxed">
              Sign in to <span className="font-semibold text-primary">{APP_SHORT_NAME}</span> to
              continue to your dashboard.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="relative">
          {isPending ? <FalconLoader label="Signing you in…" compact /> : null}
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            hidden={isPending}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
              transition={{ delay: 0.16 }}
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
                className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="min-h-12 w-full rounded-xl gradient-primary border-0 text-white shadow-glow hover:opacity-95"
              disabled={isPending}
            >
              Sign in
            </Button>
          </form>
        </CardContent>

        <CardFooter className="relative flex flex-col items-stretch gap-3 border-t-0 bg-transparent pt-0 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
          <p className="rounded-full bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground">
            Demo: <span className="font-medium text-foreground">admin@afohs.local</span>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

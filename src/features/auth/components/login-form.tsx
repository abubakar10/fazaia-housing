"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/constants";
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
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-white/10 bg-card/95 shadow-glow backdrop-blur-xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="lg" floating priority />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Falcon
              </p>
              <p className="text-sm text-muted-foreground">Housing ERP</p>
            </div>
          </div>
          <div>
            <CardTitle className="font-display text-2xl tracking-tight">
              Sign in to {APP_NAME}
            </CardTitle>
            <CardDescription className="mt-2 text-[15px] leading-relaxed">
              Use your organization credentials to access the construction ERP.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
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
                placeholder="you@organization.com"
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
        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
          <p className="text-xs text-muted-foreground">
            Protected by secure session cookies
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

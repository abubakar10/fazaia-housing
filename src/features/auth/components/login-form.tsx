"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/constants";
import { loginSchema, type LoginInput } from "@/features/auth/schemas/auth.schemas";
import { useLogin } from "@/features/auth/hooks/use-auth";
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

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { login, isPending, error, setError } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);
    const result = await login(values);
    if (!result.ok) return;
    toast.success("Signed in successfully");
    // Hard navigation avoids a slow RSC refresh waterfall after credentials sign-in.
    window.location.assign(callbackUrl);
  }

  return (
    <Card className="border-border/70 bg-card/80 shadow-soft backdrop-blur-xl">
      <CardHeader className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <span className="font-display text-sm font-semibold">FH</span>
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
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="you@organization.com"
            required
            disabled={isPending}
          />
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
            disabled={isPending}
          />

          {error ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="min-h-11 w-full" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in"}
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
  );
}

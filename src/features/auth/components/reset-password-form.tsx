"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/auth/schemas/auth.schemas";
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

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);

  const emailFromLink = searchParams.get("email") ?? "";
  const tokenFromLink = searchParams.get("token") ?? "";
  const hasLinkParams = !!emailFromLink && !!tokenFromLink;

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromLink,
      token: tokenFromLink,
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setIsPending(true);
    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Unable to reset password");
      }
      toast.success(payload.data.message);
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/80 shadow-soft backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="font-display text-2xl tracking-tight">
          Reset password
        </CardTitle>
        <CardDescription className="text-[15px] leading-relaxed">
          {hasLinkParams
            ? "Choose a new password for your account."
            : "Open the reset link from your email, or paste the details below."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {hasLinkParams ? (
            <>
              <input type="hidden" {...form.register("email")} />
              <input type="hidden" {...form.register("token")} />
              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                <p className="text-muted-foreground">Resetting password for</p>
                <p className="font-medium">{emailFromLink}</p>
              </div>
            </>
          ) : (
            <>
              <TextField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                required
                disabled={isPending}
              />
              <TextField
                control={form.control}
                name="token"
                label="Reset token"
                required
                disabled={isPending}
                hint="Copy the token from your reset email link if needed"
              />
            </>
          )}
          <TextField
            control={form.control}
            name="password"
            label="New password"
            type="password"
            required
            disabled={isPending}
            hint="At least 8 characters with a letter and a number"
          />
          <TextField
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            type="password"
            required
            disabled={isPending}
          />
          <Button type="submit" className="min-h-11 w-full" disabled={isPending}>
            {isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

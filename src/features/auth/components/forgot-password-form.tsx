"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/schemas/auth.schemas";
import { TextField } from "@/components/forms";
import { BrandLogo, FalconLoader } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setIsPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Request failed");
      }
      setMessage(payload.data.message);
      toast.success("Request submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
    <Card className="border-white/10 bg-card/95 shadow-glow backdrop-blur-xl">
      <CardHeader className="space-y-4">
        <BrandLogo size="md" floating priority />
        <CardTitle className="font-display text-2xl tracking-tight">
          Forgot password
        </CardTitle>
        <CardDescription className="text-[15px] leading-relaxed">
          Enter your email and we will send reset instructions if an account
          exists.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? <FalconLoader compact label="Sending reset link…" /> : null}
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate hidden={isPending}>
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="you@organization.com"
            required
            disabled={isPending}
          />
          {message ? (
            <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {message}
            </p>
          ) : null}
          <Button type="submit" className="min-h-11 w-full" disabled={isPending}>
            {isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
    </motion.div>
  );
}

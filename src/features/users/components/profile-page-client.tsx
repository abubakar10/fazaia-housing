"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader, PageMotion } from "@/components/layout";
import { ErrorState, PageSkeleton } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms";
import { updateProfileSchema } from "../schemas/user.schemas";
import { useMeQuery, useUpdateProfileMutation } from "../hooks/use-users";

const formSchema = updateProfileSchema.extend({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  avatarUrl: z
    .union([z.string().url().max(500), z.literal("")])
    .optional()
    .nullable(),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

export function ProfilePageClient() {
  const meQuery = useMeQuery();
  const updateMutation = useUpdateProfileMutation();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (!meQuery.data) return;
    form.reset({
      name: meQuery.data.name,
      phone: meQuery.data.phone ?? "",
      avatarUrl: meQuery.data.avatarUrl ?? "",
    });
  }, [meQuery.data, form]);

  async function onSubmit(values: FormValues) {
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        phone: values.phone || null,
        avatarUrl: values.avatarUrl ? values.avatarUrl : null,
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  if (meQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <ErrorState
        title="Could not load profile"
        description={
          meQuery.error instanceof Error
            ? meQuery.error.message
            : "Please try again."
        }
        onRetry={() => meQuery.refetch()}
      />
    );
  }

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title="My profile"
        description="Update your personal details. Email changes require an admin."
      />

      <form
        className="mx-auto max-w-xl space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
          <p className="text-muted-foreground">Signed in as</p>
          <p className="font-medium">{meQuery.data.email}</p>
        </div>
        <TextField control={form.control} name="name" label="Full name" required />
        <TextField control={form.control} name="phone" label="Phone" />
        <TextField
          control={form.control}
          name="avatarUrl"
          label="Avatar URL"
          hint="Optional image URL"
        />
        <Button type="submit" className="min-h-11" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </PageMotion>
  );
}

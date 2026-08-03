"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, KeyRound } from "lucide-react";
import { PageHeader, PageMotion } from "@/components/layout";
import { ErrorState, PageSkeleton } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField, SelectField } from "@/components/forms";
import { updateUserSchema } from "../schemas/user.schemas";
import {
  useLinkOptionsQuery,
  useResetPasswordMutation,
  useUpdateUserMutation,
  useUserQuery,
} from "../hooks/use-users";
import { UserAccessPanel } from "@/features/rbac/components/user-access-panel";
import { useOrgTreeQuery } from "@/features/organization/hooks/use-organization";
import type { OrgTreeNode } from "@/features/organization/mappers";

const formSchema = updateUserSchema.extend({
  employeeId: z.string().optional().nullable(),
  contractorId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

function normalizeLinkId(value?: string | null) {
  if (!value || value === "__none__") return null;
  return value;
}

function flattenOrgOptions(
  nodes: OrgTreeNode[],
  depth = 0,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  for (const node of nodes) {
    rows.push({
      value: node.id,
      label: `${"— ".repeat(depth)}${node.code} — ${node.name}`,
    });
    rows.push(...flattenOrgOptions(node.children, depth + 1));
  }
  return rows;
}

export function UserDetailClient({ userId }: { userId: string }) {
  const userQuery = useUserQuery(userId);
  const linkOptions = useLinkOptionsQuery();
  const orgTreeQuery = useOrgTreeQuery();
  const updateMutation = useUpdateUserMutation(userId);
  const resetMutation = useResetPasswordMutation(userId);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      status: "ACTIVE",
      orgUnitId: "__none__",
      employeeId: "__none__",
      contractorId: "__none__",
    },
  });

  useEffect(() => {
    if (!userQuery.data) return;
    form.reset({
      name: userQuery.data.name,
      phone: userQuery.data.phone ?? "",
      status: userQuery.data.status,
      orgUnitId: userQuery.data.orgUnitId ?? "__none__",
      employeeId: userQuery.data.employee?.id ?? "__none__",
      contractorId: userQuery.data.contractor?.id ?? "__none__",
    });
  }, [userQuery.data, form]);

  async function onSubmit(values: FormValues) {
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        phone: values.phone,
        status: values.status,
        orgUnitId: normalizeLinkId(values.orgUnitId),
        employeeId: normalizeLinkId(values.employeeId),
        contractorId: normalizeLinkId(values.contractorId),
      });
      toast.success("User updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function onResetPassword() {
    try {
      const result = await resetMutation.mutateAsync({
        generateTemporary: true,
        sendEmail: true,
      });
      toast.success(
        result.temporaryPassword
          ? `Password reset. Temporary: ${result.temporaryPassword}`
          : "Password reset email sent",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
    }
  }

  if (userQuery.isLoading) return <PageSkeleton />;
  if (userQuery.isError || !userQuery.data) {
    return (
      <ErrorState
        description={userQuery.error?.message ?? "User not found"}
        onRetry={() => userQuery.refetch()}
      />
    );
  }

  const user = userQuery.data;

  const employeeOptions = [
    { label: "No employee link", value: "__none__" },
    ...(linkOptions.data?.employees.map((e) => ({
      label: `${e.code} — ${e.name}`,
      value: e.id,
      disabled: !!e.userId && e.userId !== userId,
    })) ?? []),
  ];

  const contractorOptions = [
    { label: "No contractor link", value: "__none__" },
    ...(linkOptions.data?.contractors.map((c) => ({
      label: `${c.code} — ${c.name}`,
      value: c.id,
      disabled: !!c.primaryUserId && c.primaryUserId !== userId,
    })) ?? []),
  ];

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/admin/users">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={onResetPassword}
              disabled={resetMutation.isPending}
            >
              <KeyRound className="size-4" />
              Reset password
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge>{user.status}</Badge>
        {user.employee ? (
          <Badge variant="secondary">Employee {user.employee.code}</Badge>
        ) : null}
        {user.contractor ? (
          <Badge variant="secondary">Contractor {user.contractor.code}</Badge>
        ) : null}
        {user.orgUnit ? (
          <Badge variant="outline">Org {user.orgUnit.code}</Badge>
        ) : null}
      </div>

      <form
        className="grid max-w-2xl gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <TextField control={form.control} name="name" label="Full name" required />
        <TextField control={form.control} name="phone" label="Phone" />
        <SelectField
          control={form.control}
          name="status"
          label="Status"
          options={[
            { label: "Active", value: "ACTIVE" },
            { label: "Invited", value: "INVITED" },
            { label: "Inactive", value: "INACTIVE" },
            { label: "Locked", value: "LOCKED" },
          ]}
        />
        <SelectField
          control={form.control}
          name="orgUnitId"
          label="Organization unit"
          options={[
            { label: "No organization unit", value: "__none__" },
            ...flattenOrgOptions(orgTreeQuery.data ?? []),
          ]}
        />
        <SelectField
          control={form.control}
          name="employeeId"
          label="Linked employee"
          options={employeeOptions}
        />
        <SelectField
          control={form.control}
          name="contractorId"
          label="Linked contractor"
          options={contractorOptions}
        />
        <div className="flex justify-end">
          <Button type="submit" className="min-h-11" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <UserAccessPanel userId={userId} />
    </PageMotion>
  );
}

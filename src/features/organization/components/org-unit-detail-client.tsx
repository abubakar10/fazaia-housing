"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PageHeader, PageMotion } from "@/components/layout";
import { ErrorState, PageSkeleton } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/forms";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { Can } from "@/features/rbac/components/can";
import { updateOrgUnitSchema } from "../schemas/org.schemas";
import {
  useAssignOrgUsersMutation,
  useAssignableUsersQuery,
  useOrgBreadcrumbQuery,
  useOrgMembersQuery,
  useOrgTreeQuery,
  useOrgUnitQuery,
  useUpdateOrgUnitMutation,
} from "../hooks/use-organization";
import type { OrgTreeNode } from "../mappers";

const formSchema = updateOrgUnitSchema.extend({
  name: z.string().trim().min(2).max(160),
  parentId: z.string().optional().nullable(),
});
type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

function flattenTree(
  nodes: OrgTreeNode[],
  depth = 0,
  excludeId?: string,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    rows.push({
      value: node.id,
      label: `${"— ".repeat(depth)}${node.code} — ${node.name}`,
    });
    rows.push(...flattenTree(node.children, depth + 1, excludeId));
  }
  return rows;
}

export function OrgUnitDetailClient({ orgUnitId }: { orgUnitId: string }) {
  const unitQuery = useOrgUnitQuery(orgUnitId);
  const breadcrumbQuery = useOrgBreadcrumbQuery(orgUnitId);
  const membersQuery = useOrgMembersQuery(orgUnitId);
  const assignableQuery = useAssignableUsersQuery({ enabled: true });
  const treeQuery = useOrgTreeQuery({ enabled: true });
  const updateMutation = useUpdateOrgUnitMutation(orgUnitId);
  const assignMutation = useAssignOrgUsersMutation(orgUnitId);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "REGION",
      status: "ACTIVE",
      parentId: "__none__",
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (!unitQuery.data) return;
    form.reset({
      name: unitQuery.data.name,
      code: unitQuery.data.code,
      type: unitQuery.data.type,
      status: unitQuery.data.status,
      parentId: unitQuery.data.parentId ?? "__none__",
      sortOrder: unitQuery.data.sortOrder,
    });
  }, [unitQuery.data, form]);

  useEffect(() => {
    if (!membersQuery.data) return;
    setSelectedUserIds(membersQuery.data.map((m) => m.id));
  }, [membersQuery.data]);

  async function onSubmit(values: FormValues) {
    try {
      await updateMutation.mutateAsync({
        ...values,
        parentId:
          !values.parentId || values.parentId === "__none__"
            ? null
            : values.parentId,
      });
      toast.success("Organization unit updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function onSaveMembers() {
    try {
      await assignMutation.mutateAsync({ userIds: selectedUserIds });
      toast.success("User assignments saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assign failed");
    }
  }

  if (unitQuery.isLoading) return <PageSkeleton />;
  if (unitQuery.isError || !unitQuery.data) {
    return (
      <ErrorState
        description={unitQuery.error?.message ?? "Organization unit not found"}
        onRetry={() => unitQuery.refetch()}
      />
    );
  }

  const unit = unitQuery.data;
  const parentOptions = [
    { label: "No parent (root)", value: "__none__" },
    ...flattenTree(treeQuery.data ?? [], 0, orgUnitId),
  ];

  return (
    <PageMotion className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
        <Link href="/organization" className="text-muted-foreground hover:text-foreground">
          Organization
        </Link>
        {(breadcrumbQuery.data ?? []).map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 text-muted-foreground" />
            {crumb.id === orgUnitId ? (
              <span className="font-medium">{crumb.name}</span>
            ) : (
              <Link
                href={`/organization/${crumb.id}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <PageHeader
        title={unit.name}
        description={unit.code}
        actions={
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/organization">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{unit.type}</Badge>
        <Badge variant={unit.status === "ACTIVE" ? "default" : "secondary"}>
          {unit.status}
        </Badge>
        <Badge variant="secondary">{unit.childCount} children</Badge>
        <Badge variant="secondary">{unit.activeUserCount} active users</Badge>
      </div>

      <Can permission={PERMISSIONS.ORG_UPDATE}>
        <form
          className="grid max-w-2xl gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <TextField control={form.control} name="code" label="Code" required />
          <TextField control={form.control} name="name" label="Name" required />
          <SelectField
            control={form.control}
            name="type"
            label="Type"
            options={[
              { label: "HQ", value: "HQ" },
              { label: "Region", value: "REGION" },
              { label: "Division", value: "DIVISION" },
              { label: "Site", value: "SITE" },
              { label: "Office", value: "OFFICE" },
              { label: "Store", value: "STORE" },
              { label: "Finance", value: "FINANCE" },
              { label: "Other", value: "OTHER" },
            ]}
          />
          <SelectField
            control={form.control}
            name="status"
            label="Status"
            options={[
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ]}
          />
          <SelectField
            control={form.control}
            name="parentId"
            label="Parent"
            options={parentOptions}
          />
          <p className="text-xs text-muted-foreground">
            Sort order is stored for future drag-and-drop reordering within a parent.
          </p>
          <div className="flex justify-end">
            <Button type="submit" className="min-h-11" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Can>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Assigned users</h2>
            <p className="text-sm text-muted-foreground">
              Place users into this organization unit. Visibility follows org scope.
            </p>
          </div>
          <Can permission={PERMISSIONS.ORG_UPDATE}>
            <Button
              className="min-h-11"
              onClick={onSaveMembers}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? "Saving…" : "Save assignments"}
            </Button>
          </Can>
        </div>

        <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
          {(assignableQuery.data ?? []).map((user) => {
            const checked = selectedUserIds.includes(user.id);
            return (
              <label
                key={user.id}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => {
                    setSelectedUserIds((prev) =>
                      checked
                        ? prev.filter((id) => id !== user.id)
                        : [...prev, user.id],
                    );
                  }}
                />
                <span>
                  <span className="font-medium">{user.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {user.email}
                    {user.orgUnitId && user.orgUnitId !== orgUnitId
                      ? " · assigned elsewhere"
                      : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>
    </PageMotion>
  );
}

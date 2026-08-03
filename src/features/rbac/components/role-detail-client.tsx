"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader, PageMotion } from "@/components/layout";
import { ErrorState, PageSkeleton } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms";
import { PERMISSIONS, SYSTEM_ROLE_CODES } from "@/domain/policies/permissions";
import { Can } from "./can";
import { updateRoleSchema } from "../schemas/rbac.schemas";
import {
  useAllPermissionsQuery,
  useRoleQuery,
  useSetRolePermissionsMutation,
  useUpdateRoleMutation,
} from "../hooks/use-rbac";

const formSchema = updateRoleSchema.extend({
  name: z.string().trim().min(2).max(120),
});
type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

export function RoleDetailClient({ roleId }: { roleId: string }) {
  const roleQuery = useRoleQuery(roleId);
  const permissionsQuery = useAllPermissionsQuery();
  const updateMutation = useUpdateRoleMutation(roleId);
  const setPermissionsMutation = useSetRolePermissionsMutation(roleId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moduleFilter, setModuleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!roleQuery.data) return;
    form.reset({
      name: roleQuery.data.name,
      description: roleQuery.data.description ?? "",
      globalRead: roleQuery.data.globalRead,
    });
    setSelected(new Set(roleQuery.data.permissions.map((p) => p.code)));
  }, [roleQuery.data, form]);

  const modules = useMemo(() => {
    const set = new Set(permissionsQuery.data?.map((p) => p.module) ?? []);
    return ["all", ...[...set].sort()];
  }, [permissionsQuery.data]);

  const filteredPermissions = useMemo(() => {
    return (permissionsQuery.data ?? []).filter((p) => {
      if (moduleFilter !== "all" && p.module !== moduleFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.code.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [permissionsQuery.data, moduleFilter, search]);

  const isSuperAdmin =
    roleQuery.data?.code === SYSTEM_ROLE_CODES.SUPER_ADMIN;

  async function onSaveProfile(values: FormValues) {
    try {
      await updateMutation.mutateAsync(values);
      toast.success("Role updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function onSavePermissions() {
    try {
      await setPermissionsMutation.mutateAsync({
        permissionCodes: [...selected],
      });
      toast.success("Permissions updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleModule(module: string, enable: boolean) {
    const codes =
      permissionsQuery.data
        ?.filter((p) => p.module === module)
        .map((p) => p.code) ?? [];
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of codes) {
        if (enable) next.add(code);
        else next.delete(code);
      }
      return next;
    });
  }

  if (roleQuery.isLoading || permissionsQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (roleQuery.isError || !roleQuery.data) {
    return (
      <ErrorState
        description={roleQuery.error?.message ?? "Role not found"}
        onRetry={() => roleQuery.refetch()}
      />
    );
  }

  const role = roleQuery.data;

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title={role.name}
        description={role.code}
        actions={
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/admin/roles">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {role.isSystem ? <Badge variant="secondary">System</Badge> : null}
        {role.globalRead ? <Badge>Global read</Badge> : null}
        <Badge variant="outline">{role.permissions.length} permissions</Badge>
        <Badge variant="outline">{role.userCount} users</Badge>
      </div>

      <Can permission={PERMISSIONS.ROLES_UPDATE}>
        <form
          className="grid max-w-2xl gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-6"
          onSubmit={form.handleSubmit(onSaveProfile)}
        >
          <TextField control={form.control} name="name" label="Name" required />
          <TextField
            control={form.control}
            name="description"
            label="Description"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              className="min-h-11"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save details"}
            </Button>
          </div>
        </form>
      </Can>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Permission matrix</h2>
            <p className="text-sm text-muted-foreground">
              {isSuperAdmin
                ? "SUPER_ADMIN always receives every permission."
                : "Toggle permissions for this role. DENY overrides still apply per user."}
            </p>
          </div>
          <Can permission={PERMISSIONS.ROLES_UPDATE}>
            <Button
              className="min-h-11"
              disabled={isSuperAdmin || setPermissionsMutation.isPending}
              onClick={onSavePermissions}
            >
              {setPermissionsMutation.isPending ? "Saving…" : "Save permissions"}
            </Button>
          </Can>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="min-h-11 flex-1 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary"
            placeholder="Search permissions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isSuperAdmin}
          />
          <select
            className="min-h-11 rounded-xl border border-border/70 bg-background px-3 text-sm"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            disabled={isSuperAdmin}
          >
            {modules.map((module) => (
              <option key={module} value={module}>
                {module === "all" ? "All modules" : module}
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
          {modules
            .filter((m) => m !== "all")
            .filter((m) => moduleFilter === "all" || moduleFilter === m)
            .map((module) => {
              const rows = filteredPermissions.filter((p) => p.module === module);
              if (!rows.length) return null;
              const allOn = rows.every((p) => selected.has(p.code));
              return (
                <div key={module} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold tracking-wide uppercase">
                      {module}
                    </h3>
                    {!isSuperAdmin ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleModule(module, !allOn)}
                      >
                        {allOn ? "Clear" : "Select all"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {rows.map((permission) => {
                      const checked = isSuperAdmin || selected.has(permission.code);
                      return (
                        <label
                          key={permission.code}
                          className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            disabled={isSuperAdmin}
                            onChange={() => toggle(permission.code)}
                          />
                          <span>
                            <span className="font-medium">{permission.code}</span>
                            {permission.description ? (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {permission.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </PageMotion>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { Can } from "./can";
import {
  useRolesQuery,
  useSetUserOverridesMutation,
  useSetUserRolesMutation,
  useUserOverridesQuery,
  useUserRolesQuery,
  useAllPermissionsQuery,
} from "../hooks/use-rbac";

type Props = { userId: string };

export function UserAccessPanel({ userId }: Props) {
  const rolesQuery = useRolesQuery({ page: 1, pageSize: 100, q: "" });
  const userRolesQuery = useUserRolesQuery(userId);
  const overridesQuery = useUserOverridesQuery(userId);
  const permissionsQuery = useAllPermissionsQuery();
  const setRolesMutation = useSetUserRolesMutation(userId);
  const setOverridesMutation = useSetUserOverridesMutation(userId);

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [denyCodes, setDenyCodes] = useState<string[]>([]);
  const [allowCodes, setAllowCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!userRolesQuery.data) return;
    // Global assignments only in the simple UI; scoped assignments remain API-capable.
    setSelectedRoleIds(
      userRolesQuery.data
        .filter((r) => r.scopeType === "GLOBAL")
        .map((r) => r.roleId),
    );
  }, [userRolesQuery.data]);

  useEffect(() => {
    if (!overridesQuery.data) return;
    setAllowCodes(
      overridesQuery.data
        .filter((o) => o.effect === "ALLOW" && o.scopeType === "GLOBAL")
        .map((o) => o.permissionCode),
    );
    setDenyCodes(
      overridesQuery.data
        .filter((o) => o.effect === "DENY" && o.scopeType === "GLOBAL")
        .map((o) => o.permissionCode),
    );
  }, [overridesQuery.data]);

  const scopedAssignments = useMemo(
    () =>
      (userRolesQuery.data ?? []).filter((r) => r.scopeType !== "GLOBAL"),
    [userRolesQuery.data],
  );

  function toggleRole(roleId: string) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  }

  async function saveRoles() {
    try {
      const scoped = (userRolesQuery.data ?? [])
        .filter((r) => r.scopeType !== "GLOBAL")
        .map((r) => ({
          roleId: r.roleId,
          scopeType: r.scopeType as "ORGANIZATION" | "PROJECT",
          orgUnitId: r.orgUnitId,
          projectId: r.projectId,
        }));

      await setRolesMutation.mutateAsync({
        assignments: [
          ...selectedRoleIds.map((roleId) => ({
            roleId,
            scopeType: "GLOBAL" as const,
          })),
          ...scoped,
        ],
      });
      toast.success("Roles updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function saveOverrides() {
    try {
      await setOverridesMutation.mutateAsync({
        overrides: [
          ...allowCodes.map((permissionCode) => ({
            permissionCode,
            effect: "ALLOW" as const,
            scopeType: "GLOBAL" as const,
          })),
          ...denyCodes.map((permissionCode) => ({
            permissionCode,
            effect: "DENY" as const,
            scopeType: "GLOBAL" as const,
          })),
        ],
      });
      toast.success("Permission overrides updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  const permissionOptions = permissionsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Roles</h2>
            <p className="text-sm text-muted-foreground">
              Assign global roles. Project/org-scoped assignments are preserved when saving.
            </p>
          </div>
          <Can permission={PERMISSIONS.ROLES_ASSIGN}>
            <Button
              className="min-h-11"
              onClick={saveRoles}
              disabled={setRolesMutation.isPending}
            >
              {setRolesMutation.isPending ? "Saving…" : "Save roles"}
            </Button>
          </Can>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {(rolesQuery.data?.data ?? []).map((role) => {
            const checked = selectedRoleIds.includes(role.id);
            return (
              <label
                key={role.id}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => toggleRole(role.id)}
                />
                <span>
                  <span className="font-medium">{role.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {role.code}
                    {role.isSystem ? " · system" : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {scopedAssignments.length ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Scoped assignments</p>
            <div className="flex flex-wrap gap-2">
              {scopedAssignments.map((a) => (
                <Badge key={a.id} variant="secondary">
                  {a.roleCode} · {a.scopeType}
                  {a.projectId ? ` · project ${a.projectId.slice(0, 8)}` : ""}
                  {a.orgUnitId ? ` · org ${a.orgUnitId.slice(0, 8)}` : ""}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Permission overrides</h2>
            <p className="text-sm text-muted-foreground">
              DENY always wins over role grants and ALLOW overrides.
            </p>
          </div>
          <Can permission={PERMISSIONS.ROLES_ASSIGN}>
            <Button
              className="min-h-11"
              onClick={saveOverrides}
              disabled={setOverridesMutation.isPending}
            >
              {setOverridesMutation.isPending ? "Saving…" : "Save overrides"}
            </Button>
          </Can>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <OverridePicker
            title="ALLOW"
            value={allowCodes}
            options={permissionOptions.map((p) => p.code)}
            onChange={setAllowCodes}
          />
          <OverridePicker
            title="DENY"
            value={denyCodes}
            options={permissionOptions.map((p) => p.code)}
            onChange={setDenyCodes}
          />
        </div>
      </section>
    </div>
  );
}

function OverridePicker({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string[];
  options: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="flex gap-2">
        <select
          className="min-h-11 flex-1 rounded-xl border border-border/70 bg-background px-3 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        >
          <option value="">Select permission…</option>
          {options.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            if (!draft || value.includes(draft)) return;
            onChange([...value, draft]);
            setDraft("");
          }}
        >
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((code) => (
          <Badge
            key={code}
            variant={title === "DENY" ? "destructive" : "secondary"}
            className="cursor-pointer"
            onClick={() => onChange(value.filter((c) => c !== code))}
          >
            {code} ×
          </Badge>
        ))}
        {!value.length ? (
          <span className="text-xs text-muted-foreground">None</span>
        ) : null}
      </div>
    </div>
  );
}

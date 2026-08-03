import { redirect } from "next/navigation";
import { RolesPageClient } from "@/features/rbac/components/roles-page-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

export default async function AdminRolesPage() {
  try {
    await assertPagePermission(PERMISSIONS.ROLES_READ);
  } catch {
    redirect("/");
  }
  return <RolesPageClient />;
}

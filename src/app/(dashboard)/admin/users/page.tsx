import { redirect } from "next/navigation";
import { UsersPageClient } from "@/features/users/components/users-page-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

export default async function AdminUsersPage() {
  try {
    await assertPagePermission(PERMISSIONS.USERS_READ);
  } catch {
    redirect("/");
  }
  return <UsersPageClient />;
}

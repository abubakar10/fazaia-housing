import { redirect } from "next/navigation";
import { RoleDetailClient } from "@/features/rbac/components/role-detail-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

type Props = { params: Promise<{ id: string }> };

export default async function AdminRoleDetailPage({ params }: Props) {
  try {
    await assertPagePermission(PERMISSIONS.ROLES_READ);
  } catch {
    redirect("/");
  }
  const { id } = await params;
  return <RoleDetailClient roleId={id} />;
}

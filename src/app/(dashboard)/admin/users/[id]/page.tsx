import { redirect } from "next/navigation";
import { UserDetailClient } from "@/features/users/components/user-detail-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserDetailPage({ params }: Props) {
  try {
    await assertPagePermission(PERMISSIONS.USERS_READ);
  } catch {
    redirect("/");
  }
  const { id } = await params;
  return <UserDetailClient userId={id} />;
}

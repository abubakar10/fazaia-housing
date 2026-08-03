import { redirect } from "next/navigation";
import { OrgUnitDetailClient } from "@/features/organization/components/org-unit-detail-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

type Props = { params: Promise<{ id: string }> };

export default async function OrganizationDetailPage({ params }: Props) {
  try {
    await assertPagePermission(PERMISSIONS.ORG_READ);
  } catch {
    redirect("/");
  }
  const { id } = await params;
  return <OrgUnitDetailClient orgUnitId={id} />;
}

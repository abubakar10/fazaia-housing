import { redirect } from "next/navigation";
import { OrganizationPageClient } from "@/features/organization/components/organization-page-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

export default async function OrganizationPage() {
  try {
    await assertPagePermission(PERMISSIONS.ORG_READ);
  } catch {
    redirect("/");
  }
  return <OrganizationPageClient />;
}

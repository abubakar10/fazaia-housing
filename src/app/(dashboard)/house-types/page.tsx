import { redirect } from "next/navigation";
import { HouseTypesPageClient } from "@/features/houses/components/house-types-page-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

export default async function HouseTypesPage() {
  try {
    await assertPagePermission(PERMISSIONS.HOUSES_READ);
  } catch {
    redirect("/");
  }
  return <HouseTypesPageClient />;
}

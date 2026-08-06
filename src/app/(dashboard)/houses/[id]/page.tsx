import { Suspense } from "react";
import { redirect } from "next/navigation";
import { HouseDetailClient } from "@/features/houses/components/house-detail-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

type PageProps = { params: Promise<{ id: string }> };

export default async function HouseDetailPage({ params }: PageProps) {
  try {
    await assertPagePermission(PERMISSIONS.HOUSES_READ);
  } catch {
    redirect("/projects");
  }
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <HouseDetailClient houseId={id} />
    </Suspense>
  );
}

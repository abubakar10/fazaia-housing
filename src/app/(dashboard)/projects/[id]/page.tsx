import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ProjectDetailClient } from "@/features/projects/components/project-detail-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: PageProps) {
  try {
    await assertPagePermission(PERMISSIONS.PROJECTS_READ);
  } catch {
    redirect("/projects");
  }
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <ProjectDetailClient projectId={id} />
    </Suspense>
  );
}

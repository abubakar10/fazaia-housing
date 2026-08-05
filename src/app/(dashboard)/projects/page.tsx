import { redirect } from "next/navigation";
import { ProjectsPageClient } from "@/features/projects/components/projects-page-client";
import { assertPagePermission } from "@/features/rbac/server/assert-page-permission";
import { PERMISSIONS } from "@/domain/policies/permissions";

export default async function ProjectsPage() {
  try {
    await assertPagePermission(PERMISSIONS.PROJECTS_READ);
  } catch {
    redirect("/");
  }
  return <ProjectsPageClient />;
}

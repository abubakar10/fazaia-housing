"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, TextareaField } from "@/components/forms";
import type { ProjectDto } from "../mappers";
import { updateProjectSchema } from "../schemas/project.schemas";
import { useUpdateProjectMutation } from "../hooks/use-projects";
import { useOrgTreeQuery } from "@/features/organization/hooks/use-organization";
import type { OrgTreeNode } from "@/features/organization/mappers";
import { useUsersQuery } from "@/features/users/hooks/use-users";

type Props = {
  project: ProjectDto;
  readOnly?: boolean;
};

const STATUS_OPTIONS = [
  { label: "Planning", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

const TYPE_OPTIONS = [
  { label: "Residential", value: "RESIDENTIAL" },
  { label: "Commercial", value: "COMMERCIAL" },
  { label: "Mixed use", value: "MIXED_USE" },
  { label: "Infrastructure", value: "INFRASTRUCTURE" },
  { label: "Renovation", value: "RENOVATION" },
  { label: "Other", value: "OTHER" },
];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

function flattenTree(
  nodes: OrgTreeNode[],
  depth = 0,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  for (const node of nodes) {
    rows.push({
      value: node.id,
      label: `${"— ".repeat(depth)}${node.code} — ${node.name}`,
    });
    rows.push(...flattenTree(node.children, depth + 1));
  }
  return rows;
}

export function ProjectSettingsForm({ project, readOnly }: Props) {
  const updateMutation = useUpdateProjectMutation(project.id);
  const treeQuery = useOrgTreeQuery({ enabled: true });
  const usersQuery = useUsersQuery({
    page: 1,
    pageSize: 100,
    q: "",
    status: "ACTIVE",
    sort: "name",
    order: "asc",
  });

  const form = useForm({
    resolver: zodResolver(updateProjectSchema),
    values: {
      name: project.name,
      description: project.description,
      location: project.location,
      status: project.status as "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED",
      projectType: project.projectType as "RESIDENTIAL" | "COMMERCIAL" | "MIXED_USE" | "INFRASTRUCTURE" | "RENOVATION" | "OTHER",
      projectPriority: project.projectPriority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      clientOwner: project.clientOwner,
      consultant: project.consultant,
      fiscalYear: project.fiscalYear,
      gpsLatitude: project.gpsLatitude,
      gpsLongitude: project.gpsLongitude,
      logoUrl: project.logoUrl,
      internalNotes: project.internalNotes,
      currencyCode: project.currencyCode,
      timezone: project.timezone,
      orgUnitId: project.orgUnitId ?? "__none__",
      projectManagerId: project.projectManagerId ?? "__none__",
      mainContractorId: project.mainContractorId ?? "__none__",
    },
  });

  const orgOptions = [
    { label: "None", value: "__none__" },
    ...flattenTree(treeQuery.data ?? []),
  ];

  const managerOptions = [
    { label: "None", value: "__none__" },
    ...(usersQuery.data?.data ?? []).map((u) => ({
      label: `${u.name} (${u.email})`,
      value: u.id,
    })),
  ];

  const contractorOptions = [
    { label: "None", value: "__none__" },
    ...(usersQuery.data?.data ?? [])
      .filter((u) => u.contractor)
      .map((u) => ({
        label: `${u.contractor!.name} (${u.contractor!.code})`,
        value: u.contractor!.id,
      })),
  ];

  async function onSubmit(values: import("../schemas/project.schemas").UpdateProjectInput) {
    try {
      await updateMutation.mutateAsync({
        ...values,
        orgUnitId:
          values.orgUnitId === "__none__" || !values.orgUnitId
            ? null
            : values.orgUnitId,
        projectManagerId:
          values.projectManagerId === "__none__" || !values.projectManagerId
            ? null
            : values.projectManagerId,
        mainContractorId:
          values.mainContractorId === "__none__" || !values.mainContractorId
            ? null
            : values.mainContractorId,
      });
      toast.success("Project settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      <TextField control={form.control} name="name" label="Name" required disabled={readOnly} />
      <SelectField
        control={form.control}
        name="status"
        label="Status"
        options={STATUS_OPTIONS}
        disabled={readOnly}
      />
      <SelectField
        control={form.control}
        name="projectType"
        label="Project type"
        options={TYPE_OPTIONS}
        disabled={readOnly}
      />
      <SelectField
        control={form.control}
        name="projectPriority"
        label="Priority"
        options={PRIORITY_OPTIONS}
        disabled={readOnly}
      />
      <TextField control={form.control} name="clientOwner" label="Client / owner" disabled={readOnly} />
      <TextField control={form.control} name="consultant" label="Consultant" disabled={readOnly} />
      <SelectField
        control={form.control}
        name="mainContractorId"
        label="Main contractor"
        options={contractorOptions}
        disabled={readOnly}
      />
      <TextField
        control={form.control}
        name="fiscalYear"
        label="Fiscal year"
        type="number"
        disabled={readOnly}
      />
      <SelectField
        control={form.control}
        name="orgUnitId"
        label="Organization unit"
        options={orgOptions}
        disabled={readOnly}
      />
      <SelectField
        control={form.control}
        name="projectManagerId"
        label="Project manager"
        options={managerOptions}
        disabled={readOnly}
      />
      <TextareaField
        control={form.control}
        name="description"
        label="Description"
        className="md:col-span-2"
        disabled={readOnly}
      />
      <TextField control={form.control} name="location" label="Location" disabled={readOnly} />
      <TextField control={form.control} name="currencyCode" label="Currency" disabled={readOnly} />
      <TextField control={form.control} name="timezone" label="Timezone" disabled={readOnly} />
      <TextField
        control={form.control}
        name="gpsLatitude"
        label="GPS latitude"
        type="number"
        disabled={readOnly}
      />
      <TextField
        control={form.control}
        name="gpsLongitude"
        label="GPS longitude"
        type="number"
        disabled={readOnly}
      />
      <TextField control={form.control} name="logoUrl" label="Project logo URL" disabled={readOnly} />
      <TextareaField
        control={form.control}
        name="internalNotes"
        label="Internal notes"
        className="md:col-span-2"
        disabled={readOnly}
      />
      <p className="text-xs text-muted-foreground md:col-span-2">
        Default warehouse assignment is reserved for Module 15.
      </p>
      {!readOnly ? (
        <div className="md:col-span-2">
          <Button type="submit" className="min-h-11" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

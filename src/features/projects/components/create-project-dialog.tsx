"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, TextareaField } from "@/components/forms";
import { z } from "zod";
import { createProjectSchema } from "../schemas/project.schemas";
import { useCreateProjectMutation } from "../hooks/use-projects";
import { useOrgTreeQuery } from "@/features/organization/hooks/use-organization";
import type { OrgTreeNode } from "@/features/organization/mappers";
import { useUsersQuery } from "@/features/users/hooks/use-users";

const formSchema = createProjectSchema.extend({
  orgUnitId: z.string().optional().nullable(),
  projectManagerId: z.string().optional().nullable(),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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

const STATUS_OPTIONS = [
  { label: "Planning", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "On Hold", value: "ON_HOLD" },
];

export function CreateProjectDialog({ open, onOpenChange }: Props) {
  const createMutation = useCreateProjectMutation();
  const treeQuery = useOrgTreeQuery({ enabled: open });
  const usersQuery = useUsersQuery({
    page: 1,
    pageSize: 100,
    q: "",
    status: "ACTIVE",
    sort: "name",
    order: "asc",
  });

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      status: "DRAFT",
      currencyCode: "PKR",
      timezone: "Asia/Karachi",
      orgUnitId: "__none__",
      projectManagerId: "__none__",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const project = await createMutation.mutateAsync({
        ...values,
        orgUnitId:
          !values.orgUnitId || values.orgUnitId === "__none__"
            ? null
            : values.orgUnitId,
        projectManagerId:
          !values.projectManagerId || values.projectManagerId === "__none__"
            ? null
            : values.projectManagerId,
      });
      toast.success(`Project ${project.code} created`);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    }
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Project code is auto-generated (e.g. PRJ-2026-0001).
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField control={form.control} name="name" label="Name" required />
          <TextareaField
            control={form.control}
            name="description"
            label="Description"
          />
          <TextField control={form.control} name="location" label="Location" />
          <SelectField
            control={form.control}
            name="status"
            label="Status"
            options={STATUS_OPTIONS}
          />
          <SelectField
            control={form.control}
            name="orgUnitId"
            label="Organization unit"
            options={orgOptions}
            placeholder="Select org unit"
          />
          <SelectField
            control={form.control}
            name="projectManagerId"
            label="Project manager"
            options={managerOptions}
            placeholder="Select manager"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="currencyCode"
              label="Currency"
            />
            <TextField control={form.control} name="timezone" label="Timezone" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

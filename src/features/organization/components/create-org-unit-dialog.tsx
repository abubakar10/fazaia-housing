"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { TextField, SelectField } from "@/components/forms";
import { createOrgUnitSchema } from "../schemas/org.schemas";
import {
  useCreateOrgUnitMutation,
  useOrgTreeQuery,
} from "../hooks/use-organization";
import type { OrgTreeNode } from "../mappers";

const formSchema = createOrgUnitSchema.extend({
  parentId: z.string().optional().nullable(),
});
type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultParentId?: string | null;
};

function flattenTree(nodes: OrgTreeNode[], depth = 0): Array<{ label: string; value: string }> {
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

export function CreateOrgUnitDialog({
  open,
  onOpenChange,
  defaultParentId = null,
}: Props) {
  const createMutation = useCreateOrgUnitMutation();
  const treeQuery = useOrgTreeQuery({ enabled: open });

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "REGION",
      status: "ACTIVE",
      parentId: defaultParentId ?? "__none__",
      sortOrder: 0,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync({
        ...values,
        parentId:
          !values.parentId || values.parentId === "__none__"
            ? null
            : values.parentId,
      });
      toast.success("Organization unit created");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    }
  }

  const parentOptions = [
    { label: "No parent (root)", value: "__none__" },
    ...flattenTree(treeQuery.data ?? []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create organization unit</DialogTitle>
          <DialogDescription>
            Add a unit anywhere in the hierarchy. Nesting depth is unlimited.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField control={form.control} name="code" label="Code" required />
          <TextField control={form.control} name="name" label="Name" required />
          <SelectField
            control={form.control}
            name="type"
            label="Type"
            options={[
              { label: "HQ", value: "HQ" },
              { label: "Region", value: "REGION" },
              { label: "Division", value: "DIVISION" },
              { label: "Site", value: "SITE" },
              { label: "Office", value: "OFFICE" },
              { label: "Store", value: "STORE" },
              { label: "Finance", value: "FINANCE" },
              { label: "Other", value: "OTHER" },
            ]}
          />
          <SelectField
            control={form.control}
            name="status"
            label="Status"
            options={[
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ]}
          />
          <SelectField
            control={form.control}
            name="parentId"
            label="Parent"
            options={parentOptions}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-h-11" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

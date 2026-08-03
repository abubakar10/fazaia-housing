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
import { createUserSchema } from "../schemas/user.schemas";
import { useCreateUserMutation, useLinkOptionsQuery } from "../hooks/use-users";

const formSchema = createUserSchema.extend({
  employeeId: z.string().optional().nullable(),
  contractorId: z.string().optional().nullable(),
  password: z.string().optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function normalizeLinkId(value?: string | null) {
  if (!value || value === "__none__") return null;
  return value;
}

export function CreateUserDialog({ open, onOpenChange }: Props) {
  const createMutation = useCreateUserMutation();
  const linkOptions = useLinkOptionsQuery();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      status: "ACTIVE",
      employeeId: "__none__",
      contractorId: "__none__",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const result = await createMutation.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        status: values.status,
        password: values.password || undefined,
        employeeId: normalizeLinkId(values.employeeId),
        contractorId: normalizeLinkId(values.contractorId),
      });
      toast.success(
        result.temporaryPassword
          ? `User created. Temporary password: ${result.temporaryPassword}`
          : "User created",
      );
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    }
  }

  const employeeOptions = [
    { label: "No employee link", value: "__none__" },
    ...(linkOptions.data?.employees.map((e) => ({
      label: `${e.code} — ${e.name}`,
      value: e.id,
      disabled: !!e.userId,
    })) ?? []),
  ];

  const contractorOptions = [
    { label: "No contractor link", value: "__none__" },
    ...(linkOptions.data?.contractors.map((c) => ({
      label: `${c.code} — ${c.name}`,
      value: c.id,
      disabled: !!c.primaryUserId,
    })) ?? []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Create an active user immediately. Leave password blank to auto-generate one.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField control={form.control} name="name" label="Full name" required />
          <TextField control={form.control} name="email" label="Email" type="email" required />
          <TextField control={form.control} name="phone" label="Phone" />
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            hint="Optional — auto-generated if empty"
          />
          <SelectField
            control={form.control}
            name="status"
            label="Status"
            options={[
              { label: "Active", value: "ACTIVE" },
              { label: "Invited", value: "INVITED" },
              { label: "Inactive", value: "INACTIVE" },
            ]}
          />
          <SelectField
            control={form.control}
            name="employeeId"
            label="Link employee"
            options={employeeOptions}
          />
          <SelectField
            control={form.control}
            name="contractorId"
            label="Link contractor"
            options={contractorOptions}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-h-11" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

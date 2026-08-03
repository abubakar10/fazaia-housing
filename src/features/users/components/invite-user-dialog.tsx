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
import { inviteUserSchema } from "../schemas/user.schemas";
import { useInviteUserMutation, useLinkOptionsQuery } from "../hooks/use-users";

const formSchema = inviteUserSchema.extend({
  employeeId: z.string().optional().nullable(),
  contractorId: z.string().optional().nullable(),
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

export function InviteUserDialog({ open, onOpenChange }: Props) {
  const inviteMutation = useInviteUserMutation();
  const linkOptions = useLinkOptionsQuery();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      employeeId: "__none__",
      contractorId: "__none__",
      sendEmail: true,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const result = await inviteMutation.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        sendEmail: values.sendEmail,
        employeeId: normalizeLinkId(values.employeeId),
        contractorId: normalizeLinkId(values.contractorId),
      });
      toast.success(
        result.temporaryPassword
          ? `Invited. Temporary password: ${result.temporaryPassword}`
          : "Invitation sent",
      );
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invite failed");
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
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Creates an INVITED account and emails a temporary password when Resend is configured.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField control={form.control} name="name" label="Full name" required />
          <TextField control={form.control} name="email" label="Email" type="email" required />
          <TextField control={form.control} name="phone" label="Phone" />
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
            <Button type="submit" className="min-h-11" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Inviting…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

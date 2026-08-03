import { z } from "zod";
import { passwordSchema } from "@/features/auth/schemas/auth.schemas";

export const userStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "INVITED",
  "LOCKED",
]);

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional().default(""),
  status: userStatusSchema.optional(),
  sort: z
    .enum(["createdAt", "name", "email", "status", "lastLoginAt"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(40).optional().nullable(),
  password: passwordSchema.optional(),
  status: userStatusSchema.optional().default("ACTIVE"),
  employeeId: z.string().uuid().optional().nullable(),
  contractorId: z.string().uuid().optional().nullable(),
});

export const inviteUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(40).optional().nullable(),
  employeeId: z.string().uuid().optional().nullable(),
  contractorId: z.string().uuid().optional().nullable(),
  sendEmail: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  status: userStatusSchema.optional(),
  orgUnitId: z.string().uuid().optional().nullable(),
  employeeId: z.string().uuid().optional().nullable(),
  contractorId: z.string().uuid().optional().nullable(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
});

export const adminResetPasswordSchema = z.object({
  password: passwordSchema.optional(),
  generateTemporary: z.boolean().optional().default(false),
  sendEmail: z.boolean().optional().default(true),
}).refine(
  (data) => data.generateTemporary || !!data.password,
  { message: "Provide a password or enable temporary password generation.", path: ["password"] },
);

export const linkEmployeeSchema = z.object({
  employeeId: z.string().uuid().nullable(),
});

export const linkContractorSchema = z.object({
  contractorId: z.string().uuid().nullable(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;

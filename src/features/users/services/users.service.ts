import { randomBytes } from "crypto";
import { AppError, NotFoundError, ValidationAppError } from "@/domain/errors";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { requirePermission } from "@/domain/policies/require-permission";
import { requireUser } from "@/features/auth/services/session.service";
import { hashPassword } from "@/features/auth/services/password.service";
import { writeAuditLogAsync } from "@/features/auth/services/audit.service";
import { sendEmail } from "@/infrastructure/email";
import { APP_NAME } from "@/lib/constants";
import { toUserDto } from "../mappers";
import {
  createUserRecord,
  getUserByEmail,
  getUserById,
  linkContractorToUser,
  linkEmployeeToUser,
  listLinkableContractors,
  listLinkableEmployees,
  listUsers,
  softDeleteUser,
  updateUserRecord,
} from "../repositories/user.repository";
import type {
  AdminResetPasswordInput,
  CreateUserInput,
  InviteUserInput,
  ListUsersQuery,
  UpdateProfileInput,
  UpdateUserInput,
} from "../schemas/user.schemas";

function temporaryPassword() {
  return `Tmp-${randomBytes(4).toString("hex")}A1`;
}

async function applyLinks(
  userId: string,
  actorId: string,
  employeeId?: string | null,
  contractorId?: string | null,
) {
  if (employeeId !== undefined) {
    try {
      await linkEmployeeToUser(userId, employeeId, actorId);
    } catch (error) {
      const code = error instanceof Error ? error.message : "LINK_FAILED";
      if (code === "EMPLOYEE_NOT_FOUND") {
        throw new NotFoundError("Employee", employeeId ?? undefined);
      }
      if (code === "EMPLOYEE_ALREADY_LINKED") {
        throw new AppError(
          "CONFLICT",
          "Employee is already linked to another user.",
          { status: 409 },
        );
      }
      throw error;
    }
  }

  if (contractorId !== undefined) {
    try {
      await linkContractorToUser(userId, contractorId, actorId);
    } catch (error) {
      const code = error instanceof Error ? error.message : "LINK_FAILED";
      if (code === "CONTRACTOR_NOT_FOUND") {
        throw new NotFoundError("Contractor", contractorId ?? undefined);
      }
      if (code === "CONTRACTOR_ALREADY_LINKED") {
        throw new AppError(
          "CONFLICT",
          "Contractor is already linked to another user.",
          { status: 409 },
        );
      }
      throw error;
    }
  }
}

export class UsersService {
  async list(query: ListUsersQuery) {
    await requirePermission(PERMISSIONS.USERS_READ);
    const { total, rows } = await listUsers(query);
    return {
      data: rows.map(toUserDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
        sort: query.sort,
        order: query.order,
      },
    };
  }

  async getById(id: string) {
    await requirePermission(PERMISSIONS.USERS_READ);
    const user = await getUserById(id);
    if (!user) throw new NotFoundError("User", id);
    return toUserDto(user);
  }

  async create(input: CreateUserInput) {
    const actor = await requirePermission(PERMISSIONS.USERS_CREATE);
    const existing = await getUserByEmail(input.email);
    if (existing && !existing.deletedAt) {
      throw new AppError("CONFLICT", "A user with this email already exists.", {
        status: 409,
      });
    }

    const password = input.password ?? temporaryPassword();
    const passwordHash = await hashPassword(password);
    const user = await createUserRecord({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      status: input.status ?? "ACTIVE",
      createdById: actor.id,
    });

    await applyLinks(
      user.id,
      actor.id,
      input.employeeId,
      input.contractorId,
    );

    const refreshed = await getUserById(user.id);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.create",
      entityType: "User",
      entityId: user.id,
      after: { email: user.email, status: user.status },
    });

    return {
      user: toUserDto(refreshed!),
      temporaryPassword: input.password ? undefined : password,
    };
  }

  async invite(input: InviteUserInput) {
    const actor = await requirePermission(PERMISSIONS.USERS_INVITE);
    const existing = await getUserByEmail(input.email);
    if (existing && !existing.deletedAt) {
      throw new AppError("CONFLICT", "A user with this email already exists.", {
        status: 409,
      });
    }

    const password = temporaryPassword();
    const passwordHash = await hashPassword(password);
    const user = await createUserRecord({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      status: "INVITED",
      createdById: actor.id,
    });

    await applyLinks(
      user.id,
      actor.id,
      input.employeeId,
      input.contractorId,
    );

    if (input.sendEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendEmail({
        to: user.email,
        subject: `You're invited to ${APP_NAME}`,
        html: `
          <p>Hello ${user.name},</p>
          <p>You have been invited to ${APP_NAME}.</p>
          <p>Sign in at <a href="${appUrl}/login">${appUrl}/login</a></p>
          <p>Temporary password: <strong>${password}</strong></p>
          <p>Please change your password after signing in.</p>
        `,
        text: `You are invited to ${APP_NAME}. Login: ${appUrl}/login Temporary password: ${password}`,
      });
    }

    const refreshed = await getUserById(user.id);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.invite",
      entityType: "User",
      entityId: user.id,
      after: { email: user.email, status: "INVITED" },
    });

    return {
      user: toUserDto(refreshed!),
      temporaryPassword: input.sendEmail ? undefined : password,
    };
  }

  async update(id: string, input: UpdateUserInput) {
    const actor = await requirePermission(PERMISSIONS.USERS_UPDATE);
    const existing = await getUserById(id);
    if (!existing) throw new NotFoundError("User", id);

    await updateUserRecord(id, {
      name: input.name,
      phone: input.phone === undefined ? undefined : input.phone,
      avatarUrl: input.avatarUrl === undefined ? undefined : input.avatarUrl,
      status: input.status,
      orgUnit:
        input.orgUnitId === undefined
          ? undefined
          : input.orgUnitId
            ? { connect: { id: input.orgUnitId } }
            : { disconnect: true },
      updatedById: actor.id,
    });

    if (input.employeeId !== undefined || input.contractorId !== undefined) {
      await applyLinks(
        id,
        actor.id,
        input.employeeId,
        input.contractorId,
      );
    }

    const refreshed = await getUserById(id);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.update",
      entityType: "User",
      entityId: id,
      before: { name: existing.name, status: existing.status },
      after: {
        name: refreshed?.name,
        status: refreshed?.status,
      },
    });

    return toUserDto(refreshed!);
  }

  async updateProfile(input: UpdateProfileInput) {
    const actor = await requireUser();
    const updated = await updateUserRecord(actor.id, {
      name: input.name,
      phone: input.phone === undefined ? undefined : input.phone,
      avatarUrl: input.avatarUrl === undefined ? undefined : input.avatarUrl,
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.profile_update",
      entityType: "User",
      entityId: actor.id,
    });

    return toUserDto(updated);
  }

  async activate(id: string) {
    const actor = await requirePermission(PERMISSIONS.USERS_UPDATE);
    const existing = await getUserById(id);
    if (!existing) throw new NotFoundError("User", id);

    const updated = await updateUserRecord(id, {
      status: "ACTIVE",
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.activate",
      entityType: "User",
      entityId: id,
      before: { status: existing.status },
      after: { status: "ACTIVE" },
    });

    return toUserDto(updated);
  }

  async deactivate(id: string) {
    const actor = await requirePermission(PERMISSIONS.USERS_DEACTIVATE);
    if (actor.id === id) {
      throw new ValidationAppError("You cannot deactivate your own account.");
    }

    const existing = await getUserById(id);
    if (!existing) throw new NotFoundError("User", id);

    const updated = await updateUserRecord(id, {
      status: "INACTIVE",
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.deactivate",
      entityType: "User",
      entityId: id,
      before: { status: existing.status },
      after: { status: "INACTIVE" },
    });

    return toUserDto(updated);
  }

  async softDelete(id: string) {
    const actor = await requirePermission(PERMISSIONS.USERS_DEACTIVATE);
    if (actor.id === id) {
      throw new ValidationAppError("You cannot delete your own account.");
    }
    const existing = await getUserById(id);
    if (!existing) throw new NotFoundError("User", id);

    const updated = await softDeleteUser(id, actor.id);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.soft_delete",
      entityType: "User",
      entityId: id,
    });
    return toUserDto(updated);
  }

  async resetPassword(id: string, input: AdminResetPasswordInput) {
    const actor = await requirePermission(PERMISSIONS.USERS_RESET_PASSWORD);
    const existing = await getUserById(id);
    if (!existing) throw new NotFoundError("User", id);

    const password =
      input.generateTemporary || !input.password
        ? temporaryPassword()
        : input.password;
    const passwordHash = await hashPassword(password);

    await updateUserRecord(id, {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: existing.status === "LOCKED" ? "ACTIVE" : existing.status,
      updatedById: actor.id,
    });

    if (input.sendEmail) {
      await sendEmail({
        to: existing.email,
        subject: `${APP_NAME} password reset by administrator`,
        html: `
          <p>Hello ${existing.name},</p>
          <p>An administrator reset your password.</p>
          <p>Temporary password: <strong>${password}</strong></p>
          <p>Sign in and change it as soon as possible.</p>
        `,
        text: `Your temporary password is: ${password}`,
      });
    }

    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.reset_password",
      entityType: "User",
      entityId: id,
    });

    return {
      ok: true as const,
      temporaryPassword: input.sendEmail ? undefined : password,
    };
  }

  async linkEmployee(userId: string, employeeId: string | null) {
    const actor = await requirePermission(PERMISSIONS.USERS_UPDATE);
    const existing = await getUserById(userId);
    if (!existing) throw new NotFoundError("User", userId);
    await applyLinks(userId, actor.id, employeeId, undefined);
    const refreshed = await getUserById(userId);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.link_employee",
      entityType: "User",
      entityId: userId,
      meta: { employeeId },
    });
    return toUserDto(refreshed!);
  }

  async linkContractor(userId: string, contractorId: string | null) {
    const actor = await requirePermission(PERMISSIONS.USERS_UPDATE);
    const existing = await getUserById(userId);
    if (!existing) throw new NotFoundError("User", userId);
    await applyLinks(userId, actor.id, undefined, contractorId);
    const refreshed = await getUserById(userId);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.link_contractor",
      entityType: "User",
      entityId: userId,
      meta: { contractorId },
    });
    return toUserDto(refreshed!);
  }

  async listLinkOptions() {
    await requirePermission(PERMISSIONS.USERS_READ);
    const [employees, contractors] = await Promise.all([
      listLinkableEmployees(),
      listLinkableContractors(),
    ]);
    return { employees, contractors };
  }
}

export const usersService = new UsersService();

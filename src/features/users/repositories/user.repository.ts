import type { Prisma, UserStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/db";
import type { ListUsersQuery } from "../schemas/user.schemas";

const userInclude = {
  orgUnit: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
    },
  },
  employee: {
    select: {
      id: true,
      code: true,
      name: true,
      designation: true,
      department: true,
    },
  },
  contractorUser: {
    select: {
      id: true,
      code: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithLinks = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export async function listUsers(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
            { phone: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [query.sort]: query.order,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: userInclude,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function getUserById(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: userInclude,
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: userInclude,
  });
}

export async function createUserRecord(data: {
  name: string;
  email: string;
  phone?: string | null;
  passwordHash?: string | null;
  status: UserStatus;
  createdById?: string | null;
}) {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone ?? null,
      passwordHash: data.passwordHash ?? null,
      status: data.status,
      createdById: data.createdById ?? null,
      updatedById: data.createdById ?? null,
      emailVerified: data.status === "ACTIVE" ? new Date() : null,
    },
    include: userInclude,
  });
}

export async function updateUserRecord(
  id: string,
  data: Prisma.UserUpdateInput,
) {
  return prisma.user.update({
    where: { id },
    data,
    include: userInclude,
  });
}

export async function softDeleteUser(id: string, actorId: string) {
  return prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "INACTIVE",
      updatedById: actorId,
    },
    include: userInclude,
  });
}

export async function findEmployeeById(id: string) {
  return prisma.employee.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function findContractorById(id: string) {
  return prisma.contractor.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function listLinkableEmployees() {
  return prisma.employee.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      code: true,
      name: true,
      designation: true,
      userId: true,
    },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function listLinkableContractors() {
  return prisma.contractor.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      code: true,
      name: true,
      email: true,
      primaryUserId: true,
    },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function linkEmployeeToUser(
  userId: string,
  employeeId: string | null,
  actorId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.employee.updateMany({
      where: { userId },
      data: { userId: null, updatedById: actorId },
    });

    if (employeeId) {
      const employee = await tx.employee.findFirst({
        where: { id: employeeId, deletedAt: null },
      });
      if (!employee) throw new Error("EMPLOYEE_NOT_FOUND");
      if (employee.userId && employee.userId !== userId) {
        throw new Error("EMPLOYEE_ALREADY_LINKED");
      }
      await tx.employee.update({
        where: { id: employeeId },
        data: { userId, updatedById: actorId },
      });
    }

    return tx.user.findFirstOrThrow({
      where: { id: userId },
      include: userInclude,
    });
  });
}

export async function linkContractorToUser(
  userId: string,
  contractorId: string | null,
  actorId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.contractor.updateMany({
      where: { primaryUserId: userId },
      data: { primaryUserId: null, updatedById: actorId },
    });

    if (contractorId) {
      const contractor = await tx.contractor.findFirst({
        where: { id: contractorId, deletedAt: null },
      });
      if (!contractor) throw new Error("CONTRACTOR_NOT_FOUND");
      if (contractor.primaryUserId && contractor.primaryUserId !== userId) {
        throw new Error("CONTRACTOR_ALREADY_LINKED");
      }
      await tx.contractor.update({
        where: { id: contractorId },
        data: { primaryUserId: userId, updatedById: actorId },
      });
    }

    return tx.user.findFirstOrThrow({
      where: { id: userId },
      include: userInclude,
    });
  });
}

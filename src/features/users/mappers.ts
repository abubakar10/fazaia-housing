import type { UserWithLinks } from "./repositories/user.repository";

export function toUserDto(user: UserWithLinks) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    status: user.status,
    orgUnitId: user.orgUnitId,
    orgUnit: user.orgUnit
      ? {
          id: user.orgUnit.id,
          code: user.orgUnit.code,
          name: user.orgUnit.name,
          type: user.orgUnit.type,
        }
      : null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    employee: user.employee
      ? {
          id: user.employee.id,
          code: user.employee.code,
          name: user.employee.name,
          designation: user.employee.designation,
          department: user.employee.department,
        }
      : null,
    contractor: user.contractorUser
      ? {
          id: user.contractorUser.id,
          code: user.contractorUser.code,
          name: user.contractorUser.name,
          email: user.contractorUser.email,
        }
      : null,
  };
}

export type UserDto = ReturnType<typeof toUserDto>;

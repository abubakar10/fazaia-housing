-- Module 3: Roles & Permissions (RBAC)

CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');
CREATE TYPE "PermissionScope" AS ENUM ('GLOBAL', 'ORGANIZATION', 'PROJECT');

CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "globalRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "scopeType" "PermissionScope" NOT NULL DEFAULT 'GLOBAL',
    "orgUnitId" UUID,
    "projectId" UUID,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" UUID,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPermission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "effect" "PermissionEffect" NOT NULL,
    "scopeType" "PermissionScope" NOT NULL DEFAULT 'GLOBAL',
    "orgUnitId" UUID,
    "projectId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");
CREATE INDEX "Role_deletedAt_idx" ON "Role"("deletedAt");
CREATE INDEX "Role_isSystem_idx" ON "Role"("isSystem");

CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE INDEX "Permission_module_idx" ON "Permission"("module");

CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

CREATE INDEX "UserRole_userId_roleId_scopeType_idx" ON "UserRole"("userId", "roleId", "scopeType");
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");
CREATE INDEX "UserRole_projectId_idx" ON "UserRole"("projectId");
CREATE INDEX "UserRole_orgUnitId_idx" ON "UserRole"("orgUnitId");

CREATE UNIQUE INDEX "UserRole_global_unique"
  ON "UserRole"("userId", "roleId")
  WHERE "scopeType" = 'GLOBAL';

CREATE UNIQUE INDEX "UserRole_org_unique"
  ON "UserRole"("userId", "roleId", "orgUnitId")
  WHERE "scopeType" = 'ORGANIZATION';

CREATE UNIQUE INDEX "UserRole_project_unique"
  ON "UserRole"("userId", "roleId", "projectId")
  WHERE "scopeType" = 'PROJECT';

CREATE INDEX "UserPermission_userId_permissionId_effect_scopeType_idx"
  ON "UserPermission"("userId", "permissionId", "effect", "scopeType");
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");
CREATE INDEX "UserPermission_projectId_idx" ON "UserPermission"("projectId");
CREATE INDEX "UserPermission_orgUnitId_idx" ON "UserPermission"("orgUnitId");

CREATE UNIQUE INDEX "UserPermission_global_unique"
  ON "UserPermission"("userId", "permissionId", "effect")
  WHERE "scopeType" = 'GLOBAL';

CREATE UNIQUE INDEX "UserPermission_org_unique"
  ON "UserPermission"("userId", "permissionId", "effect", "orgUnitId")
  WHERE "scopeType" = 'ORGANIZATION';

CREATE UNIQUE INDEX "UserPermission_project_unique"
  ON "UserPermission"("userId", "permissionId", "effect", "projectId")
  WHERE "scopeType" = 'PROJECT';

ALTER TABLE "RolePermission"
  ADD CONSTRAINT "RolePermission_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RolePermission"
  ADD CONSTRAINT "RolePermission_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPermission"
  ADD CONSTRAINT "UserPermission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPermission"
  ADD CONSTRAINT "UserPermission_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Module 4: Organization Hierarchy

CREATE TYPE "OrgUnitType" AS ENUM ('HQ', 'REGION', 'DIVISION', 'SITE', 'OFFICE', 'STORE', 'FINANCE', 'OTHER');
CREATE TYPE "OrgUnitStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "OrgUnit" (
    "id" UUID NOT NULL,
    "parentId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgUnitType" NOT NULL,
    "status" "OrgUnitStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "OrgUnit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrgUnit_code_key" ON "OrgUnit"("code");
CREATE INDEX "OrgUnit_parentId_sortOrder_idx" ON "OrgUnit"("parentId", "sortOrder");
CREATE INDEX "OrgUnit_status_deletedAt_idx" ON "OrgUnit"("status", "deletedAt");
CREATE INDEX "OrgUnit_type_idx" ON "OrgUnit"("type");
CREATE INDEX "OrgUnit_name_idx" ON "OrgUnit"("name");

ALTER TABLE "OrgUnit"
  ADD CONSTRAINT "OrgUnit_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "OrgUnit"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User"
  ADD CONSTRAINT "User_orgUnitId_fkey"
  FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "User_orgUnitId_idx";
CREATE INDEX "User_orgUnitId_status_idx" ON "User"("orgUnitId", "status");

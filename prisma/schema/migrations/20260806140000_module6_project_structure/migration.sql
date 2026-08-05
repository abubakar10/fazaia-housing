-- Module 6 — Project Structure (Phases, Sectors, Blocks)

CREATE TYPE "StructureStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "Phase" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "StructureStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusBeforeArchive" "StructureStatus",
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sector" (
    "id" UUID NOT NULL,
    "phaseId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "StructureStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusBeforeArchive" "StructureStatus",
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Block" (
    "id" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "StructureStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusBeforeArchive" "StructureStatus",
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Phase_projectId_code_key" ON "Phase"("projectId", "code");
CREATE INDEX "Phase_projectId_deletedAt_idx" ON "Phase"("projectId", "deletedAt");
CREATE INDEX "Phase_projectId_status_deletedAt_idx" ON "Phase"("projectId", "status", "deletedAt");
CREATE INDEX "Phase_projectId_sortOrder_idx" ON "Phase"("projectId", "sortOrder");
CREATE INDEX "Phase_status_idx" ON "Phase"("status");
CREATE INDEX "Phase_name_idx" ON "Phase"("name");
CREATE INDEX "Phase_createdAt_idx" ON "Phase"("createdAt");

CREATE UNIQUE INDEX "Sector_phaseId_code_key" ON "Sector"("phaseId", "code");
CREATE INDEX "Sector_projectId_deletedAt_idx" ON "Sector"("projectId", "deletedAt");
CREATE INDEX "Sector_phaseId_deletedAt_idx" ON "Sector"("phaseId", "deletedAt");
CREATE INDEX "Sector_projectId_status_deletedAt_idx" ON "Sector"("projectId", "status", "deletedAt");
CREATE INDEX "Sector_phaseId_sortOrder_idx" ON "Sector"("phaseId", "sortOrder");
CREATE INDEX "Sector_status_idx" ON "Sector"("status");
CREATE INDEX "Sector_name_idx" ON "Sector"("name");
CREATE INDEX "Sector_createdAt_idx" ON "Sector"("createdAt");

CREATE UNIQUE INDEX "Block_sectorId_code_key" ON "Block"("sectorId", "code");
CREATE INDEX "Block_projectId_deletedAt_idx" ON "Block"("projectId", "deletedAt");
CREATE INDEX "Block_sectorId_deletedAt_idx" ON "Block"("sectorId", "deletedAt");
CREATE INDEX "Block_projectId_status_deletedAt_idx" ON "Block"("projectId", "status", "deletedAt");
CREATE INDEX "Block_sectorId_sortOrder_idx" ON "Block"("sectorId", "sortOrder");
CREATE INDEX "Block_status_idx" ON "Block"("status");
CREATE INDEX "Block_name_idx" ON "Block"("name");
CREATE INDEX "Block_createdAt_idx" ON "Block"("createdAt");

ALTER TABLE "Phase" ADD CONSTRAINT "Phase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

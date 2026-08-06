-- Module 7 — House Types, Templates & Houses

CREATE TYPE "HouseTypeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "HouseTypeCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED', 'OTHER');
CREATE TYPE "HouseTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "HouseStatus" AS ENUM ('PLANNING', 'ALLOCATED', 'UNDER_CONSTRUCTION', 'INSPECTION', 'COMPLETED', 'DELIVERED', 'ARCHIVED');

CREATE TABLE "HouseType" (
    "id" UUID NOT NULL,
    "projectId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "HouseTypeCategory" NOT NULL DEFAULT 'RESIDENTIAL',
    "coveredArea" DECIMAL(12,2),
    "plotSize" DECIMAL(12,2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floors" INTEGER,
    "drawingNumber" TEXT,
    "description" TEXT,
    "status" "HouseTypeStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultTemplateId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    CONSTRAINT "HouseType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseTemplate" (
    "id" UUID NOT NULL,
    "houseTypeId" UUID NOT NULL,
    "projectId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "HouseTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "estimatedDurationDays" INTEGER,
    "estimatedCost" DECIMAL(14,2),
    "defaultActivities" JSONB,
    "defaultBoq" JSONB,
    "defaultMaterials" JSONB,
    "revisionOfId" UUID,
    "revisionNote" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    CONSTRAINT "HouseTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "House" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "phaseId" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "blockId" UUID NOT NULL,
    "houseTypeId" UUID NOT NULL,
    "houseTemplateId" UUID,
    "code" TEXT NOT NULL,
    "plotNo" TEXT,
    "status" "HouseStatus" NOT NULL DEFAULT 'PLANNING',
    "statusBeforeArchive" "HouseStatus",
    "gpsLatitude" DECIMAL(10,7),
    "gpsLongitude" DECIMAL(10,7),
    "ownerName" TEXT,
    "notes" TEXT,
    "progressPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "seededFromTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    CONSTRAINT "House_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseStatusHistory" (
    "id" UUID NOT NULL,
    "houseId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "fromStatus" "HouseStatus",
    "toStatus" "HouseStatus" NOT NULL,
    "note" TEXT,
    "changedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedListFilter" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "projectId" UUID,
    "module" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SavedListFilter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HouseType_projectId_code_key" ON "HouseType"("projectId", "code");
CREATE INDEX "HouseType_projectId_deletedAt_idx" ON "HouseType"("projectId", "deletedAt");
CREATE INDEX "HouseType_status_deletedAt_idx" ON "HouseType"("status", "deletedAt");
CREATE INDEX "HouseType_category_idx" ON "HouseType"("category");
CREATE INDEX "HouseType_name_idx" ON "HouseType"("name");
CREATE INDEX "HouseType_createdAt_idx" ON "HouseType"("createdAt");

CREATE UNIQUE INDEX "HouseTemplate_houseTypeId_code_version_key" ON "HouseTemplate"("houseTypeId", "code", "version");
CREATE INDEX "HouseTemplate_houseTypeId_deletedAt_idx" ON "HouseTemplate"("houseTypeId", "deletedAt");
CREATE INDEX "HouseTemplate_projectId_deletedAt_idx" ON "HouseTemplate"("projectId", "deletedAt");
CREATE INDEX "HouseTemplate_status_deletedAt_idx" ON "HouseTemplate"("status", "deletedAt");
CREATE INDEX "HouseTemplate_revisionOfId_idx" ON "HouseTemplate"("revisionOfId");
CREATE INDEX "HouseTemplate_createdAt_idx" ON "HouseTemplate"("createdAt");

CREATE UNIQUE INDEX "House_blockId_code_key" ON "House"("blockId", "code");
CREATE INDEX "House_projectId_status_deletedAt_idx" ON "House"("projectId", "status", "deletedAt");
CREATE INDEX "House_projectId_deletedAt_idx" ON "House"("projectId", "deletedAt");
CREATE INDEX "House_phaseId_deletedAt_idx" ON "House"("phaseId", "deletedAt");
CREATE INDEX "House_sectorId_deletedAt_idx" ON "House"("sectorId", "deletedAt");
CREATE INDEX "House_blockId_deletedAt_idx" ON "House"("blockId", "deletedAt");
CREATE INDEX "House_houseTypeId_idx" ON "House"("houseTypeId");
CREATE INDEX "House_houseTemplateId_idx" ON "House"("houseTemplateId");
CREATE INDEX "House_plotNo_idx" ON "House"("plotNo");
CREATE INDEX "House_code_idx" ON "House"("code");
CREATE INDEX "House_status_idx" ON "House"("status");
CREATE INDEX "House_createdAt_idx" ON "House"("createdAt");
CREATE INDEX "House_updatedAt_idx" ON "House"("updatedAt");

CREATE INDEX "HouseStatusHistory_houseId_createdAt_idx" ON "HouseStatusHistory"("houseId", "createdAt");
CREATE INDEX "HouseStatusHistory_projectId_createdAt_idx" ON "HouseStatusHistory"("projectId", "createdAt");
CREATE INDEX "HouseStatusHistory_toStatus_idx" ON "HouseStatusHistory"("toStatus");

CREATE INDEX "SavedListFilter_userId_module_idx" ON "SavedListFilter"("userId", "module");
CREATE INDEX "SavedListFilter_projectId_module_idx" ON "SavedListFilter"("projectId", "module");
CREATE INDEX "SavedListFilter_createdAt_idx" ON "SavedListFilter"("createdAt");

ALTER TABLE "HouseType" ADD CONSTRAINT "HouseType_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseTemplate" ADD CONSTRAINT "HouseTemplate_houseTypeId_fkey" FOREIGN KEY ("houseTypeId") REFERENCES "HouseType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseTemplate" ADD CONSTRAINT "HouseTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseTemplate" ADD CONSTRAINT "HouseTemplate_revisionOfId_fkey" FOREIGN KEY ("revisionOfId") REFERENCES "HouseTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HouseType" ADD CONSTRAINT "HouseType_defaultTemplateId_fkey" FOREIGN KEY ("defaultTemplateId") REFERENCES "HouseTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "House" ADD CONSTRAINT "House_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "House" ADD CONSTRAINT "House_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "House" ADD CONSTRAINT "House_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "House" ADD CONSTRAINT "House_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "House" ADD CONSTRAINT "House_houseTypeId_fkey" FOREIGN KEY ("houseTypeId") REFERENCES "HouseType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "House" ADD CONSTRAINT "House_houseTemplateId_fkey" FOREIGN KEY ("houseTemplateId") REFERENCES "HouseTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HouseStatusHistory" ADD CONSTRAINT "HouseStatusHistory_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedListFilter" ADD CONSTRAINT "SavedListFilter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedListFilter" ADD CONSTRAINT "SavedListFilter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

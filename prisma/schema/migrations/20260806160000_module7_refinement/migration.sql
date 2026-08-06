-- Module 7 refinement: relational template line items + house scale indexes

-- CreateTable
CREATE TABLE "HouseTemplateActivity" (
    "id" UUID NOT NULL,
    "houseTemplateId" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "estimatedDurationDays" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseTemplateActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseTemplateBOQ" (
    "id" UUID NOT NULL,
    "houseTemplateId" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unitRate" DECIMAL(14,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseTemplateBOQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseTemplateMaterial" (
    "id" UUID NOT NULL,
    "houseTemplateId" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseTemplateMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HouseTemplateActivity_houseTemplateId_sortOrder_idx" ON "HouseTemplateActivity"("houseTemplateId", "sortOrder");
CREATE INDEX "HouseTemplateActivity_houseTemplateId_code_idx" ON "HouseTemplateActivity"("houseTemplateId", "code");
CREATE INDEX "HouseTemplateBOQ_houseTemplateId_sortOrder_idx" ON "HouseTemplateBOQ"("houseTemplateId", "sortOrder");
CREATE INDEX "HouseTemplateBOQ_houseTemplateId_code_idx" ON "HouseTemplateBOQ"("houseTemplateId", "code");
CREATE INDEX "HouseTemplateMaterial_houseTemplateId_sortOrder_idx" ON "HouseTemplateMaterial"("houseTemplateId", "sortOrder");
CREATE INDEX "HouseTemplateMaterial_houseTemplateId_code_idx" ON "HouseTemplateMaterial"("houseTemplateId", "code");

-- AddForeignKey
ALTER TABLE "HouseTemplateActivity" ADD CONSTRAINT "HouseTemplateActivity_houseTemplateId_fkey" FOREIGN KEY ("houseTemplateId") REFERENCES "HouseTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseTemplateBOQ" ADD CONSTRAINT "HouseTemplateBOQ_houseTemplateId_fkey" FOREIGN KEY ("houseTemplateId") REFERENCES "HouseTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseTemplateMaterial" ADD CONSTRAINT "HouseTemplateMaterial_houseTemplateId_fkey" FOREIGN KEY ("houseTemplateId") REFERENCES "HouseTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop legacy JSON placeholder columns from HouseTemplate
ALTER TABLE "HouseTemplate" DROP COLUMN IF EXISTS "defaultActivities";
ALTER TABLE "HouseTemplate" DROP COLUMN IF EXISTS "defaultBoq";
ALTER TABLE "HouseTemplate" DROP COLUMN IF EXISTS "defaultMaterials";

-- Scale indexes for large house registers
CREATE INDEX IF NOT EXISTS "House_projectId_houseTypeId_deletedAt_idx" ON "House"("projectId", "houseTypeId", "deletedAt");
CREATE INDEX IF NOT EXISTS "House_projectId_phaseId_deletedAt_idx" ON "House"("projectId", "phaseId", "deletedAt");
CREATE INDEX IF NOT EXISTS "House_projectId_blockId_deletedAt_idx" ON "House"("projectId", "blockId", "deletedAt");
CREATE INDEX IF NOT EXISTS "House_projectId_code_idx" ON "House"("projectId", "code");
CREATE INDEX IF NOT EXISTS "House_projectId_plotNo_idx" ON "House"("projectId", "plotNo");
CREATE INDEX IF NOT EXISTS "House_projectId_status_createdAt_idx" ON "House"("projectId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "House_blockId_plotNo_idx" ON "House"("blockId", "plotNo");

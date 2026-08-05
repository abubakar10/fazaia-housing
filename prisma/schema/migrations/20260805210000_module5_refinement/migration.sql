-- Module 5 refinement — project settings, archive restore, indexes

CREATE TYPE "ProjectType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE', 'INFRASTRUCTURE', 'RENOVATION', 'OTHER');
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE "Project" ADD COLUMN "statusBeforeArchive" "ProjectStatus";
ALTER TABLE "Project" ADD COLUMN "projectType" "ProjectType" NOT NULL DEFAULT 'RESIDENTIAL';
ALTER TABLE "Project" ADD COLUMN "projectPriority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Project" ADD COLUMN "clientOwner" TEXT;
ALTER TABLE "Project" ADD COLUMN "consultant" TEXT;
ALTER TABLE "Project" ADD COLUMN "mainContractorId" UUID;
ALTER TABLE "Project" ADD COLUMN "fiscalYear" INTEGER;
ALTER TABLE "Project" ADD COLUMN "gpsLatitude" DECIMAL(10,7);
ALTER TABLE "Project" ADD COLUMN "gpsLongitude" DECIMAL(10,7);
ALTER TABLE "Project" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Project" ADD COLUMN "internalNotes" TEXT;

CREATE INDEX "Project_mainContractorId_idx" ON "Project"("mainContractorId");
CREATE INDEX "Project_projectType_idx" ON "Project"("projectType");
CREATE INDEX "Project_projectPriority_idx" ON "Project"("projectPriority");
CREATE INDEX "Project_fiscalYear_idx" ON "Project"("fiscalYear");

CREATE INDEX "ProjectMember_roleId_idx" ON "ProjectMember"("roleId");
CREATE INDEX "ProjectMember_createdAt_idx" ON "ProjectMember"("createdAt");

ALTER TABLE "Project" ADD CONSTRAINT "Project_mainContractorId_fkey" FOREIGN KEY ("mainContractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

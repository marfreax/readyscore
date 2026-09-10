-- V13.1: Generic Question Package & Configuration foundation.
-- This migration adds package/version/composition configuration only.
-- Existing assessment runtime, scoring, attempts, and question records remain unchanged.

CREATE TYPE "QuestionPackageStatus" AS ENUM ('DRAFT','REVIEW','APPROVED','PUBLISHED','ARCHIVED');

CREATE TABLE "QuestionPackage" (
  "id" TEXT NOT NULL,
  "testTypeId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionPackageVersion" (
  "id" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "totalQuestions" INTEGER NOT NULL,
  "timeLimitSeconds" INTEGER NOT NULL,
  "taxonomyVersionId" TEXT,
  "status" "QuestionPackageStatus" NOT NULL DEFAULT 'DRAFT',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionPackageVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionPackageCompositionRule" (
  "id" TEXT NOT NULL,
  "packageVersionId" TEXT NOT NULL,
  "taxonomyNodeId" TEXT NOT NULL,
  "requiredCount" INTEGER NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionPackageCompositionRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuestionPackage_code_key" ON "QuestionPackage"("code");
CREATE INDEX "QuestionPackage_testTypeId_idx" ON "QuestionPackage"("testTypeId");
CREATE UNIQUE INDEX "QuestionPackageVersion_packageId_version_key" ON "QuestionPackageVersion"("packageId","version");
CREATE INDEX "QuestionPackageVersion_packageId_status_idx" ON "QuestionPackageVersion"("packageId","status");
CREATE INDEX "QuestionPackageVersion_taxonomyVersionId_idx" ON "QuestionPackageVersion"("taxonomyVersionId");
CREATE INDEX "QuestionPackageVersion_status_updatedAt_idx" ON "QuestionPackageVersion"("status","updatedAt");
CREATE UNIQUE INDEX "QuestionPackageCompositionRule_packageVersionId_taxonomyNodeId_key" ON "QuestionPackageCompositionRule"("packageVersionId","taxonomyNodeId");
CREATE INDEX "QuestionPackageCompositionRule_taxonomyNodeId_idx" ON "QuestionPackageCompositionRule"("taxonomyNodeId");

ALTER TABLE "QuestionPackage"
  ADD CONSTRAINT "QuestionPackage_testTypeId_fkey"
  FOREIGN KEY ("testTypeId") REFERENCES "TestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuestionPackageVersion"
  ADD CONSTRAINT "QuestionPackageVersion_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "QuestionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuestionPackageVersion"
  ADD CONSTRAINT "QuestionPackageVersion_taxonomyVersionId_fkey"
  FOREIGN KEY ("taxonomyVersionId") REFERENCES "TaxonomyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuestionPackageCompositionRule"
  ADD CONSTRAINT "QuestionPackageCompositionRule_packageVersionId_fkey"
  FOREIGN KEY ("packageVersionId") REFERENCES "QuestionPackageVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionPackageCompositionRule"
  ADD CONSTRAINT "QuestionPackageCompositionRule_taxonomyNodeId_fkey"
  FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

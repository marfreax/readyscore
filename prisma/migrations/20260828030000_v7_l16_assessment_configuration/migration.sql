
-- V7 L16: version-safe assessment/instrument configuration administration.
-- Existing assessment runtime semantics remain untouched; this migration adds
-- administrative configuration records and immutable configuration versions.
CREATE TYPE "AssessmentConfigurationStatus" AS ENUM ('DRAFT','REVIEW','APPROVED','ACTIVE','ARCHIVED');

CREATE TABLE "AssessmentConfiguration" (
  "id" TEXT NOT NULL,
  "assessmentType" "AssessmentType" NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentConfigurationVersion" (
  "id" TEXT NOT NULL,
  "configurationId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "questionBankVersion" TEXT NOT NULL,
  "taxonomyVersion" TEXT NOT NULL,
  "scoringVersion" TEXT NOT NULL,
  "selectionAlgorithmVersion" TEXT NOT NULL,
  "questionCount" INTEGER NOT NULL,
  "status" "AssessmentConfigurationStatus" NOT NULL DEFAULT 'DRAFT',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentConfigurationVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentConfiguration_code_key" ON "AssessmentConfiguration"("code");
CREATE INDEX "AssessmentConfiguration_assessmentType_idx" ON "AssessmentConfiguration"("assessmentType");
CREATE UNIQUE INDEX "AssessmentConfigurationVersion_configurationId_version_key" ON "AssessmentConfigurationVersion"("configurationId","version");
CREATE INDEX "AssessmentConfigurationVersion_configurationId_status_idx" ON "AssessmentConfigurationVersion"("configurationId","status");
CREATE INDEX "AssessmentConfigurationVersion_status_updatedAt_idx" ON "AssessmentConfigurationVersion"("status","updatedAt");

ALTER TABLE "AssessmentConfigurationVersion"
  ADD CONSTRAINT "AssessmentConfigurationVersion_configurationId_fkey"
  FOREIGN KEY ("configurationId") REFERENCES "AssessmentConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the currently frozen configuration contracts for administrative visibility.
-- These values mirror lib/assessment-config.ts and do not change runtime selection/scoring.
INSERT INTO "AssessmentConfiguration" ("id","assessmentType","code","name","description","updatedAt")
VALUES
('free-v1','FREE','free-v1','Free Assessment','Frozen V1 configuration contract',CURRENT_TIMESTAMP),
('premium-v1','PREMIUM','premium-v1','Premium Assessment','Frozen V1 configuration contract',CURRENT_TIMESTAMP),
('disc-v1','DISC','disc-v1','DISC Assessment','Frozen DISC V1 configuration contract',CURRENT_TIMESTAMP),
('eq-v1','EQ','eq-v1','EQ Assessment','Frozen EQ V1 configuration contract',CURRENT_TIMESTAMP),
('cognitive-v1','COGNITIVE','cognitive-v1','Cognitive Assessment','Frozen Cognitive V1 configuration contract',CURRENT_TIMESTAMP),
('riasec-v1','RIASEC','riasec-v1','RIASEC Assessment','Frozen RIASEC V1 configuration contract',CURRENT_TIMESTAMP);

INSERT INTO "AssessmentConfigurationVersion"
("id","configurationId","version","questionBankVersion","taxonomyVersion","scoringVersion","selectionAlgorithmVersion","questionCount","status","updatedAt")
VALUES
('free-v1-version','free-v1','FREE_V1','QB_RUNTIME','TAXONOMY_RUNTIME','SCORING_V1','SELECTION_V1',20,'ACTIVE',CURRENT_TIMESTAMP),
('premium-v1-version','premium-v1','PREMIUM_V1','QB_RUNTIME','TAXONOMY_RUNTIME','SCORING_V1','SELECTION_V1',100,'ACTIVE',CURRENT_TIMESTAMP),
('disc-v1-version','disc-v1','DISC_CONFIG_V1','QB_RUNTIME','TAXONOMY_RUNTIME','DISC_SCORE_V1','DISC_SELECTION_V1',24,'ACTIVE',CURRENT_TIMESTAMP),
('eq-v1-version','eq-v1','EQ_CONFIG_V1','QB_RUNTIME','TAXONOMY_RUNTIME','EQ_SCORE_V1','EQ_SELECTION_V1',24,'ACTIVE',CURRENT_TIMESTAMP),
('cognitive-v1-version','cognitive-v1','COGNITIVE_CONFIG_V1','QB_RUNTIME','TAXONOMY_RUNTIME','COGNITIVE_SCORE_V1','COGNITIVE_SELECTION_V1',24,'ACTIVE',CURRENT_TIMESTAMP),
('riasec-v1-version','riasec-v1','RIASEC_CONFIG_V1','QB_RUNTIME','TAXONOMY_RUNTIME','RIASEC_SCORE_V1','RIASEC_SELECTION_V1',60,'ACTIVE',CURRENT_TIMESTAMP);

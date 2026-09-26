-- ReadyScore V17.10 — Runtime Alignment & Configuration Migration
-- FIXED-2
-- Schema-only additive migration.
--
-- IMPORTANT:
-- Runtime catalog/data alignment is intentionally NOT performed inside this
-- migration. V17.10 must not manufacture duplicate TestType/Taxonomy/Package
-- records or assume a particular pre-existing catalog state in Prisma's
-- shadow database.
--
-- Data alignment is performed separately by scripts/v17-10-align-runtime-data.mjs
-- against the real local database after this migration has been applied.

ALTER TABLE "AssessmentConfigurationVersion"
  ADD COLUMN "questionPackageVersionId" TEXT;

ALTER TABLE "AssessmentAttempt"
  ADD COLUMN "questionPackageVersionId" TEXT;

CREATE INDEX "AssessmentConfigurationVersion_questionPackageVersionId_idx"
  ON "AssessmentConfigurationVersion"("questionPackageVersionId");

CREATE INDEX "AssessmentAttempt_questionPackageVersionId_idx"
  ON "AssessmentAttempt"("questionPackageVersionId");

ALTER TABLE "AssessmentConfigurationVersion"
  ADD CONSTRAINT "AssessmentConfigurationVersion_questionPackageVersionId_fkey"
  FOREIGN KEY ("questionPackageVersionId")
  REFERENCES "QuestionPackageVersion"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "AssessmentAttempt"
  ADD CONSTRAINT "AssessmentAttempt_questionPackageVersionId_fkey"
  FOREIGN KEY ("questionPackageVersionId")
  REFERENCES "QuestionPackageVersion"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

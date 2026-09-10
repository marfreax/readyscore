-- Phase 2.15.3 — Question Bank → PostgreSQL Runtime Integration
-- Safe delta migration for an existing development database.
-- Existing QuestionVersion rows are backfilled from createdAt.

ALTER TABLE "QuestionVersion"
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "QuestionVersion"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

ALTER TABLE "QuestionVersion"
ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE TABLE "AssessmentResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentResult_attemptId_key"
ON "AssessmentResult"("attemptId");

CREATE INDEX "QuestionVersion_updatedAt_idx"
ON "QuestionVersion"("updatedAt");

ALTER TABLE "AssessmentResult"
ADD CONSTRAINT "AssessmentResult_attemptId_fkey"
FOREIGN KEY ("attemptId")
REFERENCES "AssessmentAttempt"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

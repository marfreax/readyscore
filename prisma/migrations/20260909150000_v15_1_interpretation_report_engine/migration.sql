CREATE TABLE "V15Report" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "sourceFingerprint" TEXT NOT NULL,
  "assessmentAttemptIds" TEXT[] NOT NULL,
  "resultVersions" TEXT[] NOT NULL,
  "interpretationVersion" TEXT NOT NULL,
  "majorKnowledgeVersion" TEXT NOT NULL,
  "majorMatchingVersion" TEXT NOT NULL,
  "actionPlanVersion" TEXT NOT NULL,
  "templateVersion" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "V15Report_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "V15Report_userId_createdAt_idx" ON "V15Report"("userId", "createdAt");
CREATE INDEX "V15Report_status_createdAt_idx" ON "V15Report"("status", "createdAt");
CREATE UNIQUE INDEX "V15Report_sourceFingerprint_key" ON "V15Report"("sourceFingerprint");
ALTER TABLE "V15Report" ADD CONSTRAINT "V15Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

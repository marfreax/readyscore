CREATE TABLE "FreeLeadCapture" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "email" TEXT,
  "consent" BOOLEAN NOT NULL,
  "consentAt" TIMESTAMP(3) NOT NULL,
  "source" TEXT,
  "reportUnlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FreeLeadCapture_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FreeLeadCapture_attemptId_key" ON "FreeLeadCapture"("attemptId");
CREATE INDEX "FreeLeadCapture_whatsapp_idx" ON "FreeLeadCapture"("whatsapp");
CREATE INDEX "FreeLeadCapture_createdAt_idx" ON "FreeLeadCapture"("createdAt");

ALTER TABLE "FreeLeadCapture" ADD CONSTRAINT "FreeLeadCapture_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

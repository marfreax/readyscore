CREATE TABLE "BusinessLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL DEFAULT 'FREE_ASSESSMENT',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "consent" BOOLEAN NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "assessmentAttemptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessLead_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FreeLeadCapture" ADD COLUMN "businessLeadId" TEXT;

CREATE UNIQUE INDEX "BusinessLead_whatsapp_key" ON "BusinessLead"("whatsapp");
CREATE UNIQUE INDEX "BusinessLead_email_key" ON "BusinessLead"("email");
CREATE UNIQUE INDEX "BusinessLead_assessmentAttemptId_key" ON "BusinessLead"("assessmentAttemptId");
CREATE INDEX "BusinessLead_source_createdAt_idx" ON "BusinessLead"("source", "createdAt");
CREATE INDEX "BusinessLead_status_updatedAt_idx" ON "BusinessLead"("status", "updatedAt");
CREATE INDEX "BusinessLead_createdAt_idx" ON "BusinessLead"("createdAt");
CREATE INDEX "FreeLeadCapture_businessLeadId_idx" ON "FreeLeadCapture"("businessLeadId");

ALTER TABLE "BusinessLead" ADD CONSTRAINT "BusinessLead_assessmentAttemptId_fkey" FOREIGN KEY ("assessmentAttemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FreeLeadCapture" ADD CONSTRAINT "FreeLeadCapture_businessLeadId_fkey" FOREIGN KEY ("businessLeadId") REFERENCES "BusinessLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

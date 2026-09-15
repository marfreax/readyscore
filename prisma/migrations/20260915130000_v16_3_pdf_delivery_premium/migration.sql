-- V16.3 PDF generation and delivery ledger
CREATE TABLE "FreeReportDelivery" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "pdfStatus" TEXT NOT NULL DEFAULT 'NOT_GENERATED',
  "pdfContent" BYTEA,
  "pdfFileName" TEXT,
  "pdfGeneratedAt" TIMESTAMP(3),
  "whatsappStatus" TEXT NOT NULL DEFAULT 'NOT_ATTEMPTED',
  "whatsappError" TEXT,
  "emailStatus" TEXT NOT NULL DEFAULT 'NOT_ATTEMPTED',
  "emailError" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FreeReportDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FreeReportDelivery_attemptId_key" ON "FreeReportDelivery"("attemptId");
CREATE INDEX "FreeReportDelivery_pdfStatus_updatedAt_idx" ON "FreeReportDelivery"("pdfStatus", "updatedAt");
CREATE INDEX "FreeReportDelivery_whatsappStatus_updatedAt_idx" ON "FreeReportDelivery"("whatsappStatus", "updatedAt");
CREATE INDEX "FreeReportDelivery_emailStatus_updatedAt_idx" ON "FreeReportDelivery"("emailStatus", "updatedAt");
ALTER TABLE "FreeReportDelivery" ADD CONSTRAINT "FreeReportDelivery_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

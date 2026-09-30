-- V19.6 Public Trust, Legal & Data Privacy Compliance
CREATE TYPE "DataDeletionRequestStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED');

CREATE TABLE "DataDeletionRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "emailSnapshot" TEXT NOT NULL,
  "nameSnapshot" TEXT,
  "reason" TEXT,
  "status" "DataDeletionRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "processedBy" TEXT,
  "processingNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataDeletionRequest_status_requestedAt_idx" ON "DataDeletionRequest"("status", "requestedAt");
CREATE INDEX "DataDeletionRequest_userId_status_idx" ON "DataDeletionRequest"("userId", "status");
CREATE INDEX "DataDeletionRequest_emailSnapshot_idx" ON "DataDeletionRequest"("emailSnapshot");

ALTER TABLE "DataDeletionRequest" ADD CONSTRAINT "DataDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

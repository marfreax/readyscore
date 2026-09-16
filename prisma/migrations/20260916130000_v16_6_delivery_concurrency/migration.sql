-- V16.6 delivery concurrency hardening.
-- Serialize concurrent delivery requests for the same free-report attempt.
-- A lease/token pair prevents a stale worker from clearing a newer worker's lock.
ALTER TABLE "FreeReportDelivery"
  ADD COLUMN "processingUntil" TIMESTAMP(3),
  ADD COLUMN "processingToken" TEXT;

CREATE INDEX "FreeReportDelivery_processingUntil_idx"
  ON "FreeReportDelivery"("processingUntil");

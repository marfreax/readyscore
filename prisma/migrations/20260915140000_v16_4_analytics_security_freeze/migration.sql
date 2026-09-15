CREATE TABLE "FunnelEvent" (
  "id" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "attemptId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FunnelEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FunnelEvent_event_createdAt_idx" ON "FunnelEvent"("event", "createdAt");
CREATE INDEX "FunnelEvent_attemptId_createdAt_idx" ON "FunnelEvent"("attemptId", "createdAt");
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

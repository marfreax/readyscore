-- V13.3: server-authoritative timed attempt boundary.
ALTER TABLE "AssessmentAttempt" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "AssessmentAttempt_status_expiresAt_idx" ON "AssessmentAttempt"("status", "expiresAt");

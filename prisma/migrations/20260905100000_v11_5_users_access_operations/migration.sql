-- READY SCORE V11.5 — Users & Access Operations
-- Additive, non-destructive account status boundary.
-- Historical attempts, answers, results, purchases, entitlements, and
-- institution relationships are intentionally untouched.

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "User"
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");

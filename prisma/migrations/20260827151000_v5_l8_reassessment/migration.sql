-- READY SCORE V5 L8 — Reassessment credit ledger
-- Consumable credit + immutable new assessment attempts.
-- Existing attempts/results are never overwritten.

CREATE TYPE "ReassessmentCreditStatus" AS ENUM ('AVAILABLE', 'CONSUMED', 'EXPIRED');
CREATE TYPE "ReassessmentTestType" AS ENUM ('RIASEC', 'DISC', 'EQ', 'COGNITIVE');

CREATE TABLE "ReassessmentCredit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "addOnProductId" TEXT,
  "testType" "ReassessmentTestType" NOT NULL,
  "status" "ReassessmentCreditStatus" NOT NULL DEFAULT 'AVAILABLE',
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumedAt" TIMESTAMP(3),
  "consumedAttemptId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReassessmentCredit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReassessmentCredit_consumedAttemptId_key"
  ON "ReassessmentCredit"("consumedAttemptId");
CREATE INDEX "ReassessmentCredit_userId_testType_status_idx"
  ON "ReassessmentCredit"("userId","testType","status");
CREATE INDEX "ReassessmentCredit_userId_consumedAt_idx"
  ON "ReassessmentCredit"("userId","consumedAt");
CREATE INDEX "ReassessmentCredit_addOnProductId_idx"
  ON "ReassessmentCredit"("addOnProductId");

ALTER TABLE "ReassessmentCredit"
  ADD CONSTRAINT "ReassessmentCredit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReassessmentCredit"
  ADD CONSTRAINT "ReassessmentCredit_addOnProductId_fkey"
  FOREIGN KEY ("addOnProductId") REFERENCES "AddOnProduct"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AddOnProduct"
  ("id","code","name","description","priceIdr","status","sortOrder")
VALUES
  ('addon-reassessment-credit-v1','REASSESSMENT_CREDIT_V1','Reassessment Credit','One additional assessment attempt for an already unlocked test.',49000,'ACTIVE',5);

INSERT INTO "AddOnProductEntitlement"
  ("id","addOnProductId","type","resourceType","resourceKey","metadata")
VALUES
  ('aoe-reassessment-credit','addon-reassessment-credit-v1','REASSESSMENT_CREDIT','FEATURE','REASSESSMENT_CREDIT_V1',
   '{"version":"V5_L8_REASSESSMENT_V1","consumable":true}');

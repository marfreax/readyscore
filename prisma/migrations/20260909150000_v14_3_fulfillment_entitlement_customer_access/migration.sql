-- V14.3 — Fulfillment, Entitlement & Customer Access

ALTER TABLE "UserEntitlement"
  ADD COLUMN "sourceOrderId" TEXT,
  ADD COLUMN "usageLimit" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "usageConsumed" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "UserEntitlement_sourceOrderId_idx"
  ON "UserEntitlement"("sourceOrderId");

CREATE TABLE "CommercialFulfillment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "CommercialFulfillmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "fulfilledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommercialFulfillment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommercialFulfillment_orderId_key"
  ON "CommercialFulfillment"("orderId");
CREATE INDEX "CommercialFulfillment_status_updatedAt_idx"
  ON "CommercialFulfillment"("status", "updatedAt");

ALTER TABLE "CommercialFulfillment"
  ADD CONSTRAINT "CommercialFulfillment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "CommercialOrder"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

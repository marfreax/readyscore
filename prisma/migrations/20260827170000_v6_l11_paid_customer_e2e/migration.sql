-- READY SCORE V6 L11
-- Paid Customer E2E support for paid add-on fulfillment.
-- Core Product/Tier and measurement semantics remain unchanged.

CREATE TABLE "ScalevAddOnPurchase" (
    "id" TEXT NOT NULL,
    "scalevOrderId" TEXT NOT NULL,
    "scalevCustomerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "productSku" TEXT NOT NULL,
    "addOnProductId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "status" "ScalevPurchaseStatus" NOT NULL DEFAULT 'PAID',
    "paidAt" TIMESTAMP(3),
    "sourceEventId" TEXT,
    "orderPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScalevAddOnPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScalevAddOnPurchase_scalevOrderId_key" ON "ScalevAddOnPurchase"("scalevOrderId");
CREATE INDEX "ScalevAddOnPurchase_userId_createdAt_idx" ON "ScalevAddOnPurchase"("userId", "createdAt");
CREATE INDEX "ScalevAddOnPurchase_customerEmail_createdAt_idx" ON "ScalevAddOnPurchase"("customerEmail", "createdAt");
CREATE INDEX "ScalevAddOnPurchase_status_createdAt_idx" ON "ScalevAddOnPurchase"("status", "createdAt");
CREATE INDEX "ScalevAddOnPurchase_productSku_idx" ON "ScalevAddOnPurchase"("productSku");

ALTER TABLE "ScalevAddOnPurchase"
ADD CONSTRAINT "ScalevAddOnPurchase_addOnProductId_fkey"
FOREIGN KEY ("addOnProductId") REFERENCES "AddOnProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScalevAddOnPurchase"
ADD CONSTRAINT "ScalevAddOnPurchase_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScalevAddOnPurchase"
ADD CONSTRAINT "ScalevAddOnPurchase_sourceEventId_fkey"
FOREIGN KEY ("sourceEventId") REFERENCES "ScalevWebhookEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScalevHandoff" ALTER COLUMN "purchaseId" DROP NOT NULL;
ALTER TABLE "ScalevHandoff" ADD COLUMN "addOnPurchaseId" TEXT;
CREATE UNIQUE INDEX "ScalevHandoff_addOnPurchaseId_key" ON "ScalevHandoff"("addOnPurchaseId");
ALTER TABLE "ScalevHandoff"
ADD CONSTRAINT "ScalevHandoff_addOnPurchaseId_fkey"
FOREIGN KEY ("addOnPurchaseId") REFERENCES "ScalevAddOnPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScalevHandoff" ADD CONSTRAINT "ScalevHandoff_exactly_one_owner_check" CHECK (("purchaseId" IS NOT NULL) <> ("addOnPurchaseId" IS NOT NULL));

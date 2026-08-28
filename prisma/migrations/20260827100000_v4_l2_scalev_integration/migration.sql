-- READY SCORE V4 L2
-- Scalev -> ReadyScore Integration
--
-- Scalev remains the commerce/order/customer layer.
-- ReadyScore stores only webhook receipts, paid purchase references,
-- entitlement fulfillment state, and single-use handoff state.

CREATE TYPE "ScalevWebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');
CREATE TYPE "ScalevPurchaseStatus" AS ENUM ('PAID', 'FULFILLED', 'UNMAPPED', 'FAILED');

CREATE TABLE "ScalevWebhookEvent" (
    "id" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "orderId" TEXT,
    "eventTime" TIMESTAMP(3),
    "status" "ScalevWebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScalevWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScalevPurchase" (
    "id" TEXT NOT NULL,
    "scalevOrderId" TEXT NOT NULL,
    "scalevCustomerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "productSku" TEXT NOT NULL,
    "productTier" "CommercialTier" NOT NULL,
    "selectedTestType" TEXT,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "status" "ScalevPurchaseStatus" NOT NULL DEFAULT 'PAID',
    "paidAt" TIMESTAMP(3),
    "sourceEventId" TEXT,
    "orderPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScalevPurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScalevHandoff" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScalevHandoff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScalevWebhookEvent_uniqueId_key" ON "ScalevWebhookEvent"("uniqueId");
CREATE INDEX "ScalevWebhookEvent_orderId_event_idx" ON "ScalevWebhookEvent"("orderId", "event");
CREATE INDEX "ScalevWebhookEvent_status_createdAt_idx" ON "ScalevWebhookEvent"("status", "createdAt");

CREATE UNIQUE INDEX "ScalevPurchase_scalevOrderId_key" ON "ScalevPurchase"("scalevOrderId");
CREATE INDEX "ScalevPurchase_userId_createdAt_idx" ON "ScalevPurchase"("userId", "createdAt");
CREATE INDEX "ScalevPurchase_customerEmail_createdAt_idx" ON "ScalevPurchase"("customerEmail", "createdAt");
CREATE INDEX "ScalevPurchase_status_createdAt_idx" ON "ScalevPurchase"("status", "createdAt");
CREATE INDEX "ScalevPurchase_productSku_idx" ON "ScalevPurchase"("productSku");

CREATE UNIQUE INDEX "ScalevHandoff_purchaseId_key" ON "ScalevHandoff"("purchaseId");
CREATE UNIQUE INDEX "ScalevHandoff_tokenHash_key" ON "ScalevHandoff"("tokenHash");
CREATE INDEX "ScalevHandoff_expiresAt_consumedAt_idx" ON "ScalevHandoff"("expiresAt", "consumedAt");

ALTER TABLE "ScalevPurchase"
ADD CONSTRAINT "ScalevPurchase_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ScalevPurchase"
ADD CONSTRAINT "ScalevPurchase_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ScalevPurchase"
ADD CONSTRAINT "ScalevPurchase_sourceEventId_fkey"
FOREIGN KEY ("sourceEventId") REFERENCES "ScalevWebhookEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScalevHandoff"
ADD CONSTRAINT "ScalevHandoff_purchaseId_fkey"
FOREIGN KEY ("purchaseId") REFERENCES "ScalevPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

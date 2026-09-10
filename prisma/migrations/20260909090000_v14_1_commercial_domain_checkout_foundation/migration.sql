-- V14.1 Commercial Domain & Checkout Foundation
CREATE TYPE "CommercialOrderStatus" AS ENUM ('CREATED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "CommercialPaymentStatus" AS ENUM ('CREATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "CommercialFulfillmentStatus" AS ENUM ('NOT_STARTED', 'FULFILLMENT_PENDING', 'FULFILLED', 'FULFILLMENT_FAILED');

CREATE TABLE "CommercialOrder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "productNameSnapshot" TEXT NOT NULL,
  "assessmentTypeSnapshot" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPriceIdrSnapshot" INTEGER NOT NULL,
  "totalAmountIdr" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IDR',
  "commercialConfig" JSONB,
  "status" "CommercialOrderStatus" NOT NULL DEFAULT 'CREATED',
  "paymentStatus" "CommercialPaymentStatus" NOT NULL DEFAULT 'CREATED',
  "fulfillmentStatus" "CommercialFulfillmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "provider" TEXT,
  "providerReference" TEXT,
  "paidAt" TIMESTAMP(3),
  "fulfilledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommercialOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommercialOrder_orderNumber_key" ON "CommercialOrder"("orderNumber");
CREATE INDEX "CommercialOrder_userId_createdAt_idx" ON "CommercialOrder"("userId", "createdAt");
CREATE INDEX "CommercialOrder_productId_createdAt_idx" ON "CommercialOrder"("productId", "createdAt");
CREATE INDEX "CommercialOrder_paymentStatus_createdAt_idx" ON "CommercialOrder"("paymentStatus", "createdAt");
CREATE INDEX "CommercialOrder_fulfillmentStatus_createdAt_idx" ON "CommercialOrder"("fulfillmentStatus", "createdAt");

CREATE TABLE "CommercialAuditEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fromState" TEXT,
  "toState" TEXT,
  "source" TEXT NOT NULL,
  "reference" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommercialAuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommercialAuditEvent_orderId_createdAt_idx" ON "CommercialAuditEvent"("orderId", "createdAt");
CREATE INDEX "CommercialAuditEvent_action_createdAt_idx" ON "CommercialAuditEvent"("action", "createdAt");
CREATE INDEX "CommercialAuditEvent_source_createdAt_idx" ON "CommercialAuditEvent"("source", "createdAt");

ALTER TABLE "CommercialOrder" ADD CONSTRAINT "CommercialOrder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialOrder" ADD CONSTRAINT "CommercialOrder_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialAuditEvent" ADD CONSTRAINT "CommercialAuditEvent_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "CommercialOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

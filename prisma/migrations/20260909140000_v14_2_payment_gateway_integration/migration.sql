-- V14.2 Payment Gateway Integration
CREATE TYPE "CommercialPaymentAttemptStatus" AS ENUM ('CREATED','PENDING','PAID','FAILED','EXPIRED','CANCELLED');
CREATE TYPE "CommercialWebhookStatus" AS ENUM ('RECEIVED','PROCESSED','IGNORED','FAILED');

CREATE TABLE "CommercialPaymentAttempt" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "providerTransactionId" TEXT,
  "providerReference" TEXT,
  "paymentToken" TEXT,
  "redirectUrl" TEXT,
  "status" "CommercialPaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
  "providerStatus" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommercialPaymentAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommercialPaymentAttempt_orderId_provider_key" ON "CommercialPaymentAttempt"("orderId","provider");
CREATE UNIQUE INDEX "CommercialPaymentAttempt_provider_idempotencyKey_key" ON "CommercialPaymentAttempt"("provider","idempotencyKey");
CREATE UNIQUE INDEX "CommercialPaymentAttempt_provider_providerTransactionId_key" ON "CommercialPaymentAttempt"("provider","providerTransactionId");
CREATE INDEX "CommercialPaymentAttempt_provider_status_createdAt_idx" ON "CommercialPaymentAttempt"("provider","status","createdAt");
ALTER TABLE "CommercialPaymentAttempt" ADD CONSTRAINT "CommercialPaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommercialOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CommercialWebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "orderId" TEXT,
  "providerTransactionId" TEXT,
  "eventType" TEXT NOT NULL,
  "status" "CommercialWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
  "payload" JSONB NOT NULL,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommercialWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommercialWebhookEvent_provider_eventKey_key" ON "CommercialWebhookEvent"("provider","eventKey");
CREATE INDEX "CommercialWebhookEvent_orderId_provider_idx" ON "CommercialWebhookEvent"("orderId","provider");
CREATE INDEX "CommercialWebhookEvent_providerTransactionId_provider_idx" ON "CommercialWebhookEvent"("providerTransactionId","provider");
CREATE INDEX "CommercialWebhookEvent_provider_status_createdAt_idx" ON "CommercialWebhookEvent"("provider","status","createdAt");
ALTER TABLE "CommercialWebhookEvent" ADD CONSTRAINT "CommercialWebhookEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommercialOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

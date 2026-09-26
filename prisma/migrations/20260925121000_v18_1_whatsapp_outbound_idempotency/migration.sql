-- V18.1: durable client request id for safe outbound retry/idempotency.
ALTER TABLE "WhatsAppMessage" ADD COLUMN "clientRequestId" TEXT;
CREATE UNIQUE INDEX "WhatsAppMessage_clientRequestId_key" ON "WhatsAppMessage"("clientRequestId");

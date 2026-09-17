CREATE TYPE "WhatsAppConversationStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "WhatsAppMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "WhatsAppMessageType" AS ENUM ('TEXT', 'DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'UNKNOWN');
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('RECEIVED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE "WhatsAppChannel" AS ENUM ('WHATSAPP');

CREATE TABLE "WhatsAppConversation" (
    "id" TEXT NOT NULL,
    "businessLeadId" TEXT,
    "channel" "WhatsAppChannel" NOT NULL DEFAULT 'WHATSAPP',
    "phoneNumber" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "WhatsAppConversationStatus" NOT NULL DEFAULT 'OPEN',
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "WhatsAppMessageDirection" NOT NULL,
    "messageType" "WhatsAppMessageType" NOT NULL,
    "externalMessageId" TEXT,
    "text" TEXT,
    "mediaId" TEXT,
    "mediaMimeType" TEXT,
    "mediaFilename" TEXT,
    "status" "WhatsAppMessageStatus" NOT NULL,
    "providerErrorCode" TEXT,
    "providerErrorMessage" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppConversation_phoneNumber_channel_key" ON "WhatsAppConversation"("phoneNumber", "channel");
CREATE INDEX "WhatsAppConversation_status_lastMessageAt_idx" ON "WhatsAppConversation"("status", "lastMessageAt");
CREATE INDEX "WhatsAppConversation_businessLeadId_idx" ON "WhatsAppConversation"("businessLeadId");
CREATE INDEX "WhatsAppConversation_phoneNumber_idx" ON "WhatsAppConversation"("phoneNumber");
CREATE INDEX "WhatsAppConversation_lastMessageAt_idx" ON "WhatsAppConversation"("lastMessageAt");
CREATE UNIQUE INDEX "WhatsAppMessage_externalMessageId_key" ON "WhatsAppMessage"("externalMessageId");
CREATE INDEX "WhatsAppMessage_conversationId_createdAt_idx" ON "WhatsAppMessage"("conversationId", "createdAt");
CREATE INDEX "WhatsAppMessage_conversationId_sentAt_idx" ON "WhatsAppMessage"("conversationId", "sentAt");
CREATE INDEX "WhatsAppMessage_status_updatedAt_idx" ON "WhatsAppMessage"("status", "updatedAt");
CREATE INDEX "WhatsAppMessage_direction_createdAt_idx" ON "WhatsAppMessage"("direction", "createdAt");

ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_businessLeadId_fkey" FOREIGN KEY ("businessLeadId") REFERENCES "BusinessLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

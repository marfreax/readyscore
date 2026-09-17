import { prisma } from "../db/prisma";
import { normalizeWhatsAppPhone } from "./phone-normalizer";
import type { WhatsAppWebhookMessage, WhatsAppWebhookStatus } from "./webhook-normalizer";

function timestampToDate(value: string | null): Date {
  if (value && /^\d+$/.test(value)) {
    const seconds = Number(value);
    if (Number.isSafeInteger(seconds) && seconds > 0) return new Date(seconds * 1000);
  }
  return new Date();
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002");
}

function mapMessageType(type: string) {
  switch (type.toLowerCase()) {
    case "text": return "TEXT" as const;
    case "document": return "DOCUMENT" as const;
    case "image": return "IMAGE" as const;
    case "video": return "VIDEO" as const;
    case "audio": return "AUDIO" as const;
    default: return "UNKNOWN" as const;
  }
}

function mapProviderStatus(status: string) {
  switch (status.toLowerCase()) {
    case "sent": return "SENT" as const;
    case "delivered": return "DELIVERED" as const;
    case "read": return "READ" as const;
    case "failed": return "FAILED" as const;
    default: return null;
  }
}

async function findBusinessLead(phoneNumber: string) {
  return prisma.businessLead.findUnique({ where: { whatsapp: phoneNumber }, select: { id: true } });
}

async function getOrCreateConversation(phoneNumber: string, displayName: string | null, at: Date) {
  const existing = await prisma.whatsAppConversation.findUnique({
    where: { phoneNumber_channel: { phoneNumber, channel: "WHATSAPP" } },
    select: { id: true, displayName: true, businessLeadId: true },
  });
  if (existing) {
    const lead = existing.businessLeadId ? null : await findBusinessLead(phoneNumber);
    if (displayName && displayName !== existing.displayName || lead?.id) {
      return prisma.whatsAppConversation.update({
        where: { id: existing.id },
        data: {
          ...(displayName ? { displayName } : {}),
          ...(lead?.id ? { businessLeadId: lead.id } : {}),
        },
      });
    }
    return prisma.whatsAppConversation.findUniqueOrThrow({ where: { id: existing.id } });
  }

  const lead = await findBusinessLead(phoneNumber);
  try {
    return await prisma.whatsAppConversation.create({
      data: {
        phoneNumber,
        displayName,
        businessLeadId: lead?.id ?? null,
        channel: "WHATSAPP",
        lastMessageAt: at,
        lastInboundAt: at,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    return prisma.whatsAppConversation.findUniqueOrThrow({
      where: { phoneNumber_channel: { phoneNumber, channel: "WHATSAPP" } },
    });
  }
}

export async function persistInboundWhatsAppMessage(input: WhatsAppWebhookMessage, displayName: string | null = null) {
  const phoneNumber = input.from ? normalizeWhatsAppPhone(input.from) : null;
  if (!phoneNumber) return { accepted: false as const, reason: "INVALID_PHONE" as const };

  const existingMessage = await prisma.whatsAppMessage.findUnique({
    where: { externalMessageId: input.externalMessageId },
    select: { id: true, conversationId: true },
  });
  if (existingMessage) return { accepted: true as const, duplicate: true as const, messageId: existingMessage.id, conversationId: existingMessage.conversationId };

  const occurredAt = timestampToDate(input.timestamp);
  const conversation = await getOrCreateConversation(phoneNumber, displayName, occurredAt);

  try {
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          direction: "INBOUND",
          messageType: mapMessageType(input.type),
          externalMessageId: input.externalMessageId,
          text: input.text,
          status: "RECEIVED",
          sentAt: occurredAt,
          metadata: { provider: "meta_whatsapp_cloud_api" },
        },
      });
      await tx.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { unreadCount: { increment: 1 }, lastMessageAt: occurredAt, lastInboundAt: occurredAt, ...(displayName ? { displayName } : {}) },
      });
      return created;
    });
    return { accepted: true as const, duplicate: false as const, messageId: message.id, conversationId: conversation.id };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const message = await prisma.whatsAppMessage.findUniqueOrThrow({ where: { externalMessageId: input.externalMessageId }, select: { id: true, conversationId: true } });
    return { accepted: true as const, duplicate: true as const, messageId: message.id, conversationId: message.conversationId };
  }
}

export async function applyWhatsAppStatus(input: WhatsAppWebhookStatus) {
  const mapped = mapProviderStatus(input.status);
  if (!mapped) return { updated: false as const, reason: "UNSUPPORTED_STATUS" as const };

  const message = await prisma.whatsAppMessage.findUnique({ where: { externalMessageId: input.externalMessageId }, select: { id: true, conversationId: true, status: true } });
  if (!message) return { updated: false as const, reason: "MESSAGE_NOT_FOUND" as const };

  const at = timestampToDate(input.timestamp);
  const data: Record<string, unknown> = { status: mapped };
  if (mapped === "SENT") data.sentAt = at;
  if (mapped === "DELIVERED") data.deliveredAt = at;
  if (mapped === "READ") data.readAt = at;
  if (mapped === "FAILED") data.providerErrorMessage = "WhatsApp provider reported delivery failure";

  // Provider states are monotonic for the normal SENT → DELIVERED → READ lifecycle.
  const rank: Record<string, number> = { RECEIVED: 0, SENDING: 1, SENT: 2, DELIVERED: 3, READ: 4, FAILED: 5 };
  if (mapped !== "FAILED" && (rank[mapped] ?? 0) < (rank[message.status] ?? 0)) return { updated: false as const, reason: "STALE_STATUS" as const };

  await prisma.whatsAppMessage.update({ where: { id: message.id }, data });
  return { updated: true as const, messageId: message.id, conversationId: message.conversationId, status: mapped };
}

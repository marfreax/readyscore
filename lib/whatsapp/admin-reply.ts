import { prisma } from "../db/prisma";
import { normalizeWhatsAppPhone } from "./phone-normalizer";
import { sendWhatsAppText, WhatsAppProviderError } from "./cloud-api-client";

const MAX_TEXT_LENGTH = 4096;

export class AdminWhatsAppReplyError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AdminWhatsAppReplyError";
  }
}

export function validateAdminWhatsAppText(value: unknown): string {
  if (typeof value !== "string") throw new AdminWhatsAppReplyError("WHATSAPP_MESSAGE_TEXT_REQUIRED");
  const text = value.trim();
  if (!text) throw new AdminWhatsAppReplyError("WHATSAPP_MESSAGE_TEXT_REQUIRED");
  if (text.length > MAX_TEXT_LENGTH) throw new AdminWhatsAppReplyError("WHATSAPP_MESSAGE_TEXT_TOO_LONG");
  return text;
}

export async function sendAdminWhatsAppText(conversationId: string, rawText: unknown, actorUserId?: string) {
  const text = validateAdminWhatsAppText(rawText);
  const conversation = await prisma.whatsAppConversation.findUnique({ where: { id: conversationId }, select: { id: true, channel: true, phoneNumber: true } });
  if (!conversation || conversation.channel !== "WHATSAPP") throw new AdminWhatsAppReplyError("WHATSAPP_CONVERSATION_NOT_FOUND");
  const to = normalizeWhatsAppPhone(conversation.phoneNumber);
  if (!to) throw new AdminWhatsAppReplyError("WHATSAPP_RECIPIENT_INVALID");

  const pending = await prisma.whatsAppMessage.create({
    data: { conversationId, direction: "OUTBOUND", messageType: "TEXT", status: "SENDING", text },
  });

  try {
    const result = await sendWhatsAppText(to, text);
    const updated = await prisma.whatsAppMessage.update({
      where: { id: pending.id },
      data: { externalMessageId: result.providerMessageId, status: "SENT", sentAt: new Date(), metadata: { provider: "meta_whatsapp_cloud_api" } },
    });
    await prisma.whatsAppConversation.update({ where: { id: conversationId }, data: { lastMessageAt: updated.sentAt, lastOutboundAt: updated.sentAt } });
    if (actorUserId) {
      await prisma.adminContentAuditEvent.create({
        data: {
          entityType: "WHATSAPP_CONVERSATION",
          entityId: conversationId,
          action: "WHATSAPP_MESSAGE_SENT",
          actorUserId,
          metadata: { messageId: updated.id, providerMessageId: result.providerMessageId, messageType: "TEXT" },
        },
      }).catch((auditError) => console.error(`[whatsapp-audit] send_audit_failed code=${auditError instanceof Error ? auditError.message : "UNKNOWN"}`));
    }
    return updated;
  } catch (error) {
    const code = error instanceof WhatsAppProviderError ? error.code : "WHATSAPP_UNKNOWN_ERROR";
    const providerErrorMessage = error instanceof Error && error.message.includes(":") ? error.message.slice(code.length + 1, code.length + 501) : null;
    await prisma.whatsAppMessage.update({ where: { id: pending.id }, data: { status: "FAILED", providerErrorCode: code, providerErrorMessage } });
    throw new AdminWhatsAppReplyError(code);
  }
}

import { prisma } from "./db/prisma";
import { buildFreeReport } from "./free-report";
import type { AssessmentResult } from "./assessment/types";
import { normalizeWhatsAppPhone } from "./whatsapp/phone-normalizer";
import {
  buildAdminPaginationMeta,
  normalizeAdminPagination,
  type AdminPaginatedResult,
} from "./admin-pagination";

export const WHATSAPP_INBOX_PAGE_SIZE = 50;
export const WHATSAPP_LEAD_CANDIDATE_LIMIT = 20;

export type AdminWhatsAppConversationListItem = {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  status: string;
  unreadCount: number;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  lastMessage: { id: string; direction: string; messageType: string; text: string | null; status: string; createdAt: string } | null;
};

export type AdminWhatsAppMessage = {
  id: string;
  conversationId: string;
  direction: string;
  messageType: string;
  externalMessageId: string | null;
  text: string | null;
  status: string;
  providerErrorCode: string | null;
  providerErrorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
};

function toMessage(message: {
  id: string; conversationId: string; direction: any; messageType: any; externalMessageId: string | null;
  text: string | null; status: any; providerErrorCode: string | null; providerErrorMessage: string | null;
  sentAt: Date | null; deliveredAt: Date | null; readAt: Date | null; createdAt: Date;
}): AdminWhatsAppMessage {
  return {
    id: message.id, conversationId: message.conversationId, direction: message.direction,
    messageType: message.messageType, externalMessageId: message.externalMessageId, text: message.text,
    status: message.status, providerErrorCode: message.providerErrorCode, providerErrorMessage: message.providerErrorMessage,
    sentAt: message.sentAt?.toISOString() ?? null, deliveredAt: message.deliveredAt?.toISOString() ?? null,
    readAt: message.readAt?.toISOString() ?? null, createdAt: message.createdAt.toISOString(),
  };
}

function buildAssessmentContext(attempt: {
  id: string;
  assessmentType: string;
  status: string;
  completedAt: Date | null;
  result: { result: unknown } | null;
} | null) {
  if (!attempt) return null;
  let riasecResult: string | null = null;
  if (attempt.result?.result) {
    try { riasecResult = buildFreeReport(attempt.result.result as AssessmentResult).typeName; } catch { riasecResult = null; }
  }
  return {
    attemptId: attempt.id,
    assessmentType: attempt.assessmentType,
    status: attempt.status,
    completedAt: attempt.completedAt?.toISOString() ?? null,
    riasecResult,
  };
}

function leadContext(lead: {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  source: string;
  status: string;
  consent: boolean;
  consentAt: Date;
  createdAt: Date;
  updatedAt: Date;
  assessmentAttemptId: string | null;
  assessmentAttempt: {
    id: string;
    assessmentType: string;
    status: string;
    completedAt: Date | null;
    result: { result: unknown } | null;
    freeReportDelivery: { pdfStatus: string; whatsappStatus: string; emailStatus: string } | null;
  } | null;
}) {
  const attempt = lead.assessmentAttempt;
  return {
    id: lead.id,
    name: lead.name,
    whatsapp: lead.whatsapp,
    email: lead.email,
    source: lead.source,
    status: lead.status,
    consent: lead.consent,
    consentAt: lead.consentAt.toISOString(),
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    assessmentAttemptId: lead.assessmentAttemptId,
    assessment: buildAssessmentContext(attempt),
    freeReport: attempt?.freeReportDelivery ? {
      generated: attempt.freeReportDelivery.pdfStatus,
      whatsappDelivery: attempt.freeReportDelivery.whatsappStatus,
      emailDelivery: attempt.freeReportDelivery.emailStatus,
    } : null,
  };
}

async function resolveExactBusinessLead(phoneNumber: string) {
  const normalized = normalizeWhatsAppPhone(phoneNumber);
  if (!normalized) return null;
  return prisma.businessLead.findUnique({
    where: { whatsapp: normalized },
    select: { id: true },
  });
}

async function syncConversationBusinessLead(conversationId: string, phoneNumber: string, currentBusinessLeadId: string | null) {
  if (currentBusinessLeadId) return currentBusinessLeadId;
  const match = await resolveExactBusinessLead(phoneNumber);
  if (!match) return null;
  const updated = await prisma.whatsAppConversation.updateMany({
    where: { id: conversationId, businessLeadId: null },
    data: { businessLeadId: match.id },
  });
  return updated.count === 1 || updated.count === 0 ? match.id : null;
}

export async function listAdminWhatsAppConversations(input: { page?: number; pageSize?: number; search?: string; status?: "OPEN" | "CLOSED" } = {}): Promise<AdminPaginatedResult<AdminWhatsAppConversationListItem>> {
  const requested = normalizeAdminPagination({ page: input.page, pageSize: input.pageSize ?? WHATSAPP_INBOX_PAGE_SIZE });
  const pageSize = Math.min(requested.pageSize, WHATSAPP_INBOX_PAGE_SIZE);
  const pagination = { ...requested, pageSize, limit: pageSize, offset: (requested.page - 1) * pageSize };
  const search = input.search?.trim();
  const where = {
    channel: "WHATSAPP" as const,
    status: input.status ?? "OPEN" as const,
    ...(search ? { OR: [{ displayName: { contains: search, mode: "insensitive" as const } }, { phoneNumber: { contains: search } }] } : {}),
  };
  const [total, conversations] = await prisma.$transaction([
    prisma.whatsAppConversation.count({ where }),
    prisma.whatsAppConversation.findMany({
      where,
      orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: pagination.limit,
      include: { messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 } },
    }),
  ]);
  const items = conversations.map((conversation) => {
    const last = conversation.messages[0];
    return {
      id: conversation.id, phoneNumber: conversation.phoneNumber, displayName: conversation.displayName,
      status: conversation.status, unreadCount: conversation.unreadCount,
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
      lastInboundAt: conversation.lastInboundAt?.toISOString() ?? null,
      lastOutboundAt: conversation.lastOutboundAt?.toISOString() ?? null,
      lastMessage: last ? toMessage(last) : null,
    };
  });
  return { items, pagination: buildAdminPaginationMeta({ page: pagination.page, pageSize }, total) };
}

export async function getAdminWhatsAppConversation(id: string) {
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id },
    include: {
      businessLead: {
        select: {
          id: true, name: true, whatsapp: true, email: true, source: true, status: true,
          consent: true, consentAt: true, createdAt: true, updatedAt: true, assessmentAttemptId: true,
          assessmentAttempt: {
            select: {
              id: true, assessmentType: true, status: true, completedAt: true,
              result: { select: { result: true } },
              freeReportDelivery: { select: { pdfStatus: true, whatsappStatus: true, emailStatus: true } },
            },
          },
        },
      },
      messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50 },
    },
  });
  if (!conversation) return null;

  const resolvedLeadId = await syncConversationBusinessLead(conversation.id, conversation.phoneNumber, conversation.businessLeadId);
  const lead = resolvedLeadId && !conversation.businessLead
    ? await prisma.businessLead.findUnique({
        where: { id: resolvedLeadId },
        select: {
          id: true, name: true, whatsapp: true, email: true, source: true, status: true,
          consent: true, consentAt: true, createdAt: true, updatedAt: true, assessmentAttemptId: true,
          assessmentAttempt: {
            select: {
              id: true, assessmentType: true, status: true, completedAt: true,
              result: { select: { result: true } },
              freeReportDelivery: { select: { pdfStatus: true, whatsappStatus: true, emailStatus: true } },
            },
          },
        },
      })
    : conversation.businessLead;

  return {
    id: conversation.id,
    phoneNumber: conversation.phoneNumber,
    displayName: conversation.displayName,
    status: conversation.status,
    unreadCount: conversation.unreadCount,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    lastInboundAt: conversation.lastInboundAt?.toISOString() ?? null,
    lastOutboundAt: conversation.lastOutboundAt?.toISOString() ?? null,
    messages: conversation.messages.slice().reverse().map(toMessage),
    context: {
      customer: {
        name: lead?.name ?? conversation.displayName,
        whatsapp: conversation.phoneNumber,
        email: lead?.email ?? null,
      },
      businessLead: lead ? leadContext(lead) : null,
      assessment: lead ? buildAssessmentContext(lead.assessmentAttempt) : null,
      freeReport: lead?.assessmentAttempt?.freeReportDelivery ? {
        generated: lead.assessmentAttempt.freeReportDelivery.pdfStatus,
        whatsappDelivery: lead.assessmentAttempt.freeReportDelivery.whatsappStatus,
        emailDelivery: lead.assessmentAttempt.freeReportDelivery.emailStatus,
      } : null,
      matching: {
        strategy: "EXACT_WHATSAPP_THEN_EXPLICIT_LINK",
        matchedBy: lead ? (lead.whatsapp === conversation.phoneNumber ? "WHATSAPP" : "EXPLICIT_ADMIN_LINK") : null,
      },
    },
  };
}

export async function listAdminWhatsAppMessages(id: string, input: { page?: number; pageSize?: number } = {}) {
  const requested = normalizeAdminPagination({ page: input.page, pageSize: input.pageSize ?? WHATSAPP_INBOX_PAGE_SIZE });
  const pageSize = Math.min(requested.pageSize, WHATSAPP_INBOX_PAGE_SIZE);
  const pagination = { ...requested, pageSize, limit: pageSize, offset: (requested.page - 1) * pageSize };
  const conversation = await prisma.whatsAppConversation.findUnique({ where: { id }, select: { id: true } });
  if (!conversation) return null;
  const [total, messages] = await prisma.$transaction([
    prisma.whatsAppMessage.count({ where: { conversationId: id } }),
    prisma.whatsAppMessage.findMany({ where: { conversationId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: pagination.offset, take: pagination.limit }),
  ]);
  return { items: messages.slice().reverse().map(toMessage), pagination: buildAdminPaginationMeta({ page: pagination.page, pageSize }, total) };
}

export async function markAdminWhatsAppConversationRead(id: string, actorUserId?: string) {
  const result = await prisma.whatsAppConversation.updateMany({ where: { id, channel: "WHATSAPP" }, data: { unreadCount: 0 } });
  if (result.count === 0) return null;
  const conversation = await prisma.whatsAppConversation.findUnique({ where: { id }, select: { id: true, unreadCount: true, updatedAt: true } });
  if (conversation && actorUserId) {
    await prisma.adminContentAuditEvent.create({
      data: { entityType: "WHATSAPP_CONVERSATION", entityId: id, action: "WHATSAPP_CONVERSATION_READ", actorUserId, metadata: { unreadCount: 0 } },
    }).catch((auditError) => console.error(`[whatsapp-audit] read_audit_failed code=${auditError instanceof Error ? auditError.message : "UNKNOWN"}`));
  }
  return conversation;
}

export async function searchAdminWhatsAppLeadCandidates(conversationId: string, rawSearch: string) {
  const conversation = await prisma.whatsAppConversation.findUnique({ where: { id: conversationId }, select: { id: true, phoneNumber: true, businessLeadId: true, channel: true } });
  if (!conversation || conversation.channel !== "WHATSAPP") return null;
  const search = rawSearch.trim();
  if (search.length < 2) return { items: [] };
  const normalizedPhone = normalizeWhatsAppPhone(search);
  const leads = await prisma.businessLead.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        ...(normalizedPhone ? [{ whatsapp: normalizedPhone }] : [{ whatsapp: { contains: search } }]),
      ],
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: WHATSAPP_LEAD_CANDIDATE_LIMIT,
    select: { id: true, name: true, whatsapp: true, email: true, source: true, status: true, assessmentAttemptId: true },
  });
  return {
    items: leads.map((lead) => ({
      id: lead.id, name: lead.name, whatsapp: lead.whatsapp, email: lead.email,
      source: lead.source, status: lead.status, assessmentAttemptId: lead.assessmentAttemptId,
      exactWhatsAppMatch: lead.whatsapp === conversation.phoneNumber,
    })),
  };
}

export async function linkAdminWhatsAppConversationToBusinessLead(input: {
  conversationId: string;
  businessLeadId: string;
  actorUserId: string;
}) {
  const [conversation, lead] = await Promise.all([
    prisma.whatsAppConversation.findUnique({ where: { id: input.conversationId }, select: { id: true, channel: true, businessLeadId: true } }),
    prisma.businessLead.findUnique({ where: { id: input.businessLeadId }, select: { id: true } }),
  ]);
  if (!conversation || conversation.channel !== "WHATSAPP") throw new Error("WHATSAPP_CONVERSATION_NOT_FOUND");
  if (!lead) throw new Error("BUSINESS_LEAD_NOT_FOUND");
  const previousLeadId = conversation.businessLeadId;

  await prisma.$transaction(async (tx) => {
    await tx.whatsAppConversation.update({ where: { id: conversation.id }, data: { businessLeadId: lead.id } });
    await tx.adminContentAuditEvent.create({
      data: {
        entityType: "WHATSAPP_CONVERSATION",
        entityId: conversation.id,
        action: "BUSINESS_LEAD_LINKED",
        metadata: {
          actorUserId: input.actorUserId,
          businessLeadId: lead.id,
          previousBusinessLeadId: previousLeadId,
          matchMode: "EXPLICIT_ADMIN_LINK",
        },
        actorUserId: input.actorUserId,
      },
    });
  });

  return { conversationId: conversation.id, businessLeadId: lead.id, previousBusinessLeadId: previousLeadId };
}

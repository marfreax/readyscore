import { randomBytes } from "node:crypto";
import { prisma } from "./db/prisma";

export const V16_FUNNEL_EVENTS = [
  "landing_view", "free_test_start", "free_test_complete", "instant_result_view",
  "locked_insight_view", "free_report_cta", "lead_form_view", "lead_submitted",
  "free_report_unlocked", "pdf_generated", "whatsapp_sent", "email_sent",
  "premium_offer_view", "checkout_started", "checkout_completed", "premium_unlocked",
] as const;
export type V16FunnelEvent = typeof V16_FUNNEL_EVENTS[number];
const allowed = new Set<string>(V16_FUNNEL_EVENTS);

export async function recordFunnelEvent(event: string, input?: { attemptId?: string | null; metadata?: Record<string, string | number | boolean | null> }) {
  if (!allowed.has(event)) throw new Error("INVALID_FUNNEL_EVENT");
  const metadata = input?.metadata ? Object.fromEntries(Object.entries(input.metadata).filter(([key]) => !/(name|phone|whatsapp|email|token|password|address)/i.test(key))) : undefined;
  return prisma.funnelEvent.create({ data: { id: `fe_${randomBytes(10).toString("hex")}`, event, attemptId: input?.attemptId ?? undefined, metadata: metadata ?? undefined } });
}

export async function getFunnelSummary() {
  const rows = await prisma.funnelEvent.groupBy({ by: ["event"], _count: { _all: true } });
  const counts = Object.fromEntries(V16_FUNNEL_EVENTS.map((event) => [event, rows.find((row) => row.event === event)?._count._all ?? 0]));
  return counts as Record<V16FunnelEvent, number>;
}

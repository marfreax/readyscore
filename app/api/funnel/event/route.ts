import { NextResponse } from "next/server";
import { recordFunnelEvent, V16_FUNNEL_EVENTS } from "../../../../lib/funnel-analytics";
import { checkV16RateLimit } from "../../../../lib/v16-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rate = checkV16RateLimit(`funnel:${ip}`, 120);
  if (!rate.allowed) return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED" } }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds ?? 60) } });
  const body = await request.json().catch(() => ({}));
  const event = typeof body?.event === "string" ? body.event : "";
  if (!V16_FUNNEL_EVENTS.includes(event as never)) return NextResponse.json({ ok: false, error: { code: "INVALID_FUNNEL_EVENT" } }, { status: 400 });
  const attemptId = typeof body?.attemptId === "string" ? body.attemptId.trim() : undefined;
  if (attemptId && attemptId.length > 128) return NextResponse.json({ ok: false, error: { code: "INVALID_ATTEMPT" } }, { status: 400 });
  await recordFunnelEvent(event, { attemptId, metadata: { source: "web" } });
  return NextResponse.json({ ok: true });
}

import { checkV16RateLimit } from "../../../../lib/v16-rate-limit";
import { NextResponse } from "next/server";
import { deliverFreeReport } from "../../../../lib/free-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rate = checkV16RateLimit(`free:${ip}`, 30);
  if (!rate.allowed) return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED" } }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds ?? 60) } });
  try {
    const body = await request.json().catch(() => ({}));
    const attemptId = typeof body?.attemptId === "string" ? body.attemptId.trim() : "";
    if (!attemptId) return NextResponse.json({ ok: false, error: { code: "INVALID_ATTEMPT" } }, { status: 400 });
    return NextResponse.json({ ok: true, delivery: await deliverFreeReport(attemptId) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "FREE_REPORT_DELIVERY_FAILED";
    return NextResponse.json({ ok: false, error: { code, message: "Free Report tetap terbuka. Pengiriman dapat dicoba lagi." } }, { status: 502 });
  }
}

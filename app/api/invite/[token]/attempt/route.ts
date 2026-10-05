import { NextResponse } from "next/server";
import { getClientInvitationByToken } from "../../../../../lib/client-organization/service";
import { getAttemptView, RuntimeError } from "../../../../../lib/assessment/runtime-service";
import { checkV16RateLimit } from "../../../../../lib/v16-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkV16RateLimit(`client-invite-attempt:${ip}`, 120).allowed) return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED" } }, { status: 429 });
  try {
    const { token } = await params;
    const invitation = await getClientInvitationByToken(token);
    if (!invitation?.assessmentAttempt) return NextResponse.json({ ok: false, error: { code: "ATTEMPT_NOT_AVAILABLE" } }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    const view = await getAttemptView(invitation.assessmentAttempt.id);
    return NextResponse.json({ ok: true, ...view }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_ATTEMPT_READ_FAILED";
    const status = error instanceof RuntimeError ? 404 : 500;
    return NextResponse.json({ ok: false, error: { code } }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}

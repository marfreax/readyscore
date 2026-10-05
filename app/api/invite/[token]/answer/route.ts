import { NextResponse } from "next/server";
import { getClientInvitationByToken } from "../../../../../lib/client-organization/service";
import { RuntimeError, saveAnswer } from "../../../../../lib/assessment/runtime-service";
import { checkV16RateLimit } from "../../../../../lib/v16-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkV16RateLimit(`client-invite-answer:${ip}`, 180).allowed) return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED" } }, { status: 429 });
  try {
    const { token } = await params;
    const invitation = await getClientInvitationByToken(token);
    if (!invitation?.assessmentAttempt || invitation.status !== "IN_PROGRESS") {
      return NextResponse.json({ ok: false, error: { code: "ATTEMPT_NOT_AVAILABLE" } }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    }
    const body = await request.json().catch(() => ({})) as { questionId?: unknown; value?: unknown };
    if (typeof body.questionId !== "string") return NextResponse.json({ ok: false, error: { code: "INVALID_QUESTION" } }, { status: 400 });
    const result = await saveAnswer(invitation.assessmentAttempt.id, body.questionId, body.value);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_ANSWER_FAILED";
    const status = error instanceof RuntimeError ? 422 : 500;
    return NextResponse.json({ ok: false, error: { code, message: error instanceof Error ? error.message : "Jawaban gagal disimpan." } }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}

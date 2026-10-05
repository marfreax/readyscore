import { NextResponse } from "next/server";
import { deliverClientAssessmentResultEmail, getClientInvitationByToken } from "../../../../../lib/client-organization/service";
import { RuntimeError, submitAssessment } from "../../../../../lib/assessment/runtime-service";
import { prisma } from "../../../../../lib/db/prisma";
import { checkV16RateLimit } from "../../../../../lib/v16-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkV16RateLimit(`client-invite-submit:${ip}`, 12).allowed) return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED" } }, { status: 429 });

  try {
    const { token } = await params;
    const invitation = await getClientInvitationByToken(token);
    if (!invitation?.assessmentAttempt) return NextResponse.json({ ok: false, error: { code: "ATTEMPT_NOT_AVAILABLE" } }, { status: 404, headers: { "Cache-Control": "private, no-store" } });

    await submitAssessment(invitation.assessmentAttempt.id);
    await prisma.clientInvitation.updateMany({
      where: { id: invitation.id, status: { not: "REVOKED" } },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    const emailStatus = await deliverClientAssessmentResultEmail(invitation.id);

    return NextResponse.json({
      ok: true,
      status: "COMPLETED",
      resultAvailable: true,
      resultEmailStatus: emailStatus,
      message: emailStatus === "SENT"
        ? "Assessment selesai. Hasil dikirim ke email Anda."
        : emailStatus === "PENDING"
          ? "Assessment selesai. Email hasil sedang diproses."
          : "Assessment selesai, tetapi email hasil belum berhasil dikirim. Silakan hubungi client pengundang.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_ASSESSMENT_SUBMIT_FAILED";
    const status = error instanceof RuntimeError ? 422 : 500;
    return NextResponse.json({ ok: false, error: { code, message: error instanceof Error ? error.message : "Assessment gagal disubmit." } }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}

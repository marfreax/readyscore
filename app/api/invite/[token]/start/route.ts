import { NextResponse } from "next/server";
import { getClientInvitationByToken, captureClientParticipant, createClientDiscLeadIfConsented } from "../../../../../lib/client-organization/service";
import { startClientDiscAssessment, RuntimeError } from "../../../../../lib/assessment/runtime-service";
import { checkV16RateLimit } from "../../../../../lib/v16-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkV16RateLimit(`client-invite-start:${ip}`, 12).allowed) {
    return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan. Silakan coba kembali sebentar lagi." } }, { status: 429 });
  }

  try {
    const { token } = await params;
    const invitation = await getClientInvitationByToken(token);
    if (!invitation) return NextResponse.json({ ok: false, error: { code: "INVITATION_NOT_AVAILABLE", message: "Undangan tidak tersedia atau sudah kedaluwarsa." } }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    if (invitation.assessmentAttempt?.status === "COMPLETED") {
      return NextResponse.json({ ok: false, error: { code: "INVITATION_ALREADY_COMPLETED", message: "Assessment pada undangan ini sudah selesai." } }, { status: 409 });
    }

    const body = await request.json().catch(() => ({})) as {
      fullName?: unknown;
      email?: unknown;
      whatsapp?: unknown;
      noticeAccepted?: unknown;
      emailMarketing?: unknown;
      whatsappMarketing?: unknown;
    };
    if (typeof body.fullName !== "string" || typeof body.email !== "string" || typeof body.whatsapp !== "string") {
      throw new Error("INVALID_PARTICIPANT_DETAILS");
    }
    const captured = await captureClientParticipant({
      invitationId: invitation.id,
      fullName: body.fullName,
      email: body.email,
      whatsapp: body.whatsapp,
      noticeAccepted: body.noticeAccepted === true,
      emailMarketing: body.emailMarketing === true,
      whatsappMarketing: body.whatsappMarketing === true,
    });
    const attempt = await startClientDiscAssessment({
      organizationId: invitation.organizationId,
      participantId: captured.participant.id,
      invitationId: invitation.id,
      configurationVersionId: invitation.assessmentConfigurationVersionId,
      questionPackageVersionId: invitation.questionPackageVersionId,
    });
    let leadCaptureStatus: "NOT_OPTED_IN" | "CAPTURED" | "FAILED" = "NOT_OPTED_IN";
    if (captured.consent.emailMarketing || captured.consent.whatsappMarketing) {
      try {
        await createClientDiscLeadIfConsented({
          fullName: captured.participant.fullName,
          email: captured.participant.email,
          whatsapp: captured.participant.whatsapp,
          assessmentAttemptId: attempt.attempt.id,
          emailMarketing: captured.consent.emailMarketing,
          whatsappMarketing: captured.consent.whatsappMarketing,
          consentAt: captured.consent.createdAt,
        });
        leadCaptureStatus = "CAPTURED";
      } catch {
        leadCaptureStatus = "FAILED";
      }
    }

    const questions = attempt.questions.map((question) => ({
      id: question.id,
      code: question.code,
      text: question.text,
      domain: question.domain,
      subdomain: question.subdomain ?? null,
      indicator: question.indicator ?? null,
      answerType: question.answerType,
      scale: [...question.scale],
      options: question.options ?? undefined,
      difficulty: question.difficulty,
      sequence: question.sequence,
      answered: question.answered,
      answer: question.answer,
    }));
    return NextResponse.json({
      ok: true,
      attemptId: attempt.attempt.id,
      status: attempt.attempt.status,
      timer: attempt.timer ?? null,
      snapshot: attempt.snapshot,
      progress: attempt.progress,
      questions,
      leadCaptureStatus,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_DISC_START_FAILED";
    if (error instanceof RuntimeError) {
      return NextResponse.json({ ok: false, error: { code: error.code, message: error.message } }, { status: 422 });
    }
    const status = code === "INVITATION_EXPIRED" ? 410
      : code === "INVITATION_NOT_AVAILABLE" ? 404
        : code === "INVITATION_ALREADY_COMPLETED" || code === "INVITATION_EMAIL_MISMATCH" ? 409
          : 400;
    const messages: Record<string, string> = {
      INVALID_PARTICIPANT_DETAILS: "Nama, email, dan nomor WhatsApp wajib diisi.",
      INVALID_NAME: "Nama lengkap tidak valid.",
      INVALID_EMAIL: "Format email tidak valid.",
      INVALID_WHATSAPP: "Nomor WhatsApp tidak valid.",
      INVITATION_EMAIL_MISMATCH: "Gunakan email yang menerima undangan ini.",
      NOTICE_REQUIRED: "Persetujuan pemberitahuan sebelum tes wajib diberikan.",
      INVITATION_ALREADY_COMPLETED: "Assessment pada undangan ini sudah selesai.",
      INVITATION_EXPIRED: "Undangan sudah kedaluwarsa.",
    };
    return NextResponse.json({ ok: false, error: { code, message: messages[code] ?? "Assessment belum dapat dimulai." } }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}

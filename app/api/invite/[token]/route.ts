import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db/prisma";
import { checkV16RateLimit } from "../../../../lib/v16-rate-limit";
import { getClientInvitationByToken } from "../../../../lib/client-organization/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function limited(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return !checkV16RateLimit(`client-invite-view:${ip}`, 60).allowed;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (limited(request)) return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED" } }, { status: 429 });
  const { token } = await params;
  const invitation = await getClientInvitationByToken(token);
  if (!invitation) return NextResponse.json({ ok: false, error: { code: "INVITATION_NOT_AVAILABLE" } }, { status: 404, headers: { "Cache-Control": "private, no-store" } });

  if (invitation.status === "SENT") {
    await prisma.clientInvitation.updateMany({
      where: { id: invitation.id, status: "SENT" },
      data: { status: "OPENED", openedAt: new Date() },
    });
  }
  const email = invitation.email;
  const [local, domain] = email.split("@");
  const maskedEmail = `${local.slice(0, 1)}${"•".repeat(Math.min(Math.max(local.length - 1, 2), 8))}@${domain}`;
  return NextResponse.json({
    ok: true,
    invitation: {
      status: invitation.status,
      resultEmailStatus: invitation.resultEmailStatus,
      category: invitation.category,
      maskedEmail,
      organization: invitation.organization,
      assessment: {
        type: "DISC",
        configurationVersion: invitation.assessmentConfigurationVersion.version,
        packageVersion: invitation.questionPackageVersion.version,
        questionCount: invitation.questionPackageVersion.totalQuestions,
        timeLimitSeconds: invitation.questionPackageVersion.timeLimitSeconds,
      },
      attempt: invitation.assessmentAttempt ? {
        id: invitation.assessmentAttempt.id,
        status: invitation.assessmentAttempt.status,
        completedAt: invitation.assessmentAttempt.completedAt?.toISOString() ?? null,
      } : null,
      participant: invitation.participant ? {
        fullName: invitation.participant.fullName,
        email: invitation.participant.email,
        whatsapp: invitation.participant.whatsapp,
      } : null,
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../../lib/auth/session";
import { requireClientOrganizationAdmin, resendClientInvitation, revokeClientInvitation, retryClientResultEmail } from "../../../../../../lib/client-organization/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusFor(code: string) {
  if (code === "UNAUTHENTICATED") return 401;
  if (code === "CLIENT_ORGANIZATION_ACCESS_DENIED" || code === "CLIENT_ORGANIZATION_ADMIN_REQUIRED") return 403;
  if (code === "CLIENT_INVITATION_NOT_FOUND") return 404;
  if (code === "CLIENT_INVITATION_CANNOT_RESEND" || code === "CLIENT_INVITATION_CANNOT_REVOKE" || code === "CLIENT_RESULT_EMAIL_NOT_RETRYABLE" || code === "CLIENT_INVITATION_STATE_CHANGED") return 409;
  return 400;
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string; invitationId: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const { organizationId, invitationId } = await params;
    await requireClientOrganizationAdmin(session.user.id, organizationId);
    const body = await request.json().catch(() => ({})) as { action?: unknown };
    if (body.action === "REVOKE") {
      const invitation = await revokeClientInvitation({ organizationId, invitationId, userId: session.user.id });
      return NextResponse.json({ ok: true, invitation });
    }
    if (body.action === "RESEND") {
      const url = new URL(request.url);
      const invitation = await resendClientInvitation({ organizationId, invitationId, userId: session.user.id, baseUrl: process.env.APP_BASE_URL?.trim() || url.origin });
      return NextResponse.json({ ok: true, invitation });
    }
    if (body.action === "RETRY_RESULT_EMAIL") {
      const resultEmailStatus = await retryClientResultEmail({ organizationId, invitationId, userId: session.user.id });
      return NextResponse.json({ ok: true, resultEmailStatus });
    }
    throw new Error("INVALID_INVITATION_ACTION");
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_INVITATION_ACTION_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: statusFor(code) });
  }
}

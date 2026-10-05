import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { listClientParticipants, updateClientParticipantCategory } from "../../../../../lib/client-organization/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusFor(code: string) {
  if (code === "UNAUTHENTICATED") return 401;
  if (code === "CLIENT_ORGANIZATION_ACCESS_DENIED" || code === "CLIENT_ORGANIZATION_ADMIN_REQUIRED") return 403;
  if (code === "CLIENT_PARTICIPANT_NOT_FOUND") return 404;
  return 400;
}

export async function GET(_request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const { organizationId } = await params;
    const participants = await listClientParticipants(organizationId, session.user.id);
    return NextResponse.json({ ok: true, participants });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_PARTICIPANTS_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: statusFor(code) });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const { organizationId } = await params;
    const body = await request.json().catch(() => ({})) as { participantId?: unknown; category?: unknown };
    if (typeof body.participantId !== "string" || !["CANDIDATE", "EMPLOYEE", "ALUMNI"].includes(String(body.category))) throw new Error("INVALID_PARTICIPANT_UPDATE");
    const participant = await updateClientParticipantCategory({ organizationId, participantId: body.participantId, userId: session.user.id, category: body.category as "CANDIDATE" | "EMPLOYEE" | "ALUMNI" });
    return NextResponse.json({ ok: true, participant });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_PARTICIPANT_UPDATE_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: statusFor(code) });
  }
}

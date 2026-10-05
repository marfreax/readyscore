import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { createClientInvitation, listClientInvitations, requireClientOrganizationAdmin } from "../../../../../lib/client-organization/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusFor(code: string) {
  if (code === "UNAUTHENTICATED") return 401;
  if (code === "CLIENT_ORGANIZATION_ACCESS_DENIED" || code === "CLIENT_ORGANIZATION_ADMIN_REQUIRED") return 403;
  if (code === "CLIENT_DISC_PACKAGE_NOT_READY") return 409;
  return 400;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const { organizationId } = await params;
    const invitations = await listClientInvitations(organizationId, session.user.id);
    return NextResponse.json({ ok: true, invitations });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_INVITATIONS_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: statusFor(code) });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const { organizationId } = await params;
    await requireClientOrganizationAdmin(session.user.id, organizationId);
    const body = await request.json().catch(() => ({})) as {
      email?: unknown;
      category?: unknown;
      jobTitle?: unknown;
      department?: unknown;
      expiresInDays?: unknown;
    };
    if (typeof body.email !== "string" || (body.category !== "CANDIDATE" && body.category !== "EMPLOYEE")) {
      throw new Error("INVALID_INVITATION");
    }
    if (body.jobTitle !== undefined && (typeof body.jobTitle !== "string" || body.jobTitle.length > 120)) throw new Error("INVALID_JOB_TITLE");
    if (body.department !== undefined && (typeof body.department !== "string" || body.department.length > 120)) throw new Error("INVALID_DEPARTMENT");
    if (body.expiresInDays !== undefined && typeof body.expiresInDays !== "number") throw new Error("INVALID_EXPIRY");

    const url = new URL(request.url);
    const result = await createClientInvitation({
      organizationId,
      actorUserId: session.user.id,
      email: body.email,
      category: body.category,
      jobTitle: body.jobTitle as string | undefined,
      department: body.department as string | undefined,
      expiresInDays: body.expiresInDays as number | undefined,
      baseUrl: process.env.APP_BASE_URL?.trim() || url.origin,
    });
    return NextResponse.json({ ok: true, invitation: result }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_INVITATION_CREATE_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: statusFor(code) });
  }
}

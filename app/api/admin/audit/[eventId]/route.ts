import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/auth/admin";
import { getAdminAuditEventById } from "../../../../../lib/admin-audit-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { eventId } = await context.params;
    const event = await getAdminAuditEventById(eventId);

    if (!event) {
      return NextResponse.json({ ok: false, error: { code: "AUDIT_EVENT_NOT_FOUND" } }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      event: {
        ...event,
        createdAt: event.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADMIN_AUDIT_DETAIL_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { getCorporateCreditSummary } from "../../../../../lib/client-organization/commerce";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const { organizationId } = await context.params;
    return NextResponse.json({ ok: true, summary: await getCorporateCreditSummary(organizationId, session.user.id) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CORPORATE_CREDIT_SUMMARY_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "CLIENT_ORGANIZATION_ACCESS_DENIED" ? 403 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

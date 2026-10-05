import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { updateClientOrganizationProfile } from "../../../../../lib/client-organization/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const { organizationId } = await params;
    const body = await request.json().catch(() => ({})) as { name?: unknown; websiteUrl?: unknown; logoUrl?: unknown };
    if (typeof body.name !== "string" || (body.websiteUrl != null && typeof body.websiteUrl !== "string") || (body.logoUrl != null && typeof body.logoUrl !== "string")) throw new Error("INVALID_CLIENT_ORGANIZATION");
    const organization = await updateClientOrganizationProfile({
      organizationId,
      userId: session.user.id,
      name: body.name,
      websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl : null,
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : null,
    });
    return NextResponse.json({ ok: true, organization });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_ORGANIZATION_PROFILE_UPDATE_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "CLIENT_ORGANIZATION_ACCESS_DENIED" ? 403 : code === "CLIENT_ORGANIZATION_ADMIN_REQUIRED" ? 403 : code.startsWith("INVALID_") ? 400 : 500;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

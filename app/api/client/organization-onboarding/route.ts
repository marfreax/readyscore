import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import { createClientOrganizationForUser } from "../../../../lib/client-organization/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({})) as { name?: unknown; websiteUrl?: unknown; logoUrl?: unknown };
    if (typeof body.name !== "string" || (body.websiteUrl != null && typeof body.websiteUrl !== "string") || (body.logoUrl != null && typeof body.logoUrl !== "string")) {
      throw new Error("INVALID_CLIENT_ORGANIZATION");
    }
    const organization = await createClientOrganizationForUser({ userId: session.user.id, name: body.name, websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl : null, logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : null });
    return NextResponse.json({ ok: true, organization }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_ORGANIZATION_SETUP_FAILED";
    const status = code === "CLIENT_ORGANIZATION_ALREADY_LINKED" ? 409 : code === "INVALID_LOGO_URL" || code === "INVALID_WEBSITE_URL" || code === "INVALID_CLIENT_ORGANIZATION" ? 400 : 500;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { prisma } from "../../../../lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizedEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID_EMAIL");
  return email;
}

export async function GET() {
  try {
    await requireAdminApi();
    const organizations = await prisma.clientOrganization.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, name: true, websiteUrl: true, logoUrl: true, status: true, createdAt: true, memberships: { select: { role: true, status: true, user: { select: { id: true, name: true, email: true } } } } },
    });
    return NextResponse.json({ ok: true, organizations });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_ORGANIZATIONS_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400 });
  }
}

/** ReadyScore admin provisioning: create the tenant boundary and its first admin atomically. */
export async function POST(request: Request) {
  try {
    const actor = await requireAdminApi();
    const body = await request.json().catch(() => ({})) as { code?: unknown; name?: unknown; websiteUrl?: unknown; logoUrl?: unknown; adminEmail?: unknown };
    if (typeof body.code !== "string" || typeof body.name !== "string" || typeof body.adminEmail !== "string") throw new Error("INVALID_CLIENT_ORGANIZATION");
    const code = body.code.trim().toUpperCase();
    const name = body.name.trim();
    const websiteUrl = typeof body.websiteUrl === "string" && body.websiteUrl.trim() ? body.websiteUrl.trim() : null;
    const logoUrl = typeof body.logoUrl === "string" && body.logoUrl.trim() ? body.logoUrl.trim() : null;
    const adminEmail = normalizedEmail(body.adminEmail);
    if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code) || name.length < 2 || name.length > 160) throw new Error("INVALID_CLIENT_ORGANIZATION");
    if (websiteUrl && !validHttpsUrl(websiteUrl)) throw new Error("INVALID_WEBSITE_URL");
    if (logoUrl && !validHttpsUrl(logoUrl)) throw new Error("INVALID_LOGO_URL");
    const target = await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
    if (!target) throw new Error("CLIENT_ADMIN_USER_NOT_FOUND");
    const created = await prisma.$transaction(async (tx) => {
      const organization = await tx.clientOrganization.create({ data: { code, name, websiteUrl, logoUrl } });
      await tx.clientOrganizationMembership.create({ data: { organizationId: organization.id, userId: target.id, role: "ADMIN", status: "ACTIVE" } });
      await tx.adminContentAuditEvent.create({ data: { entityType: "CLIENT_ORGANIZATION", entityId: organization.id, action: "CLIENT_ORGANIZATION_CREATED", toStatus: "ACTIVE", actorUserId: actor.id, metadata: { code, name, adminUserId: target.id, adminEmail } } });
      return organization;
    });
    return NextResponse.json({ ok: true, organization: created }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIENT_ORGANIZATION_CREATE_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : code === "CLIENT_ADMIN_USER_NOT_FOUND" ? 404 : code === "P2002" ? 409 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

function validHttpsUrl(value: string) {
  try { const url = new URL(value); return value.length <= 2048 && url.protocol === "https:" && Boolean(url.hostname); } catch { return false; }
}

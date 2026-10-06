import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { createCorporateDiscCheckoutOrder } from "../../../../../lib/client-organization/commerce";

export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const { organizationId } = await context.params;
    const body = await request.json().catch(() => ({})) as { packageId?: unknown; referralCode?: unknown };
    const order = await createCorporateDiscCheckoutOrder({ organizationId, userId: session.user.id, packageId: body.packageId, referralCode: body.referralCode });
    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CORPORATE_CHECKOUT_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "CLIENT_ORGANIZATION_ACCESS_DENIED" ? 403 : code === "CLIENT_ORGANIZATION_ADMIN_REQUIRED" ? 403 : 400;
    return NextResponse.json({ ok: false, error: { code, message: code === "CORPORATE_CREDIT_INSUFFICIENT" ? "Kredit tidak mencukupi untuk mengirim undangan. Beli paket kredit terlebih dahulu." : "Checkout paket Corporate belum dapat dibuat." } }, { status });
  }
}

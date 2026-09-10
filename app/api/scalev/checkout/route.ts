import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getScalevCheckoutUrl, isScalevCheckoutSku, type ScalevCheckoutSku } from "../../../../lib/scalev/checkout";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=/access", request.url));
  }

  const sku = new URL(request.url).searchParams.get("sku")?.trim() ?? "";
  if (!isScalevCheckoutSku(sku)) {
    return NextResponse.json({ ok: false, error: { code: "SCALEV_CHECKOUT_SKU_INVALID" } }, { status: 400 });
  }

  const checkoutUrl = getScalevCheckoutUrl(sku as ScalevCheckoutSku);
  if (!checkoutUrl) {
    const fallback = new URL("/access", request.url);
    fallback.searchParams.set("checkout", "not-configured");
    fallback.searchParams.set("sku", sku);
    return NextResponse.redirect(fallback, 303);
  }

  return NextResponse.redirect(checkoutUrl, 303);
}

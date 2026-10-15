import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findPromoOrder } from "../../../../lib/commercial/promo-checkout";
import { PROMO_COOKIE, assertPromoOrigin, isPromoToken, type PromoCustomer } from "../../../../lib/commercial/promo-security";
import { checkPasswordResetRateLimit } from "../../../../lib/auth/rate-limit";
import { requestPasswordReset } from "../../../../lib/auth/password-recovery";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    assertPromoOrigin(request);
    const token = (await cookies()).get(PROMO_COOKIE)?.value;
    const order = isPromoToken(token) ? await findPromoOrder(token) : null;
    if (!order || order.paymentStatus !== "PAID" || order.fulfillmentStatus !== "FULFILLED") return NextResponse.json({ ok: false, error: { message: "Pembayaran dan akses pesanan belum terverifikasi." } }, { status: 403, headers });
    const customer = (order.commercialConfig as Record<string, unknown>).customer as PromoCustomer;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const hash = (value: string) => createHash("sha256").update(value).digest("hex");
    const limit = checkPasswordResetRateLimit([`promo-access-ip:${hash(ip)}`, `email:${hash(customer.email)}`]);
    if (!limit.allowed) return NextResponse.json({ ok: false, error: { message: "Tunggu beberapa saat sebelum meminta link lagi." } }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
    await requestPasswordReset(customer.email);
    return NextResponse.json({ ok: true, message: "Permintaan link pengaturan password telah diproses. Periksa inbox dan folder spam email yang digunakan saat membeli." }, { headers });
  } catch {
    return NextResponse.json({ ok: false, error: { message: "Link akses belum dapat dikirim. Coba lagi nanti atau hubungi tim ReadyScore dengan nomor pesanan Anda." } }, { status: 503, headers });
  }
}

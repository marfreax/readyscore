import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createPromoCheckout, findPromoOrder, getPromoProduct, promoGatewayConfiguration, promoOrderSummary } from "../../../../lib/commercial/promo-checkout";
import { PROMO_COOKIE, PROMO_PRICE_IDR, PROMO_TTL_SECONDS, assertPromoOrigin, isPromoToken, newPromoToken, parsePromoCustomer } from "../../../../lib/commercial/promo-security";
import { checkV16RateLimit } from "../../../../lib/v16-rate-limit";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
const messages: Record<string, string> = {
  INVALID_CUSTOMER: "Lengkapi nama, nomor WhatsApp, dan email.", INVALID_NAME: "Nama harus terdiri dari 2–120 karakter.",
  INVALID_EMAIL: "Periksa kembali alamat email Anda.", INVALID_PHONE: "Gunakan nomor WhatsApp Indonesia yang aktif, misalnya 081234567890.",
  PROMO_PAYMENT_UNAVAILABLE: "Pembayaran online belum tersedia. Silakan hubungi tim ReadyScore.",
  PROMO_PRODUCT_UNAVAILABLE: "Paket promo sedang tidak tersedia. Silakan hubungi tim ReadyScore.",
  CHECKOUT_EXPIRED: "Sesi checkout sudah berakhir. Buka pesanan dari akun Anda atau mulai ulang.",
  CHECKOUT_SESSION_REQUIRED: "Muat ulang halaman sebelum melanjutkan.", ORDER_ALREADY_CREATED: "Data pesanan sudah tersimpan. Lanjutkan pembayaran pesanan tersebut.",
  TERMS_REQUIRED: "Setujui syarat dan ketentuan sebelum melanjutkan pembayaran.",
};
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "CHECKOUT_FAILED";
  const status = code === "INVALID_ORIGIN" ? 403 : code.startsWith("INVALID_") || code === "TERMS_REQUIRED" ? 400 : code === "CHECKOUT_SESSION_REQUIRED" ? 409
    : code === "CHECKOUT_EXPIRED" ? 410 : code === "ORDER_ALREADY_CREATED" ? 409 : code.startsWith("PROMO_") ? 503 : 502;
  return NextResponse.json({ ok: false, error: { code: messages[code] ? code : "CHECKOUT_FAILED", message: messages[code] ?? "Checkout belum dapat diproses. Coba lagi; data pesanan yang sudah dibuat tetap tersimpan." } }, { status, headers: noStore });
}
export async function GET() {
  try {
    const jar = await cookies();
    const raw = jar.get(PROMO_COOKIE)?.value;
    const token = isPromoToken(raw) ? raw : newPromoToken();
    if (token !== raw) jar.set(PROMO_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/promo", maxAge: PROMO_TTL_SECONDS });
    const [product, order] = await Promise.all([getPromoProduct(), findPromoOrder(token)]);
    const gateway = promoGatewayConfiguration();
    return NextResponse.json({ ok: true, product: { name: "Paket Lengkap + Profiling", priceIdr: PROMO_PRICE_IDR, available: Boolean(product) }, gateway, order: order ? promoOrderSummary(order) : null }, { headers: noStore });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    assertPromoOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const limit = checkV16RateLimit(`promo:${createHash("sha256").update(ip).digest("hex")}`, 8);
    if (!limit.allowed) return NextResponse.json({ ok: false, error: { message: "Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi." } }, { status: 429, headers: { ...noStore, "Retry-After": String(limit.retryAfterSeconds ?? 60) } });
    const raw = await request.text();
    if (raw.length > 4096) throw new Error("INVALID_CUSTOMER");
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new Error("INVALID_CUSTOMER"); }
    if (!body || typeof body !== "object" || (body as Record<string, unknown>).acceptedTerms !== true) throw new Error("TERMS_REQUIRED");
    const customer = parsePromoCustomer(body);
    const token = (await cookies()).get(PROMO_COOKIE)?.value;
    if (!isPromoToken(token)) throw new Error("CHECKOUT_SESSION_REQUIRED");
    return NextResponse.json({ ok: true, order: await createPromoCheckout(token, customer) }, { headers: noStore });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    assertPromoOrigin(request);
    const jar = await cookies();
    const token = jar.get(PROMO_COOKIE)?.value;
    if (isPromoToken(token)) {
      let order;
      try { order = await findPromoOrder(token); } catch (error) {
        if (!(error instanceof Error && error.message === "CHECKOUT_EXPIRED")) throw error;
      }
      if (order && !["FAILED", "EXPIRED", "CANCELLED", "REFUNDED"].includes(order.paymentStatus)) throw new Error("ORDER_ALREADY_CREATED");
    }
    jar.set(PROMO_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/promo", maxAge: 0 });
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) { return failure(error); }
}

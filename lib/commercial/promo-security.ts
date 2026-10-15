import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const PROMO_COOKIE = "readyscore_promo_checkout";
export const PROMO_TTL_SECONDS = 7 * 24 * 60 * 60;
export const PROMO_PRODUCT_ID = "product-advance";
export const PROMO_PRICE_IDR = 249_000;
export type PromoCustomer = { name: string; email: string; phone: string };

export function parsePromoCustomer(value: unknown): PromoCustomer {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_CUSTOMER");
  const data = value as Record<string, unknown>;
  if (typeof data.name !== "string" || typeof data.email !== "string" || typeof data.phone !== "string") throw new Error("INVALID_CUSTOMER");
  const name = data.name.trim().replace(/\s+/g, " ");
  const email = data.email.trim().toLowerCase();
  let phone = data.phone.trim();
  if (!/^[+\d\s().-]+$/.test(phone) || phone.length > 30) throw new Error("INVALID_PHONE");
  phone = phone.replace(/[\s().-]/g, "").replace(/^\+/, "");
  if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
  else if (phone.startsWith("8")) phone = `62${phone}`;
  if (name.length < 2 || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error("INVALID_NAME");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID_EMAIL");
  if (!/^628\d{8,11}$/.test(phone)) throw new Error("INVALID_PHONE");
  return { name, email, phone };
}

export function newPromoToken() { return randomBytes(32).toString("hex"); }
export function isPromoToken(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value); }
export function promoTokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function promoOrderId(token: string) { return `ord_promo_${promoTokenHash(token).slice(0, 40)}`; }
export function verifyPromoCapability(token: string, config: unknown, now = Date.now()): boolean {
  if (!isPromoToken(token) || !config || typeof config !== "object" || Array.isArray(config)) return false;
  const c = config as Record<string, unknown>;
  if (c.source !== "PROMO_GUEST_CHECKOUT" || typeof c.guestTokenHash !== "string" || !/^[a-f0-9]{64}$/.test(c.guestTokenHash)) return false;
  if (typeof c.guestExpiresAt !== "string" || !(new Date(c.guestExpiresAt).getTime() > now)) return false;
  return timingSafeEqual(Buffer.from(c.guestTokenHash, "hex"), Buffer.from(promoTokenHash(token), "hex"));
}

export function assertPromoOrigin(request: Request) {
  const url = new URL(request.url);
  // Next's internal URL may use localhost behind a reverse proxy. Host is the
  // browser's destination; the proxy supplies the original HTTP(S) protocol.
  const host = request.headers.get("host") ?? url.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol ? `${forwardedProtocol}:` : url.protocol;
  if (!["http:", "https:"].includes(protocol) || request.headers.get("origin") !== `${protocol}//${host}`) throw new Error("INVALID_ORIGIN");
}

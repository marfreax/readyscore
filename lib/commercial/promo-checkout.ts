import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { findUserByEmail, hashPassword } from "../auth/store";
import { createProviderPaymentForOwner } from "./v14-2";
import { COMMERCIAL_ENTITLEMENT_MATRIX } from "./types";
import { getPublicAppBaseUrl } from "../public-app-url";
import { PROMO_PRICE_IDR, PROMO_PRODUCT_ID, PROMO_TTL_SECONDS, promoOrderId, promoTokenHash, verifyPromoCapability, type PromoCustomer } from "./promo-security";
import { parsePromoAttribution, type PromoAttribution } from "./promo-attribution";

export function promoGatewayConfiguration() {
  const production = process.env.MIDTRANS_ENVIRONMENT?.trim().toLowerCase() === "production";
  const clientKey = process.env.MIDTRANS_CLIENT_KEY?.trim() || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() || "";
  const emailReady = process.env.PASSWORD_RESET_EMAIL_PROVIDER?.trim().toUpperCase() === "RESEND"
    && Boolean(process.env.RESEND_API_KEY?.trim() && process.env.PASSWORD_RESET_EMAIL_FROM?.trim());
  let publicUrlReady = true;
  try { getPublicAppBaseUrl(); getPublicAppBaseUrl(undefined, "READYSCORE_PUBLIC_URL"); } catch { publicUrlReady = false; }
  return {
    ready: Boolean(clientKey && process.env.MIDTRANS_SERVER_KEY?.trim() && emailReady && publicUrlReady),
    clientKey,
    scriptUrl: production ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js",
  };
}

export async function findPromoOrder(token: string) {
  const order = await prisma.commercialOrder.findUnique({ where: { id: promoOrderId(token) }, include: { paymentAttempts: true } });
  if (!order) return null;
  if (!verifyPromoCapability(token, order.commercialConfig)) throw new Error("CHECKOUT_EXPIRED");
  return order;
}

export function promoOrderSummary(order: NonNullable<Awaited<ReturnType<typeof findPromoOrder>>>) {
  const config = order.commercialConfig as Record<string, unknown>;
  const customer = config.customer as PromoCustomer;
  const attempt = order.paymentAttempts.find(item => item.provider === "MIDTRANS");
  return {
    orderNumber: order.orderNumber,
    priceIdr: order.totalAmountIdr,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    customer: { name: customer.name, email: customer.email, phone: customer.phone },
    paymentToken: order.paymentStatus === "PENDING" ? attempt?.paymentToken ?? null : null,
    redirectUrl: order.paymentStatus === "PENDING" ? attempt?.redirectUrl ?? null : null,
  };
}

export async function getPromoProduct() {
  const product = await prisma.product.findFirst({ where: { id: PROMO_PRODUCT_ID, tier: "ADVANCE", status: "ACTIVE" }, include: { entitlements: true } });
  if (!product || product.priceIdr !== PROMO_PRICE_IDR) return null;
  if (!COMMERCIAL_ENTITLEMENT_MATRIX.ADVANCE.every(required => product.entitlements.some(item => item.type === required.type && item.resourceType === required.resourceType && item.resourceKey === required.resourceKey))) return null;
  return product;
}

export async function createPromoCheckout(token: string, customer: PromoCustomer, attribution: PromoAttribution = {}) {
  if (!promoGatewayConfiguration().ready) throw new Error("PROMO_PAYMENT_UNAVAILABLE");
  const existing = await findPromoOrder(token);
  if (existing) {
    const saved = (existing.commercialConfig as Record<string, unknown>).customer as PromoCustomer;
    if (saved.email !== customer.email || saved.name !== customer.name || saved.phone !== customer.phone) throw new Error("ORDER_ALREADY_CREATED");
    if (existing.paymentStatus === "PENDING") await createProviderPaymentForOwner(existing.id, existing.userId);
    return promoOrderSummary((await findPromoOrder(token))!);
  }
  const product = await getPromoProduct();
  if (!product) throw new Error("PROMO_PRODUCT_UNAVAILABLE");
  const legacy = findUserByEmail(customer.email);
  // An unguessable password reserves a new identity, but creates no login
  // session. Email ownership is verified through the existing reset-link flow.
  const passwordHash = legacy?.passwordHash ?? hashPassword(randomBytes(32).toString("hex"));
  try {
    await prisma.$transaction(async tx => {
      const user = await tx.user.upsert({
        where: { email: customer.email },
        create: { id: legacy?.id ?? `usr_${randomBytes(12).toString("hex")}`, name: legacy?.name ?? customer.name, email: customer.email, passwordHash, role: legacy?.role ?? "USER", status: legacy?.status ?? "ACTIVE" },
        update: {},
      });
      // Existing account data and credentials must never be overwritten by a
      // buyer who has only entered that account's email address.
      if (user.status !== "ACTIVE") throw new Error("PROMO_PAYMENT_UNAVAILABLE");
      const owner = await tx.subjectProfile.findFirst({ where: { accountId: user.id, type: "OWNER" }, orderBy: { createdAt: "asc" } });
      const subject = owner ?? await tx.subjectProfile.create({ data: { id: `sub_owner_${randomBytes(10).toString("hex")}`, accountId: user.id, name: user.name, type: "OWNER" } });
      const order = await tx.commercialOrder.create({ data: {
        id: promoOrderId(token), userId: user.id, subjectId: subject.id, productId: product.id,
        orderNumber: `RS-P-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`,
        productNameSnapshot: product.name, quantity: 1, unitPriceIdrSnapshot: product.priceIdr!, totalAmountIdr: product.priceIdr!, currency: "IDR",
        commercialConfig: { source: "PROMO_GUEST_CHECKOUT", productTier: product.tier, customer, attribution: parsePromoAttribution(attribution), terms: { path: "/terms", acceptedAt: new Date().toISOString() }, guestTokenHash: promoTokenHash(token), guestExpiresAt: new Date(Date.now() + PROMO_TTL_SECONDS * 1000).toISOString(), entitlementKeys: product.entitlements.map(e => `${e.type}:${e.resourceType}:${e.resourceKey}`) },
        status: "CREATED", paymentStatus: "PENDING", fulfillmentStatus: "NOT_STARTED",
      } });
      await tx.commercialAuditEvent.create({ data: { orderId: order.id, action: "ORDER_CREATED", toState: "CREATED", source: "PROMO_GUEST_CHECKOUT", reference: order.orderNumber, metadata: { productId: product.id, totalAmountIdr: order.totalAmountIdr } } });
      await tx.commercialAuditEvent.create({ data: { orderId: order.id, action: "PAYMENT_PENDING", fromState: "CREATED", toState: "PENDING", source: "PROMO_GUEST_CHECKOUT", reference: order.orderNumber } });
    });
  } catch (error) {
    // A concurrent retry is allowed only if this capability already owns the
    // resulting order. Unrelated uniqueness failures are not swallowed.
    if (!(error && typeof error === "object" && "code" in error && error.code === "P2002") || !await findPromoOrder(token)) throw error;
  }
  const order = await findPromoOrder(token);
  if (!order) throw new Error("CHECKOUT_FAILED");
  const saved = (order.commercialConfig as Record<string, unknown>).customer as PromoCustomer;
  if (saved.email !== customer.email || saved.name !== customer.name || saved.phone !== customer.phone) throw new Error("ORDER_ALREADY_CREATED");
  await createProviderPaymentForOwner(order.id, order.userId);
  return promoOrderSummary((await findPromoOrder(token))!);
}

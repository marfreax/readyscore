import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import {
  createUser,
  findUserByEmail,
} from "../auth/store";
import { syncUserToDatabase } from "../auth/database-sync";
import { grantReassessmentCredit } from "../assessment/reassessment";
import {
  grantProductEntitlements,
  grantSingleTestEntitlements,
} from "../commercial/entitlement-service";
import {
  createHandoffToken,
  hashHandoffToken,
  normalizeEmail,
  normalizePhone,
} from "./security";
import {
  getScalevApiBaseUrl,
  getScalevHandoffTtlMinutes,
  getScalevPublicBaseUrl,
  resolveScalevSku,
  type ScalevProductMapping,
} from "./config";
import type { ScalevOrderLike } from "./types";

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function extractOrderId(data: Record<string, unknown>): string | null {
  const value = data.order_id ?? data.id;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractCustomer(order: ScalevOrderLike) {
  const customer =
    order.customer && typeof order.customer === "object"
      ? order.customer
      : undefined;
  const destination =
    order.destination_address && typeof order.destination_address === "object"
      ? order.destination_address
      : undefined;

  const name = String(customer?.name ?? destination?.name ?? "").trim();
  const email = normalizeEmail(
    String(customer?.email ?? destination?.email ?? ""),
  );
  const phone = normalizePhone(
    String(customer?.phone ?? destination?.phone ?? ""),
  );
  const customerId = customer?.id ?? order.customer_id;

  if (!name) throw new Error("SCALEV_CUSTOMER_NAME_MISSING");
  if (!email || !email.includes("@")) throw new Error("SCALEV_CUSTOMER_EMAIL_INVALID");

  return {
    name,
    email,
    phone: phone || null,
    customerId: customerId == null ? null : String(customerId),
  };
}

function extractSkus(order: ScalevOrderLike): string[] {
  const lines = Array.isArray(order.orderlines) ? order.orderlines : [];
  return [...new Set(
    lines
      .map((line) => String(line?.variant_sku ?? "").trim())
      .filter(Boolean),
  )];
}

function resolveMappedSku(skus: string[]): {
  sku: string;
  mapping: ScalevProductMapping;
} {
  if (skus.length !== 1) {
    throw new Error(
      `SCALEV_ORDER_SKU_AMBIGUOUS:${skus.length === 0 ? "NONE" : skus.join(",")}`,
    );
  }

  const mapping = resolveScalevSku(skus[0]);
  if (!mapping) throw new Error(`SCALEV_PRODUCT_SKU_UNMAPPED:${skus[0]}`);

  return { sku: skus[0], mapping };
}

async function ensureUser(input: {
  name: string;
  email: string;
}): Promise<string> {
  const existingDb = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existingDb) return existingDb.id;

  const existingAuth = findUserByEmail(input.email);
  if (existingAuth) {
    const dbUser = await syncUserToDatabase(existingAuth.id);
    return dbUser.id;
  }

  const userRecord = createUser({
    name: input.name,
    email: input.email,
    password: randomBytes(32).toString("base64url"),
  });

  const dbUser = await syncUserToDatabase(userRecord.id);
  return dbUser.id;
}

async function fetchScalevOrder(orderId: string): Promise<ScalevOrderLike | null> {
  const apiKey = process.env.SCALEV_API_KEY?.trim();
  if (!apiKey) return null;

  const response = await fetch(
    `${getScalevApiBaseUrl()}/v3/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`SCALEV_ORDER_FETCH_FAILED:${response.status}`);
  }

  return (await response.json()) as ScalevOrderLike;
}

async function findOrderFromStoredEvents(orderId: string): Promise<ScalevOrderLike | null> {
  const events = await prisma.scalevWebhookEvent.findMany({
    where: {
      orderId,
      event: { in: ["order.created", "order.updated"] },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { payload: true },
  });

  for (const event of events) {
    const payload = event.payload as Record<string, unknown>;
    const data = payload.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as ScalevOrderLike;
    }
  }

  return null;
}

async function resolveOrder(
  orderId: string,
  paymentData: Record<string, unknown>,
): Promise<ScalevOrderLike> {
  const stored = await findOrderFromStoredEvents(orderId);
  if (stored) {
    return { ...stored, ...paymentData };
  }

  const fetched = await fetchScalevOrder(orderId);
  if (fetched) return fetched;

  throw new Error("SCALEV_ORDER_DETAILS_UNAVAILABLE");
}

async function ensureHandoff(input: { purchaseId?: string; addOnPurchaseId?: string }) {
  if (!input.purchaseId && !input.addOnPurchaseId) throw new Error("SCALEV_HANDOFF_PURCHASE_REQUIRED");
  const where = input.purchaseId ? { purchaseId: input.purchaseId } : { addOnPurchaseId: input.addOnPurchaseId! };
  const existing = await prisma.scalevHandoff.findUnique({ where, select: { tokenHash: true, expiresAt: true, consumedAt: true } });
  const now = new Date();
  if (existing && !existing.consumedAt && existing.expiresAt > now) return null;
  const token = createHandoffToken();
  const tokenHash = hashHandoffToken(token);
  const expiresAt = new Date(Date.now() + getScalevHandoffTtlMinutes() * 60_000);
  await prisma.scalevHandoff.upsert({
    where,
    create: { ...where, tokenHash, expiresAt },
    update: { tokenHash, expiresAt, consumedAt: null },
  });
  return `${getScalevPublicBaseUrl()}/api/scalev/handoff?token=${encodeURIComponent(token)}`;
}
export async function fulfillScalevPayment(input: {
  eventId: string;
  orderId: string;
  paymentData: Record<string, unknown>;
}) {
  const order = await resolveOrder(input.orderId, input.paymentData);
  const customer = extractCustomer(order);
  const { sku, mapping } = resolveMappedSku(extractSkus(order));

  const userId = await ensureUser({ name: customer.name, email: customer.email });
  const paidAt =
    parseDate(order.paid_time) ??
    parseDate(order.settled_time) ??
    parseDate(input.paymentData.paid_time) ??
    new Date();

  if (mapping.kind === "REASSESSMENT_CREDIT") {
    const addOn = await prisma.addOnProduct.findUnique({
      where: { id: mapping.addOnProductId },
      select: { id: true, status: true },
    });
    if (!addOn || addOn.status !== "ACTIVE") throw new Error("SCALEV_ADDON_PRODUCT_NOT_ACTIVE");

    const existing = await prisma.scalevAddOnPurchase.findUnique({
      where: { scalevOrderId: input.orderId },
      select: { id: true, userId: true, status: true },
    });
    if (existing) {
      if (existing.userId !== userId) throw new Error("SCALEV_ORDER_USER_MISMATCH");
      if (existing.status !== "FULFILLED") {
        await grantReassessmentCredit({
          userId,
          testType: mapping.reassessmentTestType.toLowerCase() as "riasec" | "disc" | "eq" | "cognitive",
          source: `SCALEV:${input.orderId}`,
        });
        await prisma.scalevAddOnPurchase.update({
          where: { id: existing.id },
          data: { status: "FULFILLED", paymentStatus: String(order.payment_status ?? "paid"), paidAt, sourceEventId: input.eventId, orderPayload: JSON.parse(JSON.stringify(order)) as Prisma.InputJsonValue },
        });
      }
      const handoffUrl = await ensureHandoff({ addOnPurchaseId: existing.id });
      return { purchaseId: existing.id, userId, tier: "BASIC" as const, duplicate: true, ...(handoffUrl ? { handoffUrl } : {}) };
    }

    const purchase = await prisma.scalevAddOnPurchase.create({
      data: {
        scalevOrderId: input.orderId,
        scalevCustomerId: customer.customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        productSku: sku,
        addOnProductId: addOn.id,
        userId,
        paymentStatus: String(order.payment_status ?? "paid"),
        status: "PAID",
        paidAt,
        sourceEventId: input.eventId,
        orderPayload: JSON.parse(JSON.stringify(order)) as Prisma.InputJsonValue,
      },
    });

    await grantReassessmentCredit({
      userId,
      testType: mapping.reassessmentTestType.toLowerCase() as "riasec" | "disc" | "eq" | "cognitive",
      source: `SCALEV:${input.orderId}`,
    });
    await prisma.scalevAddOnPurchase.update({ where: { id: purchase.id }, data: { status: "FULFILLED" } });
    const handoffUrl = await ensureHandoff({ addOnPurchaseId: purchase.id });
    return { purchaseId: purchase.id, userId, tier: "BASIC" as const, duplicate: false, ...(handoffUrl ? { handoffUrl } : {}) };
  }

  const product = await prisma.product.findUnique({
    where: { tier: mapping.tier },
    select: { id: true, tier: true, status: true },
  });
  if (!product) throw new Error(`READY_SCORE_PRODUCT_NOT_FOUND:${mapping.tier}`);
  if (product.status !== "ACTIVE") throw new Error(`READY_SCORE_PRODUCT_NOT_ACTIVE:${mapping.tier}`);

  const existing = await prisma.scalevPurchase.findUnique({
    where: { scalevOrderId: input.orderId },
    select: { id: true, userId: true, status: true },
  });
  if (existing) {
    if (existing.userId !== userId) throw new Error("SCALEV_ORDER_USER_MISMATCH");
    if (existing.status !== "FULFILLED") {
      if (mapping.tier === "BASIC") {
        if (!mapping.testType) throw new Error("SCALEV_BASIC_TEST_TYPE_MISSING");
        await grantSingleTestEntitlements({ userId, testType: mapping.testType, source: `SCALEV:${input.orderId}`, startsAt: paidAt });
      } else {
        await grantProductEntitlements({ userId, productId: product.id, source: `SCALEV:${input.orderId}`, startsAt: paidAt });
      }
      await prisma.scalevPurchase.update({ where: { id: existing.id }, data: { status: "FULFILLED", paymentStatus: String(order.payment_status ?? "paid"), paidAt, sourceEventId: input.eventId, orderPayload: JSON.parse(JSON.stringify(order)) as Prisma.InputJsonValue } });
    }
    const handoffUrl = await ensureHandoff({ purchaseId: existing.id });
    return { purchaseId: existing.id, userId, tier: mapping.tier, duplicate: true, ...(handoffUrl ? { handoffUrl } : {}) };
  }

  const purchase = await prisma.scalevPurchase.create({
    data: {
      scalevOrderId: input.orderId,
      scalevCustomerId: customer.customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      productSku: sku,
      productTier: mapping.tier,
      selectedTestType: mapping.testType ?? null,
      productId: product.id,
      userId,
      paymentStatus: String(order.payment_status ?? "paid"),
      status: "PAID",
      paidAt,
      sourceEventId: input.eventId,
      orderPayload: JSON.parse(JSON.stringify(order)) as Prisma.InputJsonValue,
    },
  });
  if (mapping.tier === "BASIC") {
    if (!mapping.testType) throw new Error("SCALEV_BASIC_TEST_TYPE_MISSING");
    await grantSingleTestEntitlements({ userId, testType: mapping.testType, source: `SCALEV:${input.orderId}`, startsAt: paidAt });
  } else {
    await grantProductEntitlements({ userId, productId: product.id, source: `SCALEV:${input.orderId}`, startsAt: paidAt });
  }
  await prisma.scalevPurchase.update({ where: { id: purchase.id }, data: { status: "FULFILLED" } });
  const handoffUrl = await ensureHandoff({ purchaseId: purchase.id });
  return { purchaseId: purchase.id, userId, tier: mapping.tier, duplicate: false, ...(handoffUrl ? { handoffUrl } : {}) };
}
export async function claimScalevHandoff(token: string) {
  const tokenHash = hashHandoffToken(token);
  const now = new Date();

  const handoff = await prisma.scalevHandoff.findUnique({
    where: { tokenHash },
    include: { purchase: true, addOnPurchase: true },
  });

  if (!handoff) throw new Error("SCALEV_HANDOFF_INVALID");
  if (handoff.consumedAt) throw new Error("SCALEV_HANDOFF_CONSUMED");
  if (handoff.expiresAt <= now) throw new Error("SCALEV_HANDOFF_EXPIRED");

  const claimed = await prisma.scalevHandoff.updateMany({
    where: {
      id: handoff.id,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: { consumedAt: now },
  });

  if (claimed.count !== 1) throw new Error("SCALEV_HANDOFF_RACE");

  const userId = handoff.purchase?.userId ?? handoff.addOnPurchase?.userId;
  if (!userId) throw new Error("SCALEV_HANDOFF_PURCHASE_MISSING");
  return userId;
}

export async function issueScalevHandoff(input: { orderId: string; email: string; phone?: string }) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const purchase = await prisma.scalevPurchase.findUnique({ where: { scalevOrderId: input.orderId }, select: { id: true, userId: true, customerEmail: true, customerPhone: true, status: true } });
  const addOnPurchase = purchase ? null : await prisma.scalevAddOnPurchase.findUnique({ where: { scalevOrderId: input.orderId }, select: { id: true, userId: true, customerEmail: true, customerPhone: true, status: true } });
  const record = purchase ?? addOnPurchase;
  if (!record || record.status !== "FULFILLED") throw new Error("SCALEV_PURCHASE_NOT_FULFILLED");
  if (normalizeEmail(record.customerEmail) !== email) throw new Error("SCALEV_IDENTITY_MISMATCH");
  if (record.customerPhone && (!phone || normalizePhone(record.customerPhone) !== phone)) throw new Error("SCALEV_IDENTITY_MISMATCH");
  return ensureHandoff(purchase ? { purchaseId: purchase.id } : { addOnPurchaseId: addOnPurchase!.id });
}

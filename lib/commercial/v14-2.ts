import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { getCurrentSession } from "../auth/session";
import { getPaymentProvider } from "./midtrans";
import { fulfillPaidOrder } from "./v14-3";

const PROVIDER = "MIDTRANS";

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function allowedTransition(current: string, next: string) {
  if (current === next) return true;
  const allowed: Record<string, string[]> = {
    PENDING: ["PAID", "FAILED", "EXPIRED", "CANCELLED"],
    CREATED: ["PENDING"],
    PAID: [],
    FAILED: [],
    EXPIRED: [],
    CANCELLED: [],
  };
  return allowed[current]?.includes(next) ?? false;
}

function assertAmount(orderAmount: number, providerAmount: number) {
  if (!Number.isInteger(providerAmount) || providerAmount !== orderAmount) {
    throw new Error("PAYMENT_AMOUNT_MISMATCH");
  }
}

function assertCurrency(orderCurrency: string, providerCurrency: string) {
  if (orderCurrency.toUpperCase() !== providerCurrency.toUpperCase()) {
    throw new Error("PAYMENT_CURRENCY_MISMATCH");
  }
}

export async function createProviderPayment(orderId: string) {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const order = await prisma.commercialOrder.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { paymentAttempts: true, user: { select: { name: true, email: true } } },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.paymentStatus !== "PENDING") throw new Error("ORDER_NOT_PAYABLE");

  const existing = order.paymentAttempts.find((a) => a.provider === PROVIDER);
  if (existing?.redirectUrl) {
    return {
      orderNumber: order.orderNumber,
      provider: PROVIDER,
      paymentToken: existing.paymentToken,
      redirectUrl: existing.redirectUrl,
      paymentStatus: order.paymentStatus,
      duplicate: true,
    };
  }

  const provider = getPaymentProvider();
  const idempotencyKey = `PAY-${order.id}`;
  let attempt = existing;

  if (!attempt) {
    try {
      attempt = await prisma.commercialPaymentAttempt.create({
        data: {
          orderId: order.id,
          provider: PROVIDER,
          idempotencyKey,
          status: "CREATED",
        },
      });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002")) throw error;
      attempt = await prisma.commercialPaymentAttempt.findUniqueOrThrow({
        where: { orderId_provider: { orderId: order.id, provider: PROVIDER } },
      });
    }
  }

  if (attempt.redirectUrl) {
    return {
      orderNumber: order.orderNumber,
      provider: PROVIDER,
      paymentToken: attempt.paymentToken,
      redirectUrl: attempt.redirectUrl,
      paymentStatus: order.paymentStatus,
      duplicate: true,
    };
  }

  const result = await provider.createPayment({
    orderId: order.orderNumber,
    amountIdr: order.totalAmountIdr,
    currency: order.currency,
    customer: order.user,
  });

  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.commercialOrder.findUniqueOrThrow({ where: { id: order.id } });
    if (current.paymentStatus !== "PENDING") throw new Error("PAYMENT_STATE_CHANGED");

    const attemptUpdate = await tx.commercialPaymentAttempt.update({
      where: { id: attempt!.id },
      data: {
        status: "PENDING",
        providerTransactionId: result.providerTransactionId,
        providerReference: result.providerReference,
        paymentToken: result.paymentToken,
        redirectUrl: result.redirectUrl,
        providerStatus: "pending",
        responsePayload: json(result.raw),
      },
    });

    await tx.commercialOrder.update({
      where: { id: order.id },
      data: {
        provider: PROVIDER,
        providerReference: result.providerReference,
      },
    });

    await tx.commercialAuditEvent.create({
      data: {
        orderId: order.id,
        action: "PAYMENT_PROVIDER_CREATED",
        fromState: "PENDING",
        toState: "PENDING",
        source: PROVIDER,
        reference: result.providerReference,
        metadata: {
          provider: PROVIDER,
          providerTransactionId: result.providerTransactionId ?? null,
        },
      },
    });

    return attemptUpdate;
  });

  return {
    orderNumber: order.orderNumber,
    provider: PROVIDER,
    paymentToken: updated.paymentToken,
    redirectUrl: updated.redirectUrl,
    paymentStatus: "PENDING" as const,
    duplicate: false,
  };
}

async function applyVerifiedStatus(input: {
  orderId: string;
  providerReference: string;
  providerTransactionId?: string;
  providerStatus: string;
  nextStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";
  source: string;
  raw: Record<string, unknown>;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.commercialOrder.findUniqueOrThrow({ where: { id: input.orderId } });
    if (order.provider !== PROVIDER || order.providerReference !== input.providerReference) {
      throw new Error("PAYMENT_PROVIDER_REFERENCE_MISMATCH");
    }
    if (!allowedTransition(order.paymentStatus, input.nextStatus)) {
      throw new Error(`INVALID_PAYMENT_STATE_TRANSITION:${order.paymentStatus}->${input.nextStatus}`);
    }

    const attempt = await tx.commercialPaymentAttempt.findUnique({
      where: { orderId_provider: { orderId: order.id, provider: PROVIDER } },
    });

    await tx.commercialOrder.update({
      where: { id: order.id },
      data: {
        paymentStatus: input.nextStatus,
        paidAt: input.nextStatus === "PAID" ? new Date() : order.paidAt,
      },
    });

    if (attempt) {
      await tx.commercialPaymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: input.nextStatus,
          providerTransactionId: input.providerTransactionId ?? attempt.providerTransactionId,
          providerStatus: input.providerStatus,
          responsePayload: json(input.raw),
        },
      });
    }

    const action =
      input.nextStatus === "PAID" ? "PAYMENT_VERIFIED" :
      input.nextStatus === "PENDING" ? "PAYMENT_PENDING" :
      `PAYMENT_${input.nextStatus}`;

    await tx.commercialAuditEvent.create({
      data: {
        orderId: order.id,
        action,
        fromState: order.paymentStatus,
        toState: input.nextStatus,
        source: input.source,
        reference: input.providerReference,
        metadata: {
          providerStatus: input.providerStatus,
          providerTransactionId: input.providerTransactionId ?? null,
        },
      },
    });

    return { orderNumber: order.orderNumber, paymentStatus: input.nextStatus };
  });

  if (result.paymentStatus === "PAID") {
    try {
      await fulfillPaidOrder(input.orderId, input.source);
    } catch (error) {
      // Payment remains PAID. Fulfillment records its own retryable failure state.
      console.error("V14.3_FULFILLMENT_AFTER_PAYMENT_FAILED", error);
    }
  }

  return result;
}

export async function verifyProviderPayment(orderId: string) {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const order = await prisma.commercialOrder.findFirst({
    where: { id: orderId, userId: session.user.id },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (!order.providerReference) throw new Error("PAYMENT_NOT_CREATED");
  if (order.providerReference !== order.orderNumber) throw new Error("PAYMENT_PROVIDER_REFERENCE_MISMATCH");

  const provider = getPaymentProvider();
  const status = await provider.getPaymentStatus(order.orderNumber);

  assertAmount(order.totalAmountIdr, status.grossAmount);
  assertCurrency(order.currency, status.currency);
  if (status.providerReference !== order.orderNumber) throw new Error("PAYMENT_PROVIDER_REFERENCE_MISMATCH");

  return applyVerifiedStatus({
    orderId: order.id,
    providerReference: status.providerReference,
    providerTransactionId: status.providerTransactionId,
    providerStatus: status.providerStatus,
    nextStatus: status.status,
    source: `${PROVIDER}_STATUS_API`,
    raw: status.raw,
  });
}

export async function processProviderWebhook(input: {
  rawBody: Buffer;
  payload: Record<string, unknown>;
}) {
  const orderNumber = String(input.payload.order_id ?? "").trim();
  const eventType = String(input.payload.transaction_status ?? "unknown").trim().toLowerCase();
  const providerTransactionId = typeof input.payload.transaction_id === "string"
    ? input.payload.transaction_id
    : undefined;
  const eventIdentity = [
    orderNumber,
    providerTransactionId ?? "",
    eventType,
    String(input.payload.status_code ?? ""),
    String(input.payload.gross_amount ?? ""),
  ].join("|");
  const eventKey = crypto.createHash("sha256").update(eventIdentity, "utf8").digest("hex");

  if (!orderNumber) throw new Error("WEBHOOK_ORDER_REFERENCE_MISSING");

  const existing = await prisma.commercialWebhookEvent.findUnique({
    where: { provider_eventKey: { provider: PROVIDER, eventKey } },
  });
  if (existing && existing.status !== "FAILED") {
    return { duplicate: true, status: existing.status, eventId: existing.id };
  }

  const order = await prisma.commercialOrder.findUnique({
    where: { orderNumber },
  });
  if (!order) throw new Error("WEBHOOK_ORDER_NOT_FOUND");
  if (order.provider !== PROVIDER || order.providerReference !== orderNumber) {
    throw new Error("WEBHOOK_PROVIDER_REFERENCE_MISMATCH");
  }

  const grossAmount = Number.parseFloat(String(input.payload.gross_amount ?? ""));
  const currency = String(input.payload.currency ?? "").trim().toUpperCase();
  if (!Number.isFinite(grossAmount)) throw new Error("WEBHOOK_AMOUNT_MISSING");
  assertAmount(order.totalAmountIdr, grossAmount);
  assertCurrency(order.currency, currency);

  const status = eventType === "settlement" || (eventType === "capture" && String(input.payload.fraud_status ?? "").toLowerCase() === "accept")
    ? "PAID" as const
    : eventType === "pending" || eventType === "authorize"
      ? "PENDING" as const
      : eventType === "expire"
        ? "EXPIRED" as const
        : eventType === "cancel"
          ? "CANCELLED" as const
          : "FAILED" as const;

  let eventRecord;
  try {
    eventRecord = existing ?? await prisma.commercialWebhookEvent.create({
      data: {
        provider: PROVIDER,
        eventKey,
        orderId: order.id,
        providerTransactionId,
        eventType,
        status: "RECEIVED",
        payload: json(input.payload),
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002") {
      const raced = await prisma.commercialWebhookEvent.findUniqueOrThrow({
        where: { provider_eventKey: { provider: PROVIDER, eventKey } },
      });
      return { duplicate: true, status: raced.status, eventId: raced.id };
    }
    throw error;
  }

  try {
    const result = await applyVerifiedStatus({
      orderId: order.id,
      providerReference: orderNumber,
      providerTransactionId,
      providerStatus: eventType,
      nextStatus: status,
      source: "MIDTRANS_WEBHOOK",
      raw: input.payload,
    });
    await prisma.commercialWebhookEvent.update({
      where: { id: eventRecord.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    return { duplicate: false, eventId: eventRecord.id, ...result };
  } catch (error) {
    await prisma.commercialWebhookEvent.update({
      where: { id: eventRecord.id },
      data: {
        status: "FAILED",
        errorCode: error instanceof Error ? error.message.split(":")[0] : "WEBHOOK_PROCESSING_FAILED",
        errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
      },
    });
    throw error;
  }
}

/**
 * Customer-return reconciliation boundary.
 *
 * Midtrans finish redirects are customer-facing hints only. The authoritative
 * payment state is re-read server-side from Midtrans, then the existing V14.3
 * fulfillment boundary is retried when a paid order has not yet been delivered.
 */
export async function reconcileCommercialOrderReturn(orderNumber: string) {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const normalizedOrderNumber = orderNumber.trim();
  if (!normalizedOrderNumber) throw new Error("ORDER_NOT_FOUND");

  let order = await prisma.commercialOrder.findFirst({
    where: { orderNumber: normalizedOrderNumber, userId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      productNameSnapshot: true,
      assessmentTypeSnapshot: true,
      totalAmountIdr: true,
      currency: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      paidAt: true,
    },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  // A customer can return before our webhook arrives, and older/partially-created
  // orders may still be CREATED. Reconcile every non-terminal payment state from
  // Midtrans before deciding whether the customer has access.
  if (order.paymentStatus === "CREATED" || order.paymentStatus === "PENDING") {
    await verifyProviderPayment(order.id);
  }

  order = await prisma.commercialOrder.findFirst({
    where: { id: order.id, userId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      productNameSnapshot: true,
      assessmentTypeSnapshot: true,
      totalAmountIdr: true,
      currency: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      paidAt: true,
    },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  if (order.paymentStatus === "PAID" && order.fulfillmentStatus !== "FULFILLED") {
    await fulfillPaidOrder(order.id, "CUSTOMER_PAYMENT_RETURN");
    order = await prisma.commercialOrder.findFirst({
      where: { id: order.id, userId: session.user.id },
      select: {
        id: true,
        orderNumber: true,
        productNameSnapshot: true,
        assessmentTypeSnapshot: true,
        totalAmountIdr: true,
        currency: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        paidAt: true,
      },
    });
    if (!order) throw new Error("ORDER_NOT_FOUND");
  }

  return order;
}

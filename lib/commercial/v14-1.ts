import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { getCurrentSession } from "../auth/session";
import { COMMERCIAL_PRODUCT_CATALOG, SINGLE_TEST_TYPES, type SingleTestType } from "./types";
import { validateV16Offer } from "./offer";
import { getActiveSubject } from "../subjects/service";

const ACTIVE_PRODUCT_STATUS = "ACTIVE" as const;

function orderNumber() {
  return `RS-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function resolveAssessmentType(entitlements: Array<{ type: string; resourceType: string; resourceKey: string }>) {
  const item = entitlements.find((e) => e.type === "TEST_ACCESS" && e.resourceType === "TEST_TYPE");
  return item?.resourceKey ?? null;
}

export async function createCheckoutOrder(input: { productId: string; quantity?: number; testType?: string; couponCode?: string }) {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const subject = await getActiveSubject(session.user.id);
  const productId = input.productId?.trim();
  const quantity = input.quantity ?? 1;
  const requestedTestType = input.testType?.trim().toUpperCase() || null;
  const couponCode = input.couponCode?.trim().toUpperCase() || null;
  if (!productId || !Number.isInteger(quantity) || quantity !== 1) throw new Error("INVALID_CHECKOUT");
  if (requestedTestType && !SINGLE_TEST_TYPES.includes(requestedTestType as SingleTestType)) {
    throw new Error("INVALID_SINGLE_TEST_TYPE");
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, status: ACTIVE_PRODUCT_STATUS },
    include: { entitlements: true },
  });

  if (!product) throw new Error("PRODUCT_NOT_AVAILABLE");
  const unitPriceIdr = product.priceIdr;
  if (unitPriceIdr === null || !Number.isInteger(unitPriceIdr) || unitPriceIdr <= 0) {
    throw new Error("PRODUCT_PRICE_NOT_CONFIGURED");
  }

  const subtotalAmount = unitPriceIdr * quantity;
  const offer = couponCode ? validateV16Offer(couponCode) : { valid: false as const, code: "NO_OFFER" as const };
  if (couponCode && !offer.valid) throw new Error(offer.code);
  const discountAmount = offer.valid ? Math.floor(subtotalAmount * offer.percent / 100) : 0;
  const totalAmount = Math.max(1, subtotalAmount - discountAmount);
  const catalogAssessmentType = resolveAssessmentType(product.entitlements);
  const assessmentType = product.tier === "BASIC"
    ? requestedTestType === "IQ"
      ? "COGNITIVE"
      : requestedTestType
    : catalogAssessmentType;

  if (product.tier === "BASIC" && !assessmentType) {
    throw new Error("SINGLE_TEST_SELECTION_REQUIRED");
  }
  if (product.tier !== "BASIC" && requestedTestType) {
    throw new Error("INVALID_SINGLE_TEST_SELECTION");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.commercialOrder.create({
      data: {
        id: `ord_${randomBytes(12).toString("hex")}`,
        userId: session.user.id,
        subjectId: subject.id,
        productId: product.id,
        orderNumber: orderNumber(),
        productNameSnapshot: product.name,
        assessmentTypeSnapshot: assessmentType,
        quantity,
        unitPriceIdrSnapshot: unitPriceIdr,
        totalAmountIdr: totalAmount,
        currency: "IDR",
        commercialConfig: {
          source: "V14.1_CHECKOUT",
          productTier: product.tier,
          entitlementKeys: product.entitlements.map((e) => `${e.type}:${e.resourceType}:${e.resourceKey}`),
          pricing: { subtotalAmountIdr: subtotalAmount, discountAmountIdr: discountAmount, couponCode: offer.valid ? offer.code : null, discountPercent: offer.valid ? offer.percent : 0, offerExpiresAt: offer.valid ? offer.expiresAt.toISOString() : null },
        },
        status: "CREATED",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NOT_STARTED",
      },
    });

    await tx.commercialAuditEvent.create({
      data: {
        orderId: order.id,
        action: "ORDER_CREATED",
        fromState: null,
        toState: "CREATED",
        source: "CHECKOUT",
        reference: order.orderNumber,
        metadata: {
          productId: product.id,
          quantity,
          totalAmountIdr: totalAmount,
          currency: "IDR",
          assessmentType: assessmentType,
        },
      },
    });

    await tx.commercialAuditEvent.create({
      data: {
        orderId: order.id,
        action: "PAYMENT_PENDING",
        fromState: "CREATED",
        toState: "PENDING",
        source: "CHECKOUT",
        reference: order.orderNumber,
      },
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      product: {
        id: product.id,
        name: product.name,
        tier: product.tier,
        assessmentType,
      },
      quantity: order.quantity,
      unitPriceIdr: order.unitPriceIdrSnapshot,
      totalAmountIdr: order.totalAmountIdr,
      subtotalAmountIdr: subtotalAmount,
      discountAmountIdr: discountAmount,
      couponCode: offer.valid ? offer.code : null,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
    };
  });
}


export async function createUpgradeCheckoutOrder(input: { targetTier: "MEDIUM" | "ADVANCE" }) {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const subject = await getActiveSubject(session.user.id);
  const { getUpgradeQuote } = await import("./upgrade-service");
  const quote = await getUpgradeQuote(session.user.id, input.targetTier, subject.id);
  if (!quote.eligible || !quote.selected || quote.selected.differentialIdr == null) {
    throw new Error(quote.code === "ALREADY_MAX_TIER" ? "UPGRADE_NOT_AVAILABLE" : quote.code);
  }
  const product = await prisma.product.findFirst({
    where: { tier: input.targetTier, status: ACTIVE_PRODUCT_STATUS },
    include: { entitlements: true },
  });
  if (!product) throw new Error("PRODUCT_NOT_AVAILABLE");
  if (product.priceIdr == null || !Number.isInteger(product.priceIdr) || product.priceIdr <= 0) {
    throw new Error("PRODUCT_PRICE_NOT_CONFIGURED");
  }
  const totalAmount = quote.selected.differentialIdr;
  if (!Number.isInteger(totalAmount) || totalAmount <= 0) throw new Error("UPGRADE_NOT_AVAILABLE");

  return prisma.$transaction(async (tx) => {
    const order = await tx.commercialOrder.create({
      data: {
        id: `ord_${randomBytes(12).toString("hex")}`,
        userId: session.user.id,
        subjectId: subject.id,
        productId: product.id,
        orderNumber: orderNumber(),
        productNameSnapshot: `Upgrade → ${product.name}`,
        assessmentTypeSnapshot: null,
        quantity: 1,
        unitPriceIdrSnapshot: totalAmount,
        totalAmountIdr: totalAmount,
        currency: "IDR",
        commercialConfig: {
          source: "V19.5_UPGRADE_CHECKOUT",
          orderKind: "UPGRADE",
          fromTier: quote.currentTier,
          targetTier: input.targetTier,
          targetProductId: product.id,
          catalogPriceIdr: product.priceIdr,
          differentialAmountIdr: totalAmount,
        },
        status: "CREATED",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NOT_STARTED",
      },
    });
    await tx.commercialAuditEvent.create({
      data: {
        orderId: order.id,
        action: "ORDER_CREATED",
        fromState: null,
        toState: "CREATED",
        source: "UPGRADE_CHECKOUT",
        reference: order.orderNumber,
        metadata: { orderKind: "UPGRADE", fromTier: quote.currentTier, targetTier: input.targetTier, differentialAmountIdr: totalAmount },
      },
    });
    await tx.commercialAuditEvent.create({
      data: { orderId: order.id, action: "PAYMENT_PENDING", fromState: "CREATED", toState: "PENDING", source: "UPGRADE_CHECKOUT", reference: order.orderNumber },
    });
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      product: { id: product.id, name: product.name, tier: product.tier },
      quantity: 1,
      unitPriceIdr: totalAmount,
      totalAmountIdr: totalAmount,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
    };
  });
}

export async function getMyCommercialOrders() {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return prisma.commercialOrder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, orderNumber: true, productNameSnapshot: true,
      assessmentTypeSnapshot: true, quantity: true, unitPriceIdrSnapshot: true,
      totalAmountIdr: true, currency: true, status: true,
      paymentStatus: true, fulfillmentStatus: true, createdAt: true,
    },
  });
}

export async function createReassessmentCreditCheckoutOrder(input: { testType: string }) {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  const subject = await getActiveSubject(session.user.id);
  const normalized = input.testType?.trim().toUpperCase();
  const allowed = ["COGNITIVE", "EQ", "DISC", "RIASEC", "WORK_ATTITUDE", "LEARNING_PREFERENCE"] as const;
  if (!allowed.includes(normalized as (typeof allowed)[number])) {
    throw new Error("INVALID_REASSESSMENT_TEST_TYPE");
  }

  const addOn = await prisma.addOnProduct.findUnique({
    where: { id: "addon-reassessment-credit-v1" },
    select: { id: true, name: true, priceIdr: true, status: true },
  });
  if (!addOn || addOn.status !== "ACTIVE") throw new Error("REASSESSMENT_CREDIT_PRODUCT_NOT_ACTIVE");
  const unitPriceIdr = addOn.priceIdr;
  if (unitPriceIdr === null || !Number.isInteger(unitPriceIdr) || unitPriceIdr <= 0) {
    throw new Error("ADD_ON_PRICE_NOT_CONFIGURED");
  }

  const backingProduct = await prisma.product.findFirst({
    where: { id: "product-basic", status: ACTIVE_PRODUCT_STATUS },
    select: { id: true },
  });
  if (!backingProduct) throw new Error("PRODUCT_NOT_AVAILABLE");

  const orderNumberValue = orderNumber();
  const productNameSnapshot = `${addOn.name} — ${normalized}`;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.commercialOrder.create({
      data: {
        id: `ord_${randomBytes(12).toString("hex")}`,
        userId: session.user.id,
        subjectId: subject.id,
        productId: backingProduct.id,
        orderNumber: orderNumberValue,
        productNameSnapshot,
        assessmentTypeSnapshot: normalized,
        quantity: 1,
        unitPriceIdrSnapshot: unitPriceIdr,
        totalAmountIdr: unitPriceIdr,
        currency: "IDR",
        commercialConfig: {
          source: "V19.2.1_REASSESSMENT_CREDIT_CHECKOUT",
          orderKind: "REASSESSMENT_CREDIT",
          addOnProductId: addOn.id,
          reassessmentTestType: normalized,
        },
        status: "CREATED",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NOT_STARTED",
      },
    });

    await tx.commercialAuditEvent.create({
      data: {
        orderId: created.id,
        action: "ORDER_CREATED",
        fromState: null,
        toState: "CREATED",
        source: "REASSESSMENT_CREDIT_CHECKOUT",
        reference: created.orderNumber,
        metadata: { orderKind: "REASSESSMENT_CREDIT", addOnProductId: addOn.id, reassessmentTestType: normalized, totalAmountIdr: unitPriceIdr },
      },
    });

    return created;
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    product: { id: addOn.id, name: addOn.name, tier: "ADD_ON", assessmentType: normalized },
    quantity: 1,
    unitPriceIdr: unitPriceIdr,
    totalAmountIdr: unitPriceIdr,
  };
}

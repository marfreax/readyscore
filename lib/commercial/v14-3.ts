import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { getCurrentSession } from "../auth/session";
import { getSingleTestEntitlements, type SingleTestType } from "./types";

const CORE_TEST_TYPES = ["COGNITIVE", "EQ", "DISC", "RIASEC"] as const;
type CoreTestType = (typeof CORE_TEST_TYPES)[number];

type FulfillmentResult = {
  orderId: string;
  orderNumber: string;
  fulfillmentStatus: "NOT_STARTED" | "FULFILLMENT_PENDING" | "FULFILLED" | "FULFILLMENT_FAILED";
  entitlementCount: number;
  assessmentTypes: string[];
  retryable: boolean;
};

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeCoreTestType(value: string | null | undefined): CoreTestType | null {
  const normalized = value?.trim().toUpperCase();
  return CORE_TEST_TYPES.includes(normalized as CoreTestType) ? normalized as CoreTestType : null;
}

function toSingleTestType(value: CoreTestType): SingleTestType {
  return value === "COGNITIVE" ? "IQ" : value;
}

function definitionsForOrder(order: {
  product: { tier: string; entitlements: Array<{ type: string; resourceType: string; resourceKey: string }> };
  assessmentTypeSnapshot: string | null;
}) {
  if (order.product.tier === "BASIC") {
    const selected = normalizeCoreTestType(order.assessmentTypeSnapshot);
    if (!selected) throw new Error("FULFILLMENT_CONFIGURATION_MISSING");
    return getSingleTestEntitlements(toSingleTestType(selected));
  }

  return order.product.entitlements.map((item) => ({
    type: item.type,
    resourceType: item.resourceType,
    resourceKey: item.resourceKey,
  }));
}

function existingSourceOrderId(existing: { sourceOrderId: string | null }) {
  return existing.sourceOrderId;
}

function assertNoInvalidDefinitions(definitions: ReadonlyArray<{ type: string; resourceType: string; resourceKey: string }>) {
  if (!definitions.length) throw new Error("FULFILLMENT_NO_ENTITLEMENTS");
  for (const definition of definitions) {
    if (!definition.type || !definition.resourceType || !definition.resourceKey) {
      throw new Error("FULFILLMENT_INVALID_ENTITLEMENT");
    }
  }
}

/**
 * Canonical V14.3 fulfillment boundary. It is safe to call repeatedly for the
 * same paid order: one fulfillment ledger row and one atomic transaction own
 * the entitlement grants.
 */
export async function fulfillPaidOrder(orderId: string, source = "V14.3_FULFILLMENT") : Promise<FulfillmentResult> {
  const order = await prisma.commercialOrder.findUnique({
    where: { id: orderId },
    include: { product: { include: { entitlements: true } }, fulfillment: true },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.paymentStatus !== "PAID") throw new Error("PAYMENT_NOT_PAID");

  if (order.fulfillmentStatus === "FULFILLED" && order.fulfillment) {
    const types = order.product.tier === "BASIC"
      ? [normalizeCoreTestType(order.assessmentTypeSnapshot)].filter(Boolean) as string[]
      : order.product.entitlements.filter((e) => e.type === "TEST_ACCESS" && e.resourceType === "TEST_TYPE").map((e) => e.resourceKey);
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      fulfillmentStatus: "FULFILLED",
      entitlementCount: 0,
      assessmentTypes: types,
      retryable: false,
    };
  }

  let definitions;
  try {
    definitions = definitionsForOrder(order);
    assertNoInvalidDefinitions(definitions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "FULFILLMENT_CONFIGURATION_MISSING";
    await prisma.$transaction(async (tx) => {
      await tx.commercialFulfillment.upsert({
        where: { orderId: order.id },
        create: { orderId: order.id, status: "FULFILLMENT_FAILED", attemptCount: 1, lastError: message },
        update: { status: "FULFILLMENT_FAILED", attemptCount: { increment: 1 }, lastError: message },
      });
      await tx.commercialOrder.update({ where: { id: order.id }, data: { fulfillmentStatus: "FULFILLMENT_FAILED" } });
      await tx.commercialAuditEvent.create({
        data: { orderId: order.id, action: "FULFILLMENT_FAILED", fromState: order.fulfillmentStatus, toState: "FULFILLMENT_FAILED", source, reference: order.orderNumber, metadata: { error: message } },
      });
    });
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.commercialOrder.findUnique({
      where: { id: order.id },
      include: { product: { include: { entitlements: true } }, fulfillment: true },
    });
    if (!current) throw new Error("ORDER_NOT_FOUND");
    if (current.paymentStatus !== "PAID") throw new Error("PAYMENT_NOT_PAID");
    if (current.fulfillmentStatus === "FULFILLED") {
      return { entitlementCount: 0, assessmentTypes: definitions.filter((d) => d.type === "TEST_ACCESS" && d.resourceType === "TEST_TYPE").map((d) => d.resourceKey) };
    }

    const claimed = await tx.commercialOrder.updateMany({
      where: {
        id: current.id,
        paymentStatus: "PAID",
        fulfillmentStatus: { in: ["NOT_STARTED", "FULFILLMENT_FAILED"] },
      },
      data: { fulfillmentStatus: "FULFILLMENT_PENDING" },
    });
    if (claimed.count !== 1) {
      const latest = await tx.commercialOrder.findUniqueOrThrow({ where: { id: current.id }, select: { fulfillmentStatus: true } });
      return { entitlementCount: 0, assessmentTypes: [], alreadyProcessing: latest.fulfillmentStatus === "FULFILLMENT_PENDING" };
    }

    await tx.commercialFulfillment.upsert({
      where: { orderId: current.id },
      create: { orderId: current.id, status: "FULFILLMENT_PENDING", attemptCount: 1 },
      update: { status: "FULFILLMENT_PENDING", attemptCount: { increment: 1 }, lastError: null },
    });
    await tx.commercialAuditEvent.create({
      data: { orderId: current.id, action: "FULFILLMENT_PENDING", fromState: current.fulfillmentStatus, toState: "FULFILLMENT_PENDING", source, reference: current.orderNumber },
    });

    let granted = 0;
    const assessmentTypes: string[] = [];
    for (const definition of definitions) {
      if (definition.type === "TEST_ACCESS" && definition.resourceType === "TEST_TYPE") assessmentTypes.push(definition.resourceKey);
      const existing = await tx.userEntitlement.findUnique({
        where: {
          userId_type_resourceType_resourceKey: {
            userId: current.userId,
            type: definition.type as any,
            resourceType: definition.resourceType as any,
            resourceKey: definition.resourceKey,
          },
        },
        select: { id: true, usageLimit: true, usageConsumed: true, sourceOrderId: true },
      });

      if (existing) {
        if (existingSourceOrderId(existing) === current.id) {
          await tx.commercialAuditEvent.create({
            data: { orderId: current.id, action: "ENTITLEMENT_ALREADY_GRANTED", fromState: "ACTIVE", toState: "ACTIVE", source: "FULFILLMENT", reference: current.orderNumber, metadata: { entitlementId: existing.id, type: definition.type, resourceType: definition.resourceType, resourceKey: definition.resourceKey, usageLimitIncrement: 0 } },
          });
        } else {
          await tx.userEntitlement.update({
            where: { id: existing.id },
            data: {
              productId: current.productId,
              source: `ORDER:${current.orderNumber}`,
              sourceOrderId: existingSourceOrderId(existing) ?? current.id,
              status: "ACTIVE",
              startsAt: current.paidAt ?? new Date(),
              usageLimit: { increment: 1 },
            },
          });
          await tx.commercialAuditEvent.create({
            data: { orderId: current.id, action: "ENTITLEMENT_GRANTED", fromState: null, toState: "ACTIVE", source: "FULFILLMENT", reference: current.orderNumber, metadata: { entitlementId: existing.id, type: definition.type, resourceType: definition.resourceType, resourceKey: definition.resourceKey, usageLimitIncrement: 1 } },
          });
        }
      } else {
        const created = await tx.userEntitlement.create({
          data: {
            userId: current.userId,
            productId: current.productId,
            type: definition.type as any,
            resourceType: definition.resourceType as any,
            resourceKey: definition.resourceKey,
            status: "ACTIVE",
            source: `ORDER:${current.orderNumber}`,
            sourceOrderId: current.id,
            startsAt: current.paidAt ?? new Date(),
            usageLimit: 1,
            usageConsumed: 0,
          },
          select: { id: true },
        });
        await tx.commercialAuditEvent.create({
          data: { orderId: current.id, action: "ENTITLEMENT_CREATED", fromState: null, toState: "ACTIVE", source: "FULFILLMENT", reference: current.orderNumber, metadata: { entitlementId: created.id, type: definition.type, resourceType: definition.resourceType, resourceKey: definition.resourceKey } },
        });
      }
      granted += 1;
    }

    const fulfilledAt = new Date();
    await tx.commercialFulfillment.update({ where: { orderId: current.id }, data: { status: "FULFILLED", fulfilledAt, lastError: null } });
    await tx.commercialOrder.update({ where: { id: current.id }, data: { fulfillmentStatus: "FULFILLED", fulfilledAt, status: "COMPLETED" } });
    await tx.commercialAuditEvent.create({
      data: { orderId: current.id, action: "FULFILLMENT_COMPLETED", fromState: "FULFILLMENT_PENDING", toState: "FULFILLED", source: "FULFILLMENT", reference: current.orderNumber, metadata: { entitlementCount: granted, assessmentTypes } },
    });
    await tx.commercialAuditEvent.create({
      data: { orderId: current.id, action: "ACCESS_AVAILABLE", fromState: null, toState: "GRANTED", source: "FULFILLMENT", reference: current.orderNumber, metadata: { assessmentTypes } },
    });
    return { entitlementCount: granted, assessmentTypes };
  }).catch(async (error) => {
    const message = error instanceof Error ? error.message : "FULFILLMENT_FAILED";
    try {
      await prisma.$transaction(async (tx) => {
        await tx.commercialFulfillment.upsert({
          where: { orderId: order.id },
          create: { orderId: order.id, status: "FULFILLMENT_FAILED", attemptCount: 1, lastError: message },
          update: { status: "FULFILLMENT_FAILED", lastError: message },
        });
        await tx.commercialOrder.update({ where: { id: order.id }, data: { fulfillmentStatus: "FULFILLMENT_FAILED" } });
        await tx.commercialAuditEvent.create({
          data: { orderId: order.id, action: "FULFILLMENT_FAILED", fromState: "FULFILLMENT_PENDING", toState: "FULFILLMENT_FAILED", source, reference: order.orderNumber, metadata: { error: message } },
        });
      });
    } catch {}
    throw error;
  });

  const finalStatus = result.entitlementCount === 0 && "alreadyProcessing" in result && result.alreadyProcessing
    ? "FULFILLMENT_PENDING" as const
    : "FULFILLED" as const;
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    fulfillmentStatus: finalStatus,
    entitlementCount: result.entitlementCount,
    assessmentTypes: result.assessmentTypes,
    retryable: finalStatus === "FULFILLMENT_PENDING" ? false : false,
  };
}

export async function retryPaidOrderFulfillment(orderId: string) {
  return fulfillPaidOrder(orderId, "CUSTOMER_RETRY");
}

export async function getMyCommercialDelivery(orderId: string) {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const order = await prisma.commercialOrder.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { fulfillment: true },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    fulfillment: order.fulfillment ? {
      status: order.fulfillment.status,
      attemptCount: order.fulfillment.attemptCount,
      fulfilledAt: order.fulfillment.fulfilledAt?.toISOString() ?? null,
      retryable: order.fulfillment.status === "FULFILLMENT_FAILED" && order.paymentStatus === "PAID",
    } : null,
  };
}

/** Atomic access claim. The UPDATE predicate makes concurrent starts mutually exclusive. */
export async function findConsumableTestEntitlement(userId: string, testType: string, now = new Date()) {
  const resourceKey = normalizeCoreTestType(testType);
  if (!resourceKey) throw new Error("INVALID_ASSESSMENT_TYPE");
  const candidates = await prisma.userEntitlement.findMany({
    where: {
      userId,
      type: "TEST_ACCESS",
      resourceType: "TEST_TYPE",
      resourceKey,
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, usageLimit: true, usageConsumed: true, resourceKey: true, sourceOrderId: true },
  });
  return candidates.find((candidate) => candidate.usageConsumed < candidate.usageLimit) ?? null;
}


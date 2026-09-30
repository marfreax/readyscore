import type { Prisma, AssessmentType as PrismaAssessmentType } from "@prisma/client";
import { prisma } from "../db/prisma";
import { ensureOwnerSubject } from "../subjects/service";
import { getCurrentSession } from "../auth/session";
import { getSingleTestEntitlements, type SingleTestType } from "./types";

const CORE_TEST_TYPES = ["COGNITIVE", "EQ", "DISC", "RIASEC", "WORK_ATTITUDE", "LEARNING_PREFERENCE"] as const;
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
  const canonical = normalized?.replace(/-/g, "_");
  return CORE_TEST_TYPES.includes(canonical as CoreTestType) ? canonical as CoreTestType : null;
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

function reassessmentCreditType(order: { commercialConfig: unknown; assessmentTypeSnapshot: string | null }) {
  const config = order.commercialConfig && typeof order.commercialConfig === "object" && !Array.isArray(order.commercialConfig)
    ? order.commercialConfig as Record<string, unknown>
    : null;
  if (config?.orderKind !== "REASSESSMENT_CREDIT") return null;
  const raw = String(config.reassessmentTestType ?? order.assessmentTypeSnapshot ?? "").trim().toUpperCase().replace(/-/g, "_");
  const allowed = ["COGNITIVE", "EQ", "DISC", "RIASEC", "WORK_ATTITUDE", "LEARNING_PREFERENCE"] as const;
  return allowed.includes(raw as (typeof allowed)[number]) ? raw as (typeof allowed)[number] : null;
}

async function fulfillReassessmentCreditOrder(order: { id: string; userId: string; orderNumber: string; assessmentTypeSnapshot: string | null; commercialConfig: unknown; paymentStatus: string; fulfillmentStatus: string; paidAt: Date | null }, source: string): Promise<FulfillmentResult> {
  const testType = reassessmentCreditType(order);
  if (!testType) throw new Error("FULFILLMENT_REASSESSMENT_CREDIT_CONFIGURATION_MISSING");
  const addOnProductId = order.commercialConfig && typeof order.commercialConfig === "object" && !Array.isArray(order.commercialConfig)
    ? String((order.commercialConfig as Record<string, unknown>).addOnProductId ?? "")
    : "";
  if (!addOnProductId) throw new Error("FULFILLMENT_REASSESSMENT_CREDIT_CONFIGURATION_MISSING");

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.commercialOrder.findUnique({ where: { id: order.id }, include: { fulfillment: true } });
    if (!current) throw new Error("ORDER_NOT_FOUND");
    if (current.paymentStatus !== "PAID") throw new Error("PAYMENT_NOT_PAID");
    const subjectId = current.subjectId ?? (await ensureOwnerSubject(current.userId)).id;
    if (current.fulfillmentStatus === "FULFILLED") return { granted: false, already: true };

    const claimed = await tx.commercialOrder.updateMany({
      where: { id: current.id, paymentStatus: "PAID", fulfillmentStatus: { in: ["NOT_STARTED", "FULFILLMENT_FAILED"] } },
      data: { fulfillmentStatus: "FULFILLMENT_PENDING" },
    });
    if (claimed.count !== 1) return { granted: false, already: true };

    await tx.commercialFulfillment.upsert({
      where: { orderId: current.id },
      create: { orderId: current.id, status: "FULFILLMENT_PENDING", attemptCount: 1 },
      update: { status: "FULFILLMENT_PENDING", attemptCount: { increment: 1 }, lastError: null },
    });

    const addOn = await tx.addOnProduct.findUnique({ where: { id: addOnProductId }, select: { id: true, status: true } });
    if (!addOn || addOn.status !== "ACTIVE") throw new Error("REASSESSMENT_CREDIT_PRODUCT_NOT_ACTIVE");

    const existingCredit = await tx.reassessmentCredit.findFirst({
      where: { userId: current.userId, subjectId, addOnProductId: addOn.id, testType, source: `MIDTRANS:${current.orderNumber}` },
      select: { id: true },
    });

    if (!existingCredit) {
      await tx.reassessmentCredit.create({
        data: {
          userId: current.userId,
          subjectId,
          addOnProductId: addOn.id,
          testType,
          status: "AVAILABLE",
          source: `MIDTRANS:${current.orderNumber}`,
          purchasedAt: current.paidAt ?? new Date(),
        },
      });
    }

    const fulfilledAt = new Date();
    await tx.commercialFulfillment.update({ where: { orderId: current.id }, data: { status: "FULFILLED", fulfilledAt, lastError: null } });
    await tx.commercialOrder.update({ where: { id: current.id }, data: { fulfillmentStatus: "FULFILLED", fulfilledAt, status: "COMPLETED" } });
    await tx.commercialAuditEvent.create({
      data: { orderId: current.id, action: "REASSESSMENT_CREDIT_GRANTED", fromState: "FULFILLMENT_PENDING", toState: "FULFILLED", source, reference: current.orderNumber, metadata: { addOnProductId: addOn.id, testType, duplicateCredit: Boolean(existingCredit) } },
    });
    return { granted: !existingCredit, already: false };
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    fulfillmentStatus: "FULFILLED",
    entitlementCount: result.granted ? 1 : 0,
    assessmentTypes: [testType],
    retryable: false,
  };
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

  if (reassessmentCreditType(order)) {
    return fulfillReassessmentCreditOrder(order, source);
  }

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
    const subjectId = current.subjectId ?? (await ensureOwnerSubject(current.userId)).id;
    const commercialConfig = current.commercialConfig && typeof current.commercialConfig === "object" && !Array.isArray(current.commercialConfig)
      ? current.commercialConfig as Record<string, unknown>
      : {};
    const isUpgradeOrder = commercialConfig.orderKind === "UPGRADE";
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
          subjectId_type_resourceType_resourceKey: {
            subjectId,
            type: definition.type as any,
            resourceType: definition.resourceType as any,
            resourceKey: definition.resourceKey,
          },
        },
        select: { id: true, usageLimit: true, usageConsumed: true, sourceOrderId: true },
      });

      if (existing) {
        if (isUpgradeOrder) {
          await tx.commercialAuditEvent.create({
            data: {
              orderId: current.id,
              action: "ENTITLEMENT_ALREADY_PRESENT",
              fromState: "ACTIVE",
              toState: "ACTIVE",
              source: "FULFILLMENT",
              reference: current.orderNumber,
              metadata: { entitlementId: existing.id, type: definition.type, resourceType: definition.resourceType, resourceKey: definition.resourceKey, upgrade: true },
            },
          });
        } else if (existingSourceOrderId(existing) === current.id) {
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
            subjectId,
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

/**
 * Resolve a consumable TEST_ACCESS entitlement at the runtime boundary.
 *
 * Rules:
 * - Completed assessments are never reopened without a new entitlement.
 * - A stale IN_PROGRESS/EXPIRED/ABANDONED attempt without a result may be
 *   retried because the assessment was not successfully completed.
 * - MEDIUM/ADVANCE bundle owners are reconciled here as a safety net so a
 *   historical V19 backfill/data-repair gap cannot strand a valid purchaser.
 * - The final entitlement claim is still compare-and-set in createAttempt(),
 *   so concurrent starts remain mutually exclusive.
 */
export async function findConsumableTestEntitlement(userId: string, testType: string, subjectId?: string, now = new Date()) {
  const activeSubjectId = subjectId ?? (await ensureOwnerSubject(userId)).id;
  const resourceKey = normalizeCoreTestType(testType);
  if (!resourceKey) throw new Error("INVALID_ASSESSMENT_TYPE");

  const prismaAssessmentType = resourceKey as PrismaAssessmentType;

  return prisma.$transaction(async (tx) => {
    // A completed result is the hard commercial boundary. Never recreate or
    // restore access before checking this, otherwise a missing entitlement
    // could accidentally reopen a completed assessment.
    const completed = await tx.assessmentAttempt.findFirst({
      where: {
        userId,
        subjectId: activeSubjectId,
        assessmentType: prismaAssessmentType,
        status: "COMPLETED",
        result: { isNot: null },
      },
      select: { id: true },
      orderBy: [{ completedAt: "desc" }, { startedAt: "desc" }],
    });
    const hasCompletedResult = Boolean(completed);

    let existing = await tx.userEntitlement.findFirst({
      where: {
        userId,
        subjectId: activeSubjectId,
        type: "TEST_ACCESS",
        resourceType: "TEST_TYPE",
        resourceKey,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, usageLimit: true, usageConsumed: true, resourceKey: true, sourceOrderId: true },
    });

    // V19.2 bundle reconciliation at the runtime boundary. If Learning
    // Preference access is missing, derive ownership from an existing active
    // MEDIUM/ADVANCE TEST_ACCESS entitlement for another core assessment.
    // This handles users whose bundle entitlement existed before V19.2 but
    // whose LP backfill was missed. It does NOT grant access from BASIC or
    // from a standalone test entitlement.
    if (!existing && !hasCompletedResult && ["WORK_ATTITUDE", "LEARNING_PREFERENCE"].includes(resourceKey)) {
      const bundleSibling = await tx.userEntitlement.findFirst({
        where: {
          userId,
          subjectId: activeSubjectId,
          type: "TEST_ACCESS",
          resourceType: "TEST_TYPE",
          resourceKey: { in: ["COGNITIVE", "EQ", "DISC", "RIASEC", "WORK_ATTITUDE"] },
          status: "ACTIVE",
          productId: { in: ["product-medium", "product-advance"] },
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        orderBy: [
          { productId: "desc" },
          { updatedAt: "desc" },
          { createdAt: "desc" },
        ],
        select: { productId: true, sourceOrderId: true, startsAt: true, endsAt: true },
      });

      if (bundleSibling?.productId) {
        const id = `v19_runtime_bundle_${resourceKey.toLowerCase()}_${userId.slice(0, 12)}`;
        await tx.userEntitlement.upsert({
          where: {
            subjectId_type_resourceType_resourceKey: {
              subjectId: activeSubjectId,
              type: "TEST_ACCESS",
              resourceType: "TEST_TYPE",
              resourceKey,
            },
          },
          create: {
            id,
            userId,
            productId: bundleSibling.productId,
            type: "TEST_ACCESS",
            resourceType: "TEST_TYPE",
            resourceKey,
            status: "ACTIVE",
            source: "V19_RUNTIME_BUNDLE_RECONCILIATION",
            sourceOrderId: bundleSibling.sourceOrderId,
            usageLimit: 1,
            usageConsumed: 0,
            startsAt: bundleSibling.startsAt,
            endsAt: bundleSibling.endsAt,
          },
          update: {},
        });
      }
    }

    // If the entitlement row is still missing, recover it from a paid+fulfilled
    // commercial order. MEDIUM/ADVANCE include both V19 assessment types;
    // BASIC only grants the specifically purchased single test.
    if (!existing && !hasCompletedResult && ["WORK_ATTITUDE", "LEARNING_PREFERENCE"].includes(resourceKey)) {
      const paidOrder = await tx.commercialOrder.findFirst({
        where: {
          userId,
          paymentStatus: "PAID",
          fulfillmentStatus: "FULFILLED",
          OR: [
            { productId: { in: ["product-medium", "product-advance"] } },
            { productId: "product-basic", assessmentTypeSnapshot: resourceKey },
          ],
        },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        select: { id: true, productId: true },
      }).catch(() => null);

      if (paidOrder) {
        const id = `v19_runtime_${resourceKey.toLowerCase()}_${userId.slice(0, 12)}`;
        await tx.userEntitlement.upsert({
          where: {
            subjectId_type_resourceType_resourceKey: {
              subjectId: activeSubjectId,
              type: "TEST_ACCESS",
              resourceType: "TEST_TYPE",
              resourceKey,
            },
          },
          create: {
            id,
            userId,
            productId: paidOrder.productId,
            type: "TEST_ACCESS",
            resourceType: "TEST_TYPE",
            resourceKey,
            status: "ACTIVE",
            source: "V19_RUNTIME_ORDER_RECONCILIATION",
            sourceOrderId: paidOrder.id,
            usageLimit: 1,
            usageConsumed: 0,
          },
          update: {},
        });
      }
    }

    let candidates = await tx.userEntitlement.findMany({
      where: {
        userId,
        subjectId: activeSubjectId,
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

    const available = candidates.find((candidate) => candidate.usageConsumed < candidate.usageLimit);
    if (available) return available;

    if (hasCompletedResult) return null;

    // Commercial rule: consuming TEST_ACCESS happens when an attempt is
    // successfully created, but the entitlement is only permanently spent
    // when the assessment reaches COMPLETED + result. If there is no completed
    // result, an exhausted entitlement must remain retryable. This deliberately
    // does not depend on the historical attempt status because older V19.2
    // repairs may have already changed IN_PROGRESS to EXPIRED/ABANDONED.
    //
    // This is also the recovery path for the exact failure mode that stranded
    // the V19.2 Learning Preference test: start consumed access, runtime failed
    // before the user could complete the assessment, and subsequent starts
    // returned TEST_ACCESS_REQUIRED forever.
    const exhausted = candidates.find((candidate) => candidate.usageConsumed > 0);
    if (exhausted) {
      const updated = await tx.userEntitlement.updateMany({
        where: {
          id: exhausted.id,
          userId,
          subjectId: activeSubjectId,
          type: "TEST_ACCESS",
          resourceType: "TEST_TYPE",
          resourceKey,
          status: "ACTIVE",
          usageConsumed: exhausted.usageConsumed,
        },
        data: { usageConsumed: { decrement: 1 } },
      });
      if (updated.count === 1) {
        return {
          id: exhausted.id,
          usageLimit: exhausted.usageLimit,
          usageConsumed: exhausted.usageConsumed - 1,
          resourceKey: exhausted.resourceKey,
          sourceOrderId: exhausted.sourceOrderId,
        };
      }
    }

    return null;
  });
}


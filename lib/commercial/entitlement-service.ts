import { prisma } from "../db/prisma";
import { ensureOwnerSubject } from "../subjects/service";
import {
  getSingleTestEntitlements,
  type CommercialTier,
  type EntitlementResourceType,
  type EntitlementType,
  type SingleTestType,
} from "./types";

export type EntitlementRef = {
  userId: string;
  subjectId?: string;
  type: EntitlementType;
  resourceType: EntitlementResourceType;
  resourceKey: string;
};

function activeWindow(now = new Date()) {
  return {
    status: "ACTIVE" as const,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };
}

async function resolveSubjectId(userId: string, subjectId?: string) {
  return subjectId ?? (await ensureOwnerSubject(userId)).id;
}

/**
 * Canonical Phase 3.1 access primitive.
 * Assessment/runtime code must call entitlement policy through this boundary
 * rather than checking Product/Tier directly.
 */
export async function hasEntitlement(
  ref: EntitlementRef,
  now = new Date(),
): Promise<boolean> {
  const [baseEntitlement, addOnEntitlement] = await Promise.all([
    prisma.userEntitlement.findFirst({
      where: {
        userId: ref.userId,
        ...(ref.subjectId ? { subjectId: ref.subjectId } : {}),
        type: ref.type,
        resourceType: ref.resourceType,
        resourceKey: ref.resourceKey,
        ...activeWindow(now),
      },
      select: { id: true },
    }),
    prisma.userAddOnEntitlement.findFirst({
      where: {
        userId: ref.userId,
        ...(ref.subjectId ? { subjectId: ref.subjectId } : {}),
        type: ref.type,
        resourceType: ref.resourceType,
        resourceKey: ref.resourceKey,
        ...activeWindow(now),
      },
      select: { id: true },
    }),
  ]);

  return Boolean(baseEntitlement || addOnEntitlement);
}

export async function hasAnyEntitlement(
  userId: string,
  refs: Omit<EntitlementRef, "userId">[],
  now = new Date(),
): Promise<boolean> {
  if (!refs.length) return false;

  const where = {
    userId,
    ...activeWindow(now),
    OR: refs.map((ref) => ({
      type: ref.type,
      resourceType: ref.resourceType,
      resourceKey: ref.resourceKey,
    })),
  };

  const [baseEntitlement, addOnEntitlement] = await Promise.all([
    prisma.userEntitlement.findFirst({ where, select: { id: true } }),
    prisma.userAddOnEntitlement.findFirst({ where, select: { id: true } }),
  ]);

  return Boolean(baseEntitlement || addOnEntitlement);
}

export async function hasTestAccess(
  userId: string,
  testType: string,
  now = new Date(),
  subjectId?: string,
) {
  return hasEntitlement(
    {
      userId,
      subjectId,
      type: "TEST_ACCESS",
      resourceType: "TEST_TYPE",
      resourceKey: testType.trim().toUpperCase(),
    },
    now,
  );
}

export async function hasAssessmentConfigurationAccess(
  userId: string,
  assessmentConfigurationId: string,
  now = new Date(),
) {
  return hasEntitlement(
    {
      userId,
      type: "TEST_ACCESS",
      resourceType: "ASSESSMENT_CONFIGURATION",
      resourceKey: assessmentConfigurationId,
    },
    now,
  );
}

export async function hasFeatureAccess(
  userId: string,
  type: Extract<
    EntitlementType,
    "PROFILE_ACCESS" | "REPORT_ACCESS" | "DIRECTION_ACCESS" | "MAJOR_FIT_ACCESS" | "CAREER_ACCESS"
  >,
  featureKey: string,
  now = new Date(),
  subjectId?: string,
) {
  return hasEntitlement(
    {
      userId,
      subjectId,
      type,
      resourceType: "FEATURE",
      resourceKey: featureKey,
    },
    now,
  );
}

export async function listUserEntitlements(
  userId: string,
  now = new Date(),
  subjectId?: string,
) {
  const [base, addOns] = await Promise.all([
    prisma.userEntitlement.findMany({
      where: { userId, ...(subjectId ? { subjectId } : {}), ...activeWindow(now) },
      orderBy: [{ type: "asc" }, { resourceType: "asc" }, { resourceKey: "asc" }],
      select: { id: true, productId: true, type: true, resourceType: true, resourceKey: true, source: true, sourceOrderId: true, usageLimit: true, usageConsumed: true, startsAt: true, endsAt: true },
    }),
    prisma.userAddOnEntitlement.findMany({
      where: { userId, ...(subjectId ? { subjectId } : {}), ...activeWindow(now) },
      orderBy: [{ type: "asc" }, { resourceType: "asc" }, { resourceKey: "asc" }],
      select: { id: true, addOnProductId: true, type: true, resourceType: true, resourceKey: true, source: true, startsAt: true, endsAt: true },
    }),
  ]);

  return [
    ...base.map((item) => ({ ...item, sourceKind: "PRODUCT" as const })),
    ...addOns.map((item) => ({ ...item, productId: null, sourceKind: "ADD_ON" as const })),
  ];
}

/**
 * Grants the complete entitlement bundle of a Product.
 *
 * This remains the canonical entitlement fulfillment primitive.
 * V4 L2 payment integrations may call it only after verified paid-order
 * fulfillment has been recorded on the ReadyScore side.
 */
export async function grantProductEntitlements(input: {
  userId: string;
  subjectId?: string;
  productId: string;
  source?: string;
  startsAt?: Date;
  endsAt?: Date;
}) {
  const subjectId = await resolveSubjectId(input.userId, input.subjectId);
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: { entitlements: true },
  });

  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  if (product.status !== "ACTIVE") throw new Error("PRODUCT_NOT_ACTIVE");

  const startsAt = input.startsAt ?? new Date();

  return prisma.$transaction(
    product.entitlements.map((entitlement) =>
      prisma.userEntitlement.upsert({
        where: {
          subjectId_type_resourceType_resourceKey: {
            subjectId,
            type: entitlement.type,
            resourceType: entitlement.resourceType,
            resourceKey: entitlement.resourceKey,
          },
        },
        create: {
          userId: input.userId,
          subjectId,
          productId: product.id,
          type: entitlement.type,
          resourceType: entitlement.resourceType,
          resourceKey: entitlement.resourceKey,
          source: input.source ?? "MANUAL",
          startsAt,
          endsAt: input.endsAt,
          status: "ACTIVE",
        },
        update: {
          productId: product.id,
          source: input.source ?? "MANUAL",
          startsAt,
          endsAt: input.endsAt,
          status: "ACTIVE",
        },
      }),
    ),
  );
}


/**
 * V4 L1 manual fulfillment primitive for the Single Test product.
 *
 * The product is BASIC, but its concrete test access is determined by the
 * customer's selected core test. This is deliberately separate from
 * grantProductEntitlements because BASIC has no fixed test bundle.
 *
 * Payment/checkout orchestration is outside L1 and is fulfilled by V4 L2
 * integrations only after a verified paid transaction.
 */
export async function grantSingleTestEntitlements(input: {
  userId: string;
  subjectId?: string;
  testType: SingleTestType;
  source?: string;
  startsAt?: Date;
  endsAt?: Date;
}) {
  const subjectId = await resolveSubjectId(input.userId, input.subjectId);
  const product = await prisma.product.findUnique({
    where: { tier: "BASIC" },
  });

  if (!product) throw new Error("SINGLE_TEST_PRODUCT_NOT_FOUND");
  if (product.status !== "ACTIVE") throw new Error("SINGLE_TEST_PRODUCT_NOT_ACTIVE");

  const entitlements = getSingleTestEntitlements(input.testType);
  const startsAt = input.startsAt ?? new Date();

  return prisma.$transaction(
    entitlements.map((entitlement) =>
      prisma.userEntitlement.upsert({
        where: {
          subjectId_type_resourceType_resourceKey: {
            subjectId,
            type: entitlement.type,
            resourceType: entitlement.resourceType,
            resourceKey: entitlement.resourceKey,
          },
        },
        create: {
          userId: input.userId,
          subjectId,
          productId: product.id,
          type: entitlement.type,
          resourceType: entitlement.resourceType,
          resourceKey: entitlement.resourceKey,
          source: input.source ?? "MANUAL_SINGLE_TEST",
          startsAt,
          endsAt: input.endsAt,
          status: "ACTIVE",
        },
        update: {
          productId: product.id,
          source: input.source ?? "MANUAL_SINGLE_TEST",
          startsAt,
          endsAt: input.endsAt,
          status: "ACTIVE",
        },
      }),
    ),
  );
}

export async function grantEntitlement(
  input: EntitlementRef & {
    productId?: string;
    source?: string;
    startsAt?: Date;
    endsAt?: Date;
  },
) {
  const subjectId = await resolveSubjectId(input.userId, input.subjectId);
  return prisma.userEntitlement.upsert({
    where: {
      subjectId_type_resourceType_resourceKey: {
        subjectId,
        type: input.type,
        resourceType: input.resourceType,
        resourceKey: input.resourceKey,
      },
    },
    create: {
      userId: input.userId,
      subjectId,
      productId: input.productId,
      type: input.type,
      resourceType: input.resourceType,
      resourceKey: input.resourceKey,
      source: input.source ?? "MANUAL",
      startsAt: input.startsAt ?? new Date(),
      endsAt: input.endsAt,
      status: "ACTIVE",
    },
    update: {
      productId: input.productId,
      source: input.source ?? "MANUAL",
      startsAt: input.startsAt ?? new Date(),
      endsAt: input.endsAt,
      status: "ACTIVE",
    },
  });
}

export async function revokeEntitlement(ref: EntitlementRef) {
  const subjectId = await resolveSubjectId(ref.userId, ref.subjectId);
  return prisma.userEntitlement.update({
    where: {
      subjectId_type_resourceType_resourceKey: {
        subjectId,
        type: ref.type,
        resourceType: ref.resourceType,
        resourceKey: ref.resourceKey,
      },
    },
    data: { status: "REVOKED" },
  });
}

/**
 * Returns the current commercial tier if a product entitlement points back
 * to one product. This is informational only; access decisions must continue
 * to use explicit entitlements.
 */
export async function getActiveProductsForUser(userId: string, subjectId?: string, now = new Date()) {
  const rows = await prisma.userEntitlement.findMany({
    where: {
      userId,
      ...(subjectId ? { subjectId } : {}),
      ...activeWindow(now),
      productId: { not: null },
    },
    distinct: ["productId"],
    select: {
      product: {
        select: {
          id: true,
          tier: true,
          name: true,
          status: true,
        },
      },
    },
  });

  return rows
    .map((row) => row.product)
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .map((product) => ({
      ...product,
      tier: product.tier as CommercialTier,
    }));
}


/**
 * Phase 3.12 manual fulfillment primitive.
 * This is deliberately NOT called by checkout/payment code because payment is deferred.
 */
export async function grantAddOnEntitlements(input: {
  userId: string;
  subjectId?: string;
  addOnProductId: string;
  source?: string;
  startsAt?: Date;
  endsAt?: Date;
}) {
  const subjectId = await resolveSubjectId(input.userId, input.subjectId);
  const addOn = await prisma.addOnProduct.findUnique({
    where: { id: input.addOnProductId },
    include: { entitlements: true },
  });

  if (!addOn) throw new Error("ADD_ON_PRODUCT_NOT_FOUND");
  if (addOn.status !== "ACTIVE") throw new Error("ADD_ON_PRODUCT_NOT_ACTIVE");

  const startsAt = input.startsAt ?? new Date();

  return prisma.$transaction(
    addOn.entitlements.map((entitlement) =>
      prisma.userAddOnEntitlement.upsert({
        where: {
          subjectId_type_resourceType_resourceKey: {
            subjectId,
            type: entitlement.type,
            resourceType: entitlement.resourceType,
            resourceKey: entitlement.resourceKey,
          },
        },
        create: {
          userId: input.userId,
          subjectId,
          addOnProductId: addOn.id,
          type: entitlement.type,
          resourceType: entitlement.resourceType,
          resourceKey: entitlement.resourceKey,
          source: input.source ?? "MANUAL_ADD_ON",
          startsAt,
          endsAt: input.endsAt,
          status: "ACTIVE",
        },
        update: {
          addOnProductId: addOn.id,
          source: input.source ?? "MANUAL_ADD_ON",
          startsAt,
          endsAt: input.endsAt,
          status: "ACTIVE",
        },
      }),
    ),
  );
}

/**
 * V19.2.1 customer-result reconciliation boundary.
 *
 * A completed assessment owned through an active TEST_ACCESS entitlement must
 * retain RESULT_ACCESS. This repairs historical Single Test / V19.2 data gaps
 * without granting access to users who never had test access.
 */
export async function reconcileCompletedResultAccess(userId: string) {
  const completedTypes = [
    "COGNITIVE",
    "EQ",
    "DISC",
    "RIASEC",
    "WORK_ATTITUDE",
    "LEARNING_PREFERENCE",
  ] as const;

  const completed = await prisma.assessmentAttempt.findMany({
    where: {
      userId,
      status: "COMPLETED",
      result: { isNot: null },
      assessmentType: { in: [...completedTypes] },
    },
    select: { assessmentType: true, completedAt: true, startedAt: true, subjectId: true },
    orderBy: [{ completedAt: "desc" }, { startedAt: "desc" }],
  });

  for (const attempt of completed) {
    const resourceKey = attempt.assessmentType;
    const testAccess = await prisma.userEntitlement.findUnique({
      where: {
        subjectId_type_resourceType_resourceKey: {
          subjectId: attempt.subjectId!,
          type: "TEST_ACCESS",
          resourceType: "TEST_TYPE",
          resourceKey,
        },
      },
      select: { id: true, productId: true, source: true, sourceOrderId: true, startsAt: true, endsAt: true, status: true },
    });

    if (!testAccess || testAccess.status !== "ACTIVE") continue;

    await prisma.userEntitlement.upsert({
      where: {
        subjectId_type_resourceType_resourceKey: {
          subjectId: attempt.subjectId!,
          type: "RESULT_ACCESS",
          resourceType: "TEST_TYPE",
          resourceKey,
        },
      },
      create: {
        userId,
        subjectId: attempt.subjectId!,
        productId: testAccess.productId,
        type: "RESULT_ACCESS",
        resourceType: "TEST_TYPE",
        resourceKey,
        status: "ACTIVE",
        source: "V19.2.1_COMPLETED_RESULT_RECONCILIATION",
        sourceOrderId: testAccess.sourceOrderId,
        usageLimit: 1,
        usageConsumed: 0,
        startsAt: testAccess.startsAt,
        endsAt: testAccess.endsAt,
      },
      update: {
        status: "ACTIVE",
        productId: testAccess.productId,
        sourceOrderId: testAccess.sourceOrderId,
        startsAt: testAccess.startsAt,
        endsAt: testAccess.endsAt,
      },
    });
  }
}

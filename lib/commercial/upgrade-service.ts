import { prisma } from "../db/prisma";
import { COMMERCIAL_PRODUCT_CATALOG, type CommercialTier } from "./types";
import { getActiveProductsForUser, listUserEntitlements } from "./entitlement-service";

export const UPGRADE_CONVERSION_VERSION = "V5_L9_UPGRADE_CONVERSION_V1";
export const UPGRADE_PRICING_STATUS = "PLANNING_HYPOTHESIS" as const;

// V5 L9 planning-price basis. These are differential-calculation inputs,
// not payment fulfillment or a new product catalog.
const SINGLE_TEST_PRICE_IDR = 99_000;
const ALL_TESTS_PRICE_IDR = 199_000;
const ALL_TESTS_PROFILING_PRICE_IDR = 249_000;

const UPGRADE_TARGETS = ["MEDIUM", "ADVANCE"] as const;
type UpgradeTarget = (typeof UPGRADE_TARGETS)[number];

const TIER_RANK: Record<CommercialTier, number> = {
  FREE: 0,
  BASIC: 1,
  MEDIUM: 2,
  ADVANCE: 3,
};

function productDefinition(tier: CommercialTier) {
  return COMMERCIAL_PRODUCT_CATALOG.find((item) => item.tier === tier);
}

function targetTier(value: unknown): UpgradeTarget | null {
  if (value === "MEDIUM" || value === "ADVANCE") return value;
  return null;
}

export async function getUpgradeQuote(userId: string, requestedTarget?: unknown) {
  const [products, entitlements, reassessmentCredits] = await Promise.all([
    getActiveProductsForUser(userId),
    listUserEntitlements(userId),
    prisma.reassessmentCredit.findMany({
      where: { userId, status: "AVAILABLE" },
      select: { id: true, testType: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const ownedProducts = products
    .filter((product) => product.tier !== "FREE")
    .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]);

  const current = ownedProducts[0] ?? null;
  const currentTier = current?.tier ?? null;
  const currentDefinition = currentTier ? productDefinition(currentTier) : null;

  const ownedCoreTests = [...new Set(
    entitlements
      .filter(
        (item) =>
          item.type === "TEST_ACCESS" &&
          item.resourceType === "TEST_TYPE" &&
          ["COGNITIVE", "EQ", "DISC", "RIASEC"].includes(item.resourceKey),
      )
      .map((item) => item.resourceKey),
  )].sort();

  const profilingUnlocked = entitlements.some(
    (item) =>
      item.type === "PROFILE_ACCESS" &&
      item.resourceType === "FEATURE" &&
      item.resourceKey === "CROSS_TEST_PROFILE_V1",
  );

  const requested = requestedTarget === undefined ? null : targetTier(requestedTarget);
  if (requestedTarget !== undefined && !requested) {
    return {
      eligible: false as const,
      code: "INVALID_UPGRADE_TARGET" as const,
      version: UPGRADE_CONVERSION_VERSION,
      pricingStatus: UPGRADE_PRICING_STATUS,
      currentTier,
      ownedCoreTests,
      profilingUnlocked,
      availableReassessmentCredits: reassessmentCredits.map((credit) => ({
        id: credit.id,
        testType: credit.testType,
        status: credit.status,
        transferableToUpgrade: false,
      })),
      options: [],
    };
  }

  if (!currentTier || !currentDefinition) {
    return {
      eligible: false as const,
      code: "INITIAL_PURCHASE_REQUIRED" as const,
      version: UPGRADE_CONVERSION_VERSION,
      pricingStatus: UPGRADE_PRICING_STATUS,
      currentTier: null,
      ownedCoreTests,
      profilingUnlocked,
      availableReassessmentCredits: reassessmentCredits.map((credit) => ({
        id: credit.id,
        testType: credit.testType,
        status: credit.status,
        transferableToUpgrade: false,
      })),
      options: [],
    };
  }

  const candidateTiers = UPGRADE_TARGETS.filter(
    (tier) => TIER_RANK[tier] > TIER_RANK[currentTier],
  );

  const dbProducts = await prisma.product.findMany({
    where: {
      tier: { in: [currentTier, ...candidateTiers] },
      status: "ACTIVE",
    },
    select: { id: true, tier: true, name: true, description: true, priceIdr: true },
  });

  const options = candidateTiers.map((tier) => {
    const target = dbProducts.find((item) => item.tier === tier);
    const definition = productDefinition(tier);
    const targetPlanningPrice =
      tier === "MEDIUM"
        ? ALL_TESTS_PRICE_IDR
        : ALL_TESTS_PROFILING_PRICE_IDR;
    const targetPrice = target?.priceIdr ?? definition?.planningPriceIdr ?? targetPlanningPrice;
    const currentDbProduct = dbProducts.find((item) => item.id === current.id);
    const currentPlanningPrice =
      currentTier === "BASIC"
        ? SINGLE_TEST_PRICE_IDR
        : currentTier === "MEDIUM"
          ? ALL_TESTS_PRICE_IDR
          : ALL_TESTS_PROFILING_PRICE_IDR;
    const currentPrice =
      currentDbProduct?.priceIdr ?? currentDefinition.planningPriceIdr ?? currentPlanningPrice;

    return {
      targetTier: tier,
      targetProductId: target?.id ?? definition?.id ?? null,
      targetName: target?.name ?? definition?.name ?? tier,
      targetPriceIdr: targetPrice,
      currentPriceIdr: currentPrice,
      differentialIdr:
        currentPrice !== null && targetPrice !== null
          ? Math.max(0, targetPrice - currentPrice)
          : null,
      paymentRequired: true,
      fulfillment: "Scalev/payment flow required",
    };
  });

  if (requested) {
    const selected = options.find((item) => item.targetTier === requested);
    if (!selected) {
      return {
        eligible: false as const,
        code: "UPGRADE_NOT_AVAILABLE" as const,
        version: UPGRADE_CONVERSION_VERSION,
        pricingStatus: UPGRADE_PRICING_STATUS,
        currentTier,
        ownedCoreTests,
        profilingUnlocked,
        availableReassessmentCredits: reassessmentCredits.map((credit) => ({
          id: credit.id,
          testType: credit.testType,
          status: credit.status,
          transferableToUpgrade: false,
        })),
        options,
      };
    }

    return {
      eligible: true as const,
      code: "UPGRADE_AVAILABLE" as const,
      version: UPGRADE_CONVERSION_VERSION,
      pricingStatus: UPGRADE_PRICING_STATUS,
      currentTier,
      currentProductId: current.id,
      ownedCoreTests,
      profilingUnlocked,
      availableReassessmentCredits: reassessmentCredits.map((credit) => ({
        id: credit.id,
        testType: credit.testType,
        status: credit.status,
        transferableToUpgrade: false,
      })),
      selected: {
        ...selected,
        differentialIdr: selected.differentialIdr,
      },
      options,
    };
  }

  return {
    eligible: options.length > 0,
    code: options.length ? "UPGRADE_AVAILABLE" as const : "ALREADY_MAX_TIER" as const,
    version: UPGRADE_CONVERSION_VERSION,
    pricingStatus: UPGRADE_PRICING_STATUS,
    currentTier,
    currentProductId: current.id,
    ownedCoreTests,
    profilingUnlocked,
    availableReassessmentCredits: reassessmentCredits.map((credit) => ({
      id: credit.id,
      testType: credit.testType,
      status: credit.status,
      transferableToUpgrade: false,
    })),
    options,
  };
}

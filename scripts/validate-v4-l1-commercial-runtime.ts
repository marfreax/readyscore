import { PrismaClient } from "@prisma/client";
import {
  COMMERCIAL_LAUNCH_TIERS,
  COMMERCIAL_PRODUCT_CATALOG,
  COMMERCIAL_ENTITLEMENT_MATRIX,
  SINGLE_TEST_TYPE_RESOURCE_MAP,
} from "../lib/commercial/types";

const prisma = new PrismaClient();

function fail(code: string, message: string): never {
  throw new Error(`${code}: ${message}`);
}

function key(item: {
  type: string;
  resourceType: string;
  resourceKey: string;
}) {
  return `${item.type}|${item.resourceType}|${item.resourceKey}`;
}

async function main() {
  try {
  console.log("=== READY SCORE V4 L1 COMMERCIAL RUNTIME GATE ===");
  console.log("Scope      : Customer-facing commercial catalog / entitlement runtime");
  console.log("Protection : No payment, checkout, Scalev, assessment, scoring, or result mutation");

  const products = await prisma.product.findMany({
    orderBy: { tier: "asc" },
    include: { entitlements: true },
  });

  const launchProducts = products.filter((product) =>
    (COMMERCIAL_LAUNCH_TIERS as readonly string[]).includes(product.tier),
  );

  if (launchProducts.length !== 3) {
    fail(
      "LAUNCH_PRODUCT_COUNT_MISMATCH",
      `Expected 3 launch products, received ${launchProducts.length}.`,
    );
  }

  const expectedPrices = {
    BASIC: 99_000,
    MEDIUM: 199_000,
    ADVANCE: 249_000,
  } as const;

  const expectedNames = {
    BASIC: "Single Test",
    MEDIUM: "All Tests",
    ADVANCE: "All Tests + Profiling",
  } as const;

  for (const tier of COMMERCIAL_LAUNCH_TIERS) {
    const product = launchProducts.find((item) => item.tier === tier);
    if (!product) fail("PRODUCT_MISSING", tier);

    if (product.priceIdr !== expectedPrices[tier]) {
      fail(
        "PRODUCT_PRICE_MISMATCH",
        `${tier}: expected ${expectedPrices[tier]}, received ${product.priceIdr}`,
      );
    }

    if (product.name !== expectedNames[tier]) {
      fail(
        "PRODUCT_NAME_MISMATCH",
        `${tier}: expected "${expectedNames[tier]}", received "${product.name}"`,
      );
    }

    if (product.status !== "ACTIVE") {
      fail("PRODUCT_NOT_ACTIVE", `${tier}: status=${product.status}`);
    }

    const expected = COMMERCIAL_ENTITLEMENT_MATRIX[tier].map(key).sort();
    const actual = product.entitlements.map(key).sort();

    if (expected.length !== actual.length) {
      fail(
        "ENTITLEMENT_MATRIX_COUNT_MISMATCH",
        `${tier}: expected ${expected.length}, received ${actual.length}`,
      );
    }

    for (let index = 0; index < expected.length; index += 1) {
      if (expected[index] !== actual[index]) {
        fail(
          "ENTITLEMENT_MATRIX_MISMATCH",
          `${tier}: expected ${expected[index]}, received ${actual[index]}`,
        );
      }
    }
  }

  const basic = launchProducts.find((item) => item.tier === "BASIC");
  if (!basic || basic.entitlements.length !== 0) {
    fail(
      "SINGLE_TEST_BUNDLE_FORBIDDEN",
      "BASIC / Single Test must not contain a fixed bundle of all tests.",
    );
  }

  const expectedCoreTestResources = Object.values(SINGLE_TEST_TYPE_RESOURCE_MAP).sort();
  const medium = launchProducts.find((item) => item.tier === "MEDIUM");
  const mediumResources = medium?.entitlements
    .filter((item) => item.type === "TEST_ACCESS")
    .map((item) => item.resourceKey)
    .sort();

  if (
    !mediumResources ||
    JSON.stringify(mediumResources) !== JSON.stringify(expectedCoreTestResources)
  ) {
    fail(
      "ALL_TESTS_RESOURCE_MISMATCH",
      `Expected ${expectedCoreTestResources.join(",")}, received ${mediumResources?.join(",") ?? "NONE"}`,
    );
  }

  const advance = launchProducts.find((item) => item.tier === "ADVANCE");
  if (!advance?.entitlements.some(
    (item) =>
      item.type === "PROFILE_ACCESS" &&
      item.resourceType === "FEATURE" &&
      item.resourceKey === "CROSS_TEST_PROFILE_V1",
  )) {
    fail("PROFILING_ENTITLEMENT_MISSING", "ADVANCE must include CROSS_TEST_PROFILE_V1.");
  }

  const free = products.find((product) => product.tier === "FREE");
  if (free?.status === "ACTIVE") {
    fail("FREE_LAUNCH_PRODUCT_ACTIVE", "FREE must remain hidden/retired from the primary paid launch catalog.");
  }

  console.log("Launch products          : BASIC / MEDIUM / ADVANCE");
  console.log("Pricing                  : 99k / 199k / 249k PASS");
  console.log("Single Test              : selected-test model PASS");
  console.log("All Tests                : IQ/EQ/DISC/RIASEC PASS");
  console.log("Profiling                : CROSS_TEST_PROFILE_V1 PASS");
  console.log("No Rp299k                : PASS");
  console.log("No standalone Rp150k     : PASS");
  console.log("Payment implementation   : NOT INCLUDED");
  console.log("Scalev integration       : NOT INCLUDED (V4 L2)");
  console.log("Assessment lifecycle     : NONE");
  console.log("V4 L1 COMMERCIAL RUNTIME GATE: PASS");
} catch (error) {
  console.error("V4 L1 COMMERCIAL RUNTIME GATE: FAIL");
  console.error(error);
  process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();

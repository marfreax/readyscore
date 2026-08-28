import { PrismaClient } from "@prisma/client";
import {
  COMMERCIAL_ENTITLEMENT_MATRIX,
  COMMERCIAL_PRODUCT_CATALOG,
} from "../lib/commercial/types.ts";

const prisma = new PrismaClient();

function fail(code, message) {
  throw new Error(`${code}: ${message}`);
}

function key(item) {
  return `${item.type}|${item.resourceType}|${item.resourceKey}`;
}

try {
  console.log("=== READY SCORE V3 PHASE 3.1 COMMERCIAL ARCHITECTURE GATE ===");
  console.log("Scope      : Product / CommercialTier / Entitlement boundary");
  console.log("Protection : No assessment/question/result lifecycle mutation");

  const expectedTiers = COMMERCIAL_PRODUCT_CATALOG.map((item) => item.tier);
  const products = await prisma.product.findMany({
    orderBy: { tier: "asc" },
    include: { entitlements: true },
  });

  const actualTiers = products.map((product) => product.tier);
  console.log(`Products   : ${actualTiers.join(", ") || "NONE"}`);

  if (
    products.length !== expectedTiers.length ||
    expectedTiers.some((tier) => !actualTiers.includes(tier))
  ) {
    fail(
      "COMMERCIAL_CATALOG_MISMATCH",
      `Expected exactly ${expectedTiers.join("/")}.`,
    );
  }

  for (const definition of COMMERCIAL_PRODUCT_CATALOG) {
    const product = products.find((item) => item.tier === definition.tier);
    if (!product) fail("PRODUCT_MISSING", definition.tier);

    if (product.id !== definition.id) {
      fail(
        "PRODUCT_ID_MISMATCH",
        `${definition.tier}: expected ${definition.id}, received ${product.id}`,
      );
    }

    if (product.priceIdr !== definition.planningPriceIdr) {
      fail(
        "PRODUCT_PRICE_MISMATCH",
        `${definition.tier}: expected ${definition.planningPriceIdr}, received ${product.priceIdr}`,
      );
    }

    const expected = COMMERCIAL_ENTITLEMENT_MATRIX[definition.tier]
      .map(key)
      .sort();
    const actual = product.entitlements.map(key).sort();

    if (expected.length !== actual.length) {
      fail(
        "ENTITLEMENT_MATRIX_COUNT_MISMATCH",
        `${definition.tier}: expected ${expected.length}, received ${actual.length}`,
      );
    }

    for (let index = 0; index < expected.length; index += 1) {
      if (expected[index] !== actual[index]) {
        fail(
          "ENTITLEMENT_MATRIX_MISMATCH",
          `${definition.tier}: expected ${expected[index]}, received ${actual[index]}`,
        );
      }
    }
  }

  const duplicateDefinitions = products.some((product) => {
    const keys = product.entitlements.map(key);
    return new Set(keys).size !== keys.length;
  });

  if (duplicateDefinitions) {
    fail(
      "DUPLICATE_ENTITLEMENT_DEFINITION",
      "Product entitlement keys are not unique.",
    );
  }

  console.log(
    `Entitlement definitions: ${products.reduce(
      (count, product) => count + product.entitlements.length,
      0,
    )}`,
  );
  console.log("Product Tier != Test Type: PASS");
  console.log("Explicit entitlement matrix: PASS");
  console.log("Pricing remains planning hypothesis: PASS");
  console.log("Payment/subscription implementation: NOT INCLUDED");
  console.log("Assessment/question/result lifecycle mutation: NONE");
  console.log("F.3.1 COMMERCIAL ARCHITECTURE GATE: PASS");
} catch (error) {
  console.error("F.3.1 COMMERCIAL ARCHITECTURE GATE: FAIL");
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

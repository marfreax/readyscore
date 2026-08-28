import { prisma } from "../db/prisma";
import {
  COMMERCIAL_ENTITLEMENT_MATRIX,
  COMMERCIAL_LAUNCH_TIERS,
  COMMERCIAL_PRODUCT_CATALOG,
  getSingleTestEntitlements,
  getSingleTestResourceKey,
  type CommercialTier,
  type SingleTestType,
} from "./types";

export const COMMERCIAL_ARCHITECTURE_VERSION = "V4_COMMERCIAL_L1";
export const COMMERCIAL_MATRIX_VERSION = "V4_COMMERCIAL_MATRIX_1";
export const COMMERCIAL_PRICING_STATUS = "PLANNING_HYPOTHESIS" as const;

export async function getCommercialCatalog() {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      tier: { in: [...COMMERCIAL_LAUNCH_TIERS] },
    },
    orderBy: { tier: "asc" },
    include: {
      entitlements: {
        orderBy: [
          { type: "asc" },
          { resourceType: "asc" },
          { resourceKey: "asc" },
        ],
      },
    },
  });

  return products.map((product) => {
    const definition = COMMERCIAL_PRODUCT_CATALOG.find(
      (item) => item.tier === product.tier,
    );

    return {
      id: product.id,
      tier: product.tier as CommercialTier,
      name: definition?.name ?? product.name,
      description: definition?.description ?? product.description,
      priceIdr: product.priceIdr,
      mode: definition?.mode ?? "LEGACY_FREE",
      customerFacing: definition?.customerFacing ?? false,
      selectableTestTypes: definition?.selectableTestTypes ?? [],
      entitlements: product.entitlements.map((entitlement) => ({
        type: entitlement.type,
        resourceType: entitlement.resourceType,
        resourceKey: entitlement.resourceKey,
      })),
    };
  });
}

export function getCommercialCatalogDefinition() {
  return COMMERCIAL_PRODUCT_CATALOG.filter((product) => product.customerFacing);
}

export function getCommercialEntitlementMatrix() {
  return COMMERCIAL_ENTITLEMENT_MATRIX;
}

export function resolveSingleTestSelection(testType: SingleTestType) {
  return {
    productTier: "BASIC" as const,
    testType,
    resourceKey: getSingleTestResourceKey(testType),
    entitlements: getSingleTestEntitlements(testType),
  };
}

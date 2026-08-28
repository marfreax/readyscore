import { prisma } from "../db/prisma";
import type { EntitlementResourceType, EntitlementType } from "./types";

export const B2C_CONVERSION_VERSION = "V3_B2C_CONVERSION_3.12";
export const B2C_ADD_ON_CATALOG_VERSION = "V3_B2C_ADD_ON_CATALOG_1";
export const B2C_PRICING_STATUS = "PLANNING_HYPOTHESIS" as const;

export type AddOnDefinition = {
  id: string;
  code: string;
  name: string;
  description: string;
  planningPriceIdr: number | null;
  entitlements: readonly {
    type: EntitlementType;
    resourceType: EntitlementResourceType;
    resourceKey: string;
  }[];
};

/**
 * Phase 3.12 add-ons are intentionally narrow access extensions.
 * They do not alter the locked Phase 3.1 product/tier matrix.
 * Prices are planning hypotheses only.
 */
export const B2C_ADD_ON_CATALOG: readonly AddOnDefinition[] = [
  {
    id: "addon-reassessment-credit-v1",
    code: "REASSESSMENT_CREDIT_V1",
    name: "Reassessment Credit",
    description: "One additional assessment attempt for an already unlocked test.",
    planningPriceIdr: 49_000,
    entitlements: [
      { type: "REASSESSMENT_CREDIT", resourceType: "FEATURE", resourceKey: "REASSESSMENT_CREDIT_V1" },
    ],
  },
  {
    id: "addon-riasec-v1",
    code: "RIASEC_V1",
    name: "RIASEC Interest Profile",
    description: "Add RIASEC assessment access and its result to an eligible account.",
    planningPriceIdr: 49_000,
    entitlements: [
      { type: "TEST_ACCESS", resourceType: "TEST_TYPE", resourceKey: "RIASEC" },
      { type: "RESULT_ACCESS", resourceType: "TEST_TYPE", resourceKey: "RIASEC" },
    ],
  },
  {
    id: "addon-cross-test-profile-v1",
    code: "CROSS_TEST_PROFILE_V1",
    name: "Cross-Test Profile",
    description: "Unlock synthesis of available assessment evidence without a universal score.",
    planningPriceIdr: 79_000,
    entitlements: [
      { type: "PROFILE_ACCESS", resourceType: "FEATURE", resourceKey: "CROSS_TEST_PROFILE_V1" },
    ],
  },
  {
    id: "addon-study-direction-v1",
    code: "STUDY_DIRECTION_V1",
    name: "Study Direction",
    description: "Unlock study-area exploration from available profile evidence.",
    planningPriceIdr: 99_000,
    entitlements: [
      { type: "DIRECTION_ACCESS", resourceType: "FEATURE", resourceKey: "STUDY_DIRECTION_V1" },
    ],
  },
  {
    id: "addon-major-fit-v1",
    code: "MAJOR_FIT_V1",
    name: "Major Fit",
    description: "Unlock correspondence exploration against defined major profiles.",
    planningPriceIdr: 99_000,
    entitlements: [
      { type: "MAJOR_FIT_ACCESS", resourceType: "FEATURE", resourceKey: "MAJOR_FIT_V1" },
    ],
  },
  {
    id: "addon-career-exploration-v1",
    code: "CAREER_EXPLORATION_V1",
    name: "Career Exploration",
    description: "Unlock exploration of career families from profile and direction evidence.",
    planningPriceIdr: 99_000,
    entitlements: [
      { type: "CAREER_ACCESS", resourceType: "FEATURE", resourceKey: "CAREER_EXPLORATION_V1" },
    ],
  },
  {
    id: "addon-advanced-report-v1",
    code: "ADVANCED_REPORT_V1",
    name: "Advanced Report",
    description: "Unlock the read-only advanced report experience.",
    planningPriceIdr: 79_000,
    entitlements: [
      { type: "REPORT_ACCESS", resourceType: "FEATURE", resourceKey: "ADVANCED_REPORT_V1" },
    ],
  },
] as const;

export async function getB2CAddOnCatalog() {
  const rows = await prisma.addOnProduct.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: { entitlements: true },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    priceIdr: row.priceIdr,
    entitlements: row.entitlements.map((item) => ({
      type: item.type,
      resourceType: item.resourceType,
      resourceKey: item.resourceKey,
    })),
  }));
}

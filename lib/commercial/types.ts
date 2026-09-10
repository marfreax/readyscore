export const COMMERCIAL_TIERS = {
  FREE: "FREE",
  BASIC: "BASIC",
  MEDIUM: "MEDIUM",
  ADVANCE: "ADVANCE",
} as const;

export type CommercialTier = (typeof COMMERCIAL_TIERS)[keyof typeof COMMERCIAL_TIERS];

export const COMMERCIAL_LAUNCH_TIERS = [
  "BASIC",
  "MEDIUM",
  "ADVANCE",
] as const satisfies readonly Exclude<CommercialTier, "FREE">[];

export type LaunchCommercialTier = (typeof COMMERCIAL_LAUNCH_TIERS)[number];

export const SINGLE_TEST_TYPES = [
  "IQ",
  "EQ",
  "DISC",
  "RIASEC",
] as const;

export type SingleTestType = (typeof SINGLE_TEST_TYPES)[number];

/**
 * Internal measurement identity mapping.
 * IQ remains a customer-facing commercial label for the cognitive product,
 * while the underlying TestType identity remains COGNITIVE.
 */
export const SINGLE_TEST_TYPE_RESOURCE_MAP = {
  IQ: "COGNITIVE",
  EQ: "EQ",
  DISC: "DISC",
  RIASEC: "RIASEC",
} as const;

export type CommercialProductMode =
  | "LEGACY_FREE"
  | "SINGLE_TEST"
  | "ALL_TESTS"
  | "ALL_TESTS_PROFILING";

export const ENTITLEMENT_TYPES = {
  TEST_ACCESS: "TEST_ACCESS",
  RESULT_ACCESS: "RESULT_ACCESS",
  PROFILE_ACCESS: "PROFILE_ACCESS",
  REPORT_ACCESS: "REPORT_ACCESS",
  DIRECTION_ACCESS: "DIRECTION_ACCESS",
  MAJOR_FIT_ACCESS: "MAJOR_FIT_ACCESS",
  CAREER_ACCESS: "CAREER_ACCESS",
  REASSESSMENT_CREDIT: "REASSESSMENT_CREDIT",
} as const;

export type EntitlementType =
  (typeof ENTITLEMENT_TYPES)[keyof typeof ENTITLEMENT_TYPES];

export const ENTITLEMENT_RESOURCE_TYPES = {
  TEST_TYPE: "TEST_TYPE",
  ASSESSMENT_CONFIGURATION: "ASSESSMENT_CONFIGURATION",
  FEATURE: "FEATURE",
} as const;

export type EntitlementResourceType =
  (typeof ENTITLEMENT_RESOURCE_TYPES)[keyof typeof ENTITLEMENT_RESOURCE_TYPES];

export type ProductDefinition = {
  id: string;
  tier: CommercialTier;
  name: string;
  description: string;
  planningPriceIdr: number | null;
  mode: CommercialProductMode;
  customerFacing: boolean;
  selectableTestTypes?: readonly SingleTestType[];
};

export type ProductEntitlementDefinition = {
  type: EntitlementType;
  resourceType: EntitlementResourceType;
  resourceKey: string;
  metadata?: Record<string, unknown>;
};

export const COMMERCIAL_PRODUCT_CATALOG: readonly ProductDefinition[] = [
  {
    id: "product-free",
    tier: "FREE",
    name: "Free Trial",
    description: "Legacy trial entry. Not part of the primary paid launch funnel.",
    planningPriceIdr: 0,
    mode: "LEGACY_FREE",
    customerFacing: false,
  },
  {
    id: "product-basic",
    tier: "BASIC",
    name: "Single Test",
    description: "Choose exactly one core assessment: IQ, EQ, DISC, or RIASEC.",
    planningPriceIdr: 99_000,
    mode: "SINGLE_TEST",
    customerFacing: true,
    selectableTestTypes: SINGLE_TEST_TYPES,
  },
  {
    id: "product-medium",
    tier: "MEDIUM",
    name: "All Tests",
    description: "IQ + EQ + DISC + RIASEC with the initial assessment entitlement for each.",
    planningPriceIdr: 199_000,
    mode: "ALL_TESTS",
    customerFacing: true,
  },
  {
    id: "product-advance",
    tier: "ADVANCE",
    name: "All Tests + Profiling",
    description: "All core tests plus Cross-Test Profiling and the personalized V15 report.",
    planningPriceIdr: 249_000,
    mode: "ALL_TESTS_PROFILING",
    customerFacing: true,
  },
] as const;

/**
 * V4 L1 — Commercial Runtime
 *
 * Product Tier is commercial packaging. Test Type remains measurement
 * identity. Single Test is therefore a product mode with a selected
 * test, not a fourth/fifth commercial tier.
 *
 * FREE remains in the internal catalog only as a legacy/architectural
 * placeholder and is not part of the primary paid launch catalog.
 */
export const COMMERCIAL_ENTITLEMENT_MATRIX: Record<
  CommercialTier,
  readonly ProductEntitlementDefinition[]
> = {
  FREE: [
    {
      type: "TEST_ACCESS",
      resourceType: "ASSESSMENT_CONFIGURATION",
      resourceKey: "free-v1",
    },
    {
      type: "RESULT_ACCESS",
      resourceType: "ASSESSMENT_CONFIGURATION",
      resourceKey: "free-v1",
    },
  ],

  // Single Test entitlements are resolved from the customer's selected
  // test. They must never be represented as a bundle of all four tests.
  BASIC: [],

  MEDIUM: [
    ...Object.values(SINGLE_TEST_TYPE_RESOURCE_MAP).flatMap((resourceKey) => [
      {
        type: "TEST_ACCESS" as const,
        resourceType: "TEST_TYPE" as const,
        resourceKey,
      },
      {
        type: "RESULT_ACCESS" as const,
        resourceType: "TEST_TYPE" as const,
        resourceKey,
      },
    ]),
  ],

  ADVANCE: [
    ...Object.values(SINGLE_TEST_TYPE_RESOURCE_MAP).flatMap((resourceKey) => [
      {
        type: "TEST_ACCESS" as const,
        resourceType: "TEST_TYPE" as const,
        resourceKey,
      },
      {
        type: "RESULT_ACCESS" as const,
        resourceType: "TEST_TYPE" as const,
        resourceKey,
      },
    ]),
    {
      type: "PROFILE_ACCESS",
      resourceType: "FEATURE",
      resourceKey: "CROSS_TEST_PROFILE_V1",
    },
  ],
};

export function getProductEntitlements(
  tier: CommercialTier,
): readonly ProductEntitlementDefinition[] {
  return COMMERCIAL_ENTITLEMENT_MATRIX[tier];
}

export function getSingleTestResourceKey(testType: SingleTestType): string {
  return SINGLE_TEST_TYPE_RESOURCE_MAP[testType];
}

export function getSingleTestEntitlements(
  testType: SingleTestType,
): readonly ProductEntitlementDefinition[] {
  const resourceKey = getSingleTestResourceKey(testType);

  return [
    {
      type: "TEST_ACCESS",
      resourceType: "TEST_TYPE",
      resourceKey,
    },
    {
      type: "RESULT_ACCESS",
      resourceType: "TEST_TYPE",
      resourceKey,
    },
  ];
}

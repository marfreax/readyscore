export const B2B_INSTITUTION_ARCHITECTURE_VERSION = "V3_B2B_INSTITUTION_3.13" as const;
export const B2B_INSTITUTION_CONTRACT_VERSION = "INSTITUTION_V1" as const;

export const INSTITUTION_ROLES = [
  "OWNER",
  "ADMIN",
  "COUNSELOR",
  "TEACHER",
  "STUDENT",
  "PARENT",
] as const;
export type InstitutionMemberRole = (typeof INSTITUTION_ROLES)[number];

export const INSTITUTION_MEMBERSHIP_STATUSES = [
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "LEFT",
] as const;
export type InstitutionMembershipStatus =
  (typeof INSTITUTION_MEMBERSHIP_STATUSES)[number];

export const INSTITUTION_ENTITLEMENT_STATUSES = [
  "ACTIVE",
  "REVOKED",
  "EXPIRED",
] as const;
export type InstitutionEntitlementStatus =
  (typeof INSTITUTION_ENTITLEMENT_STATUSES)[number];

export type InstitutionEntitlementRef = {
  institutionId: string;
  type:
    | "TEST_ACCESS"
    | "RESULT_ACCESS"
    | "PROFILE_ACCESS"
    | "REPORT_ACCESS"
    | "DIRECTION_ACCESS"
    | "MAJOR_FIT_ACCESS"
    | "CAREER_ACCESS"
    | "REASSESSMENT_CREDIT";
  resourceType: "TEST_TYPE" | "ASSESSMENT_CONFIGURATION" | "FEATURE";
  resourceKey: string;
};

export type InstitutionSummary = {
  contractVersion: typeof B2B_INSTITUTION_CONTRACT_VERSION;
  architectureVersion: typeof B2B_INSTITUTION_ARCHITECTURE_VERSION;
  institution: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
  membership: {
    role: InstitutionMemberRole;
    status: InstitutionMembershipStatus;
  };
  entitlements: Array<{
    type: InstitutionEntitlementRef["type"];
    resourceType: InstitutionEntitlementRef["resourceType"];
    resourceKey: string;
    status: InstitutionEntitlementStatus;
  }>;
};

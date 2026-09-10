/**
 * ReadyScore V11.0 — canonical Admin architecture/safety constants.
 *
 * This module deliberately contains no measurement/scoring implementation.
 * It is the code-level contract that later V11 phases should consume rather
 * than redefining the Admin safety vocabulary independently.
 */

export const V11_0_QUESTION_GROUPS = [
  { code: "DISC", label: "DISC" },
  { code: "RIASEC", label: "RIASEC" },
  { code: "COGNITIVE", label: "IQ & Cognitive" },
  { code: "EQ", label: "EQ" },
] as const;

export type V11QuestionGroupCode = (typeof V11_0_QUESTION_GROUPS)[number]["code"];

export const V11_0_LIFECYCLE = [
  "CREATE",
  "VALIDATE",
  "REVIEW",
  "APPROVE",
  "VERSION",
  "PUBLISH",
  "ACTIVATE",
] as const;

export const V11_0_PROTECTED_SEMANTICS = [
  "SCORING_SEMANTICS",
  "DIMENSION_INTERPRETATION",
  "PROFILE_CONSTRUCTION",
  "CLASSIFICATION_LOGIC",
  "UNIVERSAL_SCORE",
  "RAW_AVERAGE_SYNTHESIS",
  "PSYCHOMETRIC_MEANING",
  "HISTORICAL_RESULTS",
  "HISTORICAL_ATTEMPTS",
  "ENTITLEMENT",
] as const;

export const V11_0_CUSTOMER_IMPACT_CLASSES = [
  "FUTURE_ATTEMPTS",
  "IN_PROGRESS_ATTEMPTS",
  "HISTORICAL_ATTEMPTS",
  "HISTORICAL_RESULTS",
  "ENTITLEMENT",
] as const;

export function isV11QuestionGroupCode(value: string): value is V11QuestionGroupCode {
  return V11_0_QUESTION_GROUPS.some((group) => group.code === value);
}

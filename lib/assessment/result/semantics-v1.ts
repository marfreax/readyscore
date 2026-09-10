import type { AssessmentResult } from "../types";

export const RESULT_SEMANTICS_VERSION = "RESULT_SEMANTICS_V1" as const;

export type ResultSemanticMode = "ABILITY_PROFILE" | "CONSTRUCT_SCORE" | "IPSATIVE_PROFILE" | "INTEREST_PROFILE";

export type AssessmentResultSemantics = {
  readonly assessmentType: "COGNITIVE" | "EQ" | "DISC" | "RIASEC";
  readonly mode: ResultSemanticMode;
  readonly mainResult: string;
  readonly dimensions: readonly string[];
  readonly scoreMeaning: string;
  readonly customerSummaryRule: string;
  readonly prohibitedInterpretation: readonly string[];
  readonly interpretationVersion: string;
  readonly resultContractVersion: string;
};

export const RESULT_SEMANTICS: Readonly<Record<AssessmentResultSemantics["assessmentType"], AssessmentResultSemantics>> = {
  COGNITIVE: {
    assessmentType: "COGNITIVE",
    mode: "ABILITY_PROFILE",
    mainResult: "Cognitive Score",
    dimensions: ["VERBAL_REASONING", "NUMERICAL_REASONING", "LOGICAL_REASONING", "ABSTRACT_REASONING"],
    scoreMeaning: "Normalized performance score across the V2 objective cognitive item set.",
    customerSummaryRule: "Describe relative performance across the four reasoning dimensions; do not label the result IQ.",
    prohibitedInterpretation: ["IQ", "clinical diagnosis", "deterministic academic or career decision"],
    interpretationVersion: "COGNITIVE_INTERPRETATION_V2",
    resultContractVersion: "COGNITIVE_RESULT_V2",
  },
  EQ: {
    assessmentType: "EQ",
    mode: "CONSTRUCT_SCORE",
    mainResult: "EQ Score",
    dimensions: ["EMOTION_AWARENESS", "EMOTION_REGULATION", "EMPATHY_SOCIAL_AWARENESS", "RELATIONSHIP_SOCIAL_RESPONSE"],
    scoreMeaning: "0–100 summary derived from item-specific keyed ordinal responses across four EQ dimensions.",
    customerSummaryRule: "Describe relative response patterns to the presented situations; do not present the result as a clinical or standardized population norm.",
    prohibitedInterpretation: ["clinical diagnosis", "standardized population EQ norm", "deterministic academic or career decision"],
    interpretationVersion: "EQ_INTERPRETATION_V2",
    resultContractVersion: "EQ_RESULT_V2",
  },
  DISC: {
    assessmentType: "DISC",
    mode: "IPSATIVE_PROFILE",
    mainResult: "Primary Behavioral Pattern",
    dimensions: ["D", "I", "S", "C"],
    scoreMeaning: "Ipsative share of forced choices mapped to each behavioral dimension; the four shares sum to 100.",
    customerSummaryRule: "Describe primary/secondary behavioral response tendencies and the D/I/S/C relative profile; do not present the compatibility overallScore as a substantive universal score.",
    prohibitedInterpretation: ["aptitude", "intelligence", "clinical diagnosis", "deterministic career or major decision", "universal score"],
    interpretationVersion: "DISC_INTERPRETATION_V2",
    resultContractVersion: "DISC_RESULT_V2",
  },
  RIASEC: {
    assessmentType: "RIASEC",
    mode: "INTEREST_PROFILE",
    mainResult: "RIASEC Interest Profile",
    dimensions: ["R", "I", "A", "S", "E", "C"],
    scoreMeaning: "Relative vocational-interest preference scores across six RIASEC dimensions.",
    customerSummaryRule: "Describe relative interest patterns and topCode as an exploration aid; do not imply ability or guaranteed career fit.",
    prohibitedInterpretation: ["ability", "intelligence", "guaranteed career fit", "guaranteed major suitability", "universal score"],
    interpretationVersion: "RIASEC_INTERPRETATION_V2",
    resultContractVersion: "RIASEC_RESULT_V2",
  },
} as const;

function fail(message: string): never {
  throw new Error(`Result semantics validation failed: ${message}`);
}

export function getResultSemantics(testType: string): AssessmentResultSemantics {
  const key = testType.trim().toUpperCase() as AssessmentResultSemantics["assessmentType"];
  const semantics = RESULT_SEMANTICS[key];
  if (!semantics) fail(`unsupported assessment type "${testType}"`);
  return semantics;
}

/**
 * V8.8 is presentation/meaning governance only. It does not rescore an attempt.
 * It validates that an already-produced result is interpreted under the same
 * assessment-specific contract/version that produced the measurement.
 */
export function validateResultSemantics(result: AssessmentResult): void {
  const semantics = getResultSemantics(result.assessmentType);

  if (semantics.assessmentType === "COGNITIVE") {
    if (result.scoringVersion !== "COGNITIVE_SCORE_V2") fail("Cognitive scoring version mismatch.");
    if (result.cognitive?.contractVersion !== "COGNITIVE_RESULT_V2") fail("Cognitive result contract mismatch.");
    if (result.interpretation?.interpretationVersion !== semantics.interpretationVersion) fail("Cognitive interpretation version mismatch.");
  }

  if (semantics.assessmentType === "EQ") {
    if (result.scoringVersion !== "EQ_SCORE_V2") fail("EQ scoring version mismatch.");
    if (result.eq?.contractVersion !== "EQ_RESULT_V2") fail("EQ result contract mismatch.");
    if (result.interpretation?.interpretationVersion !== semantics.interpretationVersion) fail("EQ interpretation version mismatch.");
  }

  if (semantics.assessmentType === "DISC") {
    if (result.scoringVersion !== "DISC_SCORE_V2") fail("DISC scoring version mismatch.");
    const disc = result.disc;
    if (!disc || disc.contractVersion !== "DISC_RESULT_V2") fail("DISC result contract mismatch.");
    if (result.interpretation?.interpretationVersion !== semantics.interpretationVersion) fail("DISC interpretation version mismatch.");
    if (disc.measurement.profileModel !== "IPSATIVE_FORCED_CHOICE") fail("DISC profile model mismatch.");
  }

  if (semantics.assessmentType === "RIASEC") {
    if (result.scoringVersion !== "RIASEC_SCORE_V2") fail("RIASEC scoring version mismatch.");
    if (result.riasec?.contractVersion !== "RIASEC_RESULT_V2") fail("RIASEC result contract mismatch.");
    if (result.interpretation?.interpretationVersion !== semantics.interpretationVersion) fail("RIASEC interpretation version mismatch.");
  }
}

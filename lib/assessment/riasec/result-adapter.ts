import type { AssessmentResult, ScoreBand } from "../types";
import type { RiasecResult } from "./types";

export type RiasecResultMetadata = {
  attemptId: string;
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  taxonomyVersion: string;
  scoringVersion: string;
  completedAt: string;
};

function toBand(score: number): ScoreBand {
  if (score >= 90) return "UNGGUL";
  if (score >= 80) return "SANGAT_BAIK";
  if (score >= 70) return "BAIK";
  if (score >= 60) return "CUKUP";
  return "PERLU_PENGEMBANGAN";
}

/**
 * Maps the RIASEC measurement into the ACTUAL v2 AssessmentResult contract.
 *
 * RIASEC-specific fields are not fabricated into AssessmentResult.
 * The complete RiasecResult remains separately attached by the runtime
 * dispatch boundary under the versioned `riasec` payload.
 */
export function toAssessmentResult(
  result: RiasecResult,
  metadata: RiasecResultMetadata,
): AssessmentResult {
  const measured = result.dimensionScores.filter(
    (item) => item.score !== null && item.answeredCount > 0,
  );

  const weighted = measured.reduce(
    (sum, item) => sum + (item.score ?? 0) * item.answeredCount,
    0,
  );
  const denominator = measured.reduce(
    (sum, item) => sum + item.answeredCount,
    0,
  );
  const overallScore =
    denominator > 0
      ? Number((weighted / denominator).toFixed(2))
      : 0;

  return {
    attemptId: metadata.attemptId,
    assessmentType: "RIASEC",
    assessmentConfigurationVersion: metadata.assessmentConfigurationVersion,
    questionBankVersion: metadata.questionBankVersion,
    taxonomyVersion: metadata.taxonomyVersion,
    scoringVersion: metadata.scoringVersion,
    overallScore,
    band: toBand(overallScore),
    status: result.isComplete ? "COMPLETE" : "PARTIAL",

    domainScores: result.dimensionScores.map((item) => ({
      domainId: item.dimension,
      score: item.score ?? 0,
      questionCount: item.questionCount,
      weightTotal: item.questionCount,
      scoredSubdomainCount: 0,
      totalSubdomainCount: 0,
      sufficient: item.sufficient,
    })),

    subdomainScores: [],
    indicatorScores: [],

    coverage: result.dimensionScores.map((item) => ({
      domainId: item.dimension,
      answeredIndicators: item.answeredCount,
      totalIndicators: item.questionCount,
      percentage:
        item.questionCount > 0
          ? Number(((item.answeredCount / item.questionCount) * 100).toFixed(2))
          : 0,
    })),

    dataSufficiency: {
      scoredDomains: result.measuredDimensionCount,
      totalDomains: 6,
      requiredDomains: 6,
      percentage: result.coveragePercent,
    },

    completedAt: metadata.completedAt,
  };
}

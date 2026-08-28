import type { RiasecResult } from "../../assessment/riasec/types";
import type { CrossTestProfileInput, ProfileSignalAdapter, ProfileConfidence } from "../types";

const NAMES: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

function confidenceFor(measurement: RiasecResult): ProfileConfidence {
  if (measurement.isComplete && measurement.coveragePercent >= 100) return "HIGH";
  if (measurement.measuredDimensionCount > 0 && measurement.coveragePercent >= 80) return "MODERATE";
  return "LIMITED";
}

export const riasecProfileAdapter: ProfileSignalAdapter = {
  testType: "RIASEC",
  extract(input) {
    const payload = input.testSpecific as { measurement?: RiasecResult } | undefined;
    const measurement = payload?.measurement;
    if (!measurement || measurement.testType !== "RIASEC") {
      return {
        signals: [],
        source: {
          testType: input.result.assessmentType,
          attemptId: input.result.attemptId,
          status: "INSUFFICIENT",
          confidence: "LIMITED",
          resultContractVersion: input.result.interpretation?.contractVersion,
          scoringVersion: input.result.scoringVersion,
          interpretationVersion: input.result.interpretation?.interpretationVersion,
          excludedSignalCount: 0,
          exclusionReasons: ["RIASEC_RESULT_V1 measurement payload is missing or invalid."],
        },
      };
    }

    const confidence = confidenceFor(measurement);
    const signals = measurement.dimensionScores.map((item) => ({
      signalId: `riasec:${input.result.attemptId}:${item.dimension}`,
      domain: "INTEREST" as const,
      construct: "Vocational Interest",
      dimension: item.dimension,
      label: NAMES[item.dimension] ?? item.dimension,
      score: item.score,
      scoreScale: "PRESENTATION_0_100" as const,
      scoreSemantics: "INTEREST" as const,
      status: item.sufficient ? "AVAILABLE" as const : item.answeredCount > 0 ? "PARTIAL" as const : "INSUFFICIENT" as const,
      confidence,
      sourceTestType: "RIASEC",
      sourceResultAttemptId: input.result.attemptId,
      sourceResultContractVersion: input.result.interpretation?.contractVersion ?? "RIASEC_RESULT_V1",
      sourceScoringVersion: measurement.scoringVersion,
      sourceInterpretationVersion: input.result.interpretation?.interpretationVersion,
    }));

    return {
      signals,
      source: {
        testType: "RIASEC",
        attemptId: input.result.attemptId,
        status: measurement.isComplete ? "AVAILABLE" : measurement.measuredDimensionCount > 0 ? "PARTIAL" : "INSUFFICIENT",
        confidence,
        resultContractVersion: input.result.interpretation?.contractVersion ?? "RIASEC_RESULT_V1",
        scoringVersion: measurement.scoringVersion,
        interpretationVersion: input.result.interpretation?.interpretationVersion,
        excludedSignalCount: 0,
        exclusionReasons: [],
      },
    };
  },
};

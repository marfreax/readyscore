import type { CognitiveDimension, CognitiveMeasurement } from "../../assessment/cognitive/scoring";
import type { CrossTestProfileInput, ProfileConfidence, ProfileSignalAdapter } from "../types";

const LABELS: Record<CognitiveDimension, string> = {
  VERBAL_REASONING: "Verbal Reasoning",
  NUMERICAL_REASONING: "Numerical Reasoning",
  LOGICAL_REASONING: "Logical Reasoning",
  ABSTRACT_REASONING: "Abstract Reasoning",
};

function confidenceFor(measurement: CognitiveMeasurement): ProfileConfidence {
  return measurement.dimensionScores.every((item) => item.answeredCount === item.questionCount)
    ? "MODERATE"
    : "LIMITED";
}

export const cognitiveProfileAdapter: ProfileSignalAdapter = {
  testType: "COGNITIVE",
  extract(input) {
    const payload = input.testSpecific as { measurement?: CognitiveMeasurement } | undefined;
    const measurement = payload?.measurement;
    if (!measurement || measurement.testType !== "COGNITIVE" || measurement.dimensionScores.length !== 4) {
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
          exclusionReasons: ["COGNITIVE_RESULT_V1 measurement payload is missing or invalid."],
        },
      };
    }

    const confidence = confidenceFor(measurement);
    const signals = measurement.dimensionScores.map((item) => ({
      signalId: `cognitive:${input.result.attemptId}:${item.dimension}`,
      domain: "ABILITY" as const,
      construct: "Cognitive Reasoning Profile",
      dimension: item.dimension,
      label: LABELS[item.dimension],
      score: item.score,
      scoreScale: "PRESENTATION_0_100" as const,
      scoreSemantics: "ABILITY" as const,
      status: item.answeredCount === item.questionCount ? "AVAILABLE" as const : item.answeredCount > 0 ? "PARTIAL" as const : "INSUFFICIENT" as const,
      confidence,
      sourceTestType: "COGNITIVE",
      sourceResultAttemptId: input.result.attemptId,
      sourceResultContractVersion: input.result.interpretation?.contractVersion ?? "COGNITIVE_RESULT_V1",
      sourceScoringVersion: measurement.scoringVersion,
      sourceInterpretationVersion: input.result.interpretation?.interpretationVersion,
    }));

    return {
      signals,
      source: {
        testType: "COGNITIVE",
        attemptId: input.result.attemptId,
        status: "AVAILABLE",
        confidence,
        resultContractVersion: input.result.interpretation?.contractVersion ?? "COGNITIVE_RESULT_V1",
        scoringVersion: measurement.scoringVersion,
        interpretationVersion: input.result.interpretation?.interpretationVersion,
        excludedSignalCount: 0,
        exclusionReasons: [],
      },
    };
  },
};

import type { DiscDimension, DiscMeasurement } from "../../assessment/disc/scoring";
import type { CrossTestProfileInput, ProfileConfidence, ProfileSignalAdapter } from "../types";

const LABELS: Record<DiscDimension, string> = {
  D: "Dominance",
  I: "Influence",
  S: "Steadiness",
  C: "Conscientiousness",
};

function confidenceFor(measurement: DiscMeasurement): ProfileConfidence {
  return measurement.dimensionScores.every((item) => item.answeredCount === item.questionCount)
    ? "MODERATE"
    : "LIMITED";
}

export const discProfileAdapter: ProfileSignalAdapter = {
  testType: "DISC",
  extract(input) {
    const payload = input.testSpecific as { measurement?: DiscMeasurement } | undefined;
    const measurement = payload?.measurement;
    if (!measurement || measurement.testType !== "DISC") {
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
          exclusionReasons: ["DISC_RESULT_V1 measurement payload is missing or invalid."],
        },
      };
    }

    const confidence = confidenceFor(measurement);
    const signals = measurement.dimensionScores.map((item) => ({
      signalId: `disc:${input.result.attemptId}:${item.dimension}`,
      domain: "BEHAVIOR" as const,
      construct: "Behavioral Pattern",
      dimension: item.dimension,
      label: LABELS[item.dimension],
      score: item.score,
      scoreScale: "PRESENTATION_0_100" as const,
      scoreSemantics: "TRAIT" as const,
      status: item.answeredCount === item.questionCount ? "AVAILABLE" as const : item.answeredCount > 0 ? "PARTIAL" as const : "INSUFFICIENT" as const,
      confidence,
      sourceTestType: "DISC",
      sourceResultAttemptId: input.result.attemptId,
      sourceResultContractVersion: input.result.interpretation?.contractVersion ?? "DISC_RESULT_V1",
      sourceScoringVersion: measurement.scoringVersion,
      sourceInterpretationVersion: input.result.interpretation?.interpretationVersion,
    }));

    return {
      signals,
      source: {
        testType: "DISC",
        attemptId: input.result.attemptId,
        status: "AVAILABLE",
        confidence,
        resultContractVersion: input.result.interpretation?.contractVersion ?? "DISC_RESULT_V1",
        scoringVersion: measurement.scoringVersion,
        interpretationVersion: input.result.interpretation?.interpretationVersion,
        excludedSignalCount: 0,
        exclusionReasons: [],
      },
    };
  },
};

import type { CrossTestProfileInput, ProfileConfidence, ProfileSignalAdapter } from "../types";

type LearningPreferenceDimension = {
  dimension: "VISUAL" | "AUDITORY" | "KINESTHETIC";
  score: number;
  percentage: number;
  answeredCount: number;
  questionCount: number;
};

const LABELS: Record<LearningPreferenceDimension["dimension"], string> = {
  VISUAL: "Visual",
  AUDITORY: "Auditory",
  KINESTHETIC: "Kinesthetic",
};

function confidenceFor(dimensions: LearningPreferenceDimension[]): ProfileConfidence {
  return dimensions.every((item) => item.answeredCount === item.questionCount) ? "MODERATE" : "LIMITED";
}

export const learningPreferenceProfileAdapter: ProfileSignalAdapter = {
  testType: "LEARNING_PREFERENCE",
  extract(input) {
    const payload = input.testSpecific as {
      measurement?: { testType?: string; dimensionScores?: LearningPreferenceDimension[] };
    } | undefined;
    const measurement = payload?.measurement;
    const dimensions = measurement?.dimensionScores;

    if (!measurement || measurement.testType !== "LEARNING_PREFERENCE" || !Array.isArray(dimensions) || dimensions.length !== 3) {
      return {
        signals: [],
        source: {
          testType: input.result.assessmentType,
          attemptId: input.result.attemptId,
          status: "INSUFFICIENT",
          confidence: "LIMITED",
          resultContractVersion: input.result.interpretation?.contractVersion ?? "TEST_RESULT_V1",
          scoringVersion: input.result.scoringVersion,
          interpretationVersion: input.result.interpretation?.interpretationVersion,
          excludedSignalCount: 0,
          exclusionReasons: ["LEARNING_PREFERENCE_RESULT_V1 measurement payload is missing or invalid."],
        },
      };
    }

    const confidence = confidenceFor(dimensions);
    const signals = dimensions.map((item) => ({
      signalId: `learning-preference:${input.result.attemptId}:${item.dimension}`,
      domain: "LEARNING" as const,
      construct: "Learning Preference",
      dimension: item.dimension,
      label: LABELS[item.dimension],
      score: item.percentage,
      scoreScale: "PRESENTATION_0_100" as const,
      scoreSemantics: "PREFERENCE" as const,
      status: item.answeredCount === item.questionCount ? "AVAILABLE" as const : item.answeredCount > 0 ? "PARTIAL" as const : "INSUFFICIENT" as const,
      confidence,
      sourceTestType: "LEARNING_PREFERENCE",
      sourceResultAttemptId: input.result.attemptId,
      sourceResultContractVersion: input.result.interpretation?.contractVersion ?? "TEST_RESULT_V1",
      sourceScoringVersion: input.result.scoringVersion,
      sourceInterpretationVersion: input.result.interpretation?.interpretationVersion,
    }));

    return {
      signals,
      source: {
        testType: "LEARNING_PREFERENCE",
        attemptId: input.result.attemptId,
        status: signals.every((signal) => signal.status === "AVAILABLE") ? "AVAILABLE" : "PARTIAL",
        confidence,
        resultContractVersion: input.result.interpretation?.contractVersion ?? "TEST_RESULT_V1",
        scoringVersion: input.result.scoringVersion,
        interpretationVersion: input.result.interpretation?.interpretationVersion,
        excludedSignalCount: 0,
        exclusionReasons: [],
      },
    };
  },
};

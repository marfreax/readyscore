import type { EqMeasurement } from "../../assessment/eq/scoring";
import type {
  CrossTestProfileInput,
  ProfileConfidence,
  ProfileSignalAdapter,
} from "../types";

const LABELS: Record<string, string> = {
  EMOTION_AWARENESS: "Emotion Awareness",
  EMOTION_REGULATION: "Emotion Regulation",
  EMPATHY_SOCIAL_AWARENESS: "Empathy & Social Awareness",
  RELATIONSHIP_SOCIAL_RESPONSE: "Relationship & Social Response",
};

function confidenceFor(measurement: EqMeasurement): ProfileConfidence {
  const totalQuestions = measurement.dimensionScores.reduce(
    (sum, item) => sum + item.questionCount,
    0,
  );
  const answeredQuestions = measurement.dimensionScores.reduce(
    (sum, item) => sum + item.answeredCount,
    0,
  );

  if (totalQuestions > 0 && answeredQuestions === totalQuestions) return "HIGH";
  if (answeredQuestions > 0 && answeredQuestions / Math.max(totalQuestions, 1) >= 0.8) {
    return "MODERATE";
  }
  return "LIMITED";
}

export const eqProfileAdapter: ProfileSignalAdapter = {
  testType: "EQ",

  extract(input) {
    const payload = input.testSpecific as
      | { measurement?: EqMeasurement }
      | EqMeasurement
      | undefined;

    const measurement =
      payload && "dimensionScores" in payload
        ? payload
        : payload && "measurement" in payload
          ? payload.measurement
          : undefined;

    if (!measurement || !Array.isArray(measurement.dimensionScores)) {
      return {
        signals: [],
        source: {
          testType: input.result.assessmentType,
          attemptId: input.result.attemptId,
          status: "INSUFFICIENT",
          confidence: "LIMITED",
          resultContractVersion:
            input.result.interpretation?.contractVersion ?? "EQ_RESULT_V1",
          scoringVersion: input.result.scoringVersion,
          interpretationVersion:
            input.result.interpretation?.interpretationVersion,
          excludedSignalCount: 0,
          exclusionReasons: ["EQ_RESULT_V1 measurement payload is missing or invalid."],
        },
      };
    }

    // EqMeasurement itself intentionally contains no scoringVersion.
    // The immutable result envelope is the authoritative source for it.
    const scoringVersion = input.result.scoringVersion;
    const confidence = confidenceFor(measurement);

    const signals = measurement.dimensionScores.map((item) => ({
      signalId: `eq:${input.result.attemptId}:${item.dimension}`,
      domain: "EMOTIONAL" as const,
      construct: "Emotional / Social Profile",
      dimension: item.dimension,
      label: LABELS[item.dimension] ?? item.dimension,
      score: item.score,
      scoreScale: "PRESENTATION_0_100" as const,
      scoreSemantics: "TRAIT" as const,
      status:
        item.answeredCount >= item.questionCount
          ? "AVAILABLE" as const
          : item.answeredCount > 0
            ? "PARTIAL" as const
            : "INSUFFICIENT" as const,
      confidence,
      sourceTestType: "EQ",
      sourceResultAttemptId: input.result.attemptId,
      sourceResultContractVersion:
        input.result.interpretation?.contractVersion ?? "EQ_RESULT_V1",
      sourceScoringVersion: scoringVersion,
      sourceInterpretationVersion:
        input.result.interpretation?.interpretationVersion,
    }));

    const availableCount = signals.filter(
      (signal) => signal.status === "AVAILABLE",
    ).length;

    return {
      signals,
      source: {
        testType: "EQ",
        attemptId: input.result.attemptId,
        status:
          availableCount === signals.length && signals.length > 0
            ? "AVAILABLE"
            : availableCount > 0 || signals.some((signal) => signal.status === "PARTIAL")
              ? "PARTIAL"
              : "INSUFFICIENT",
        confidence,
        resultContractVersion:
          input.result.interpretation?.contractVersion ?? "EQ_RESULT_V1",
        scoringVersion,
        interpretationVersion:
          input.result.interpretation?.interpretationVersion,
        excludedSignalCount: 0,
        exclusionReasons: [],
      },
    };
  },
};

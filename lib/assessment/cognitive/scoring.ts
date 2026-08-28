import type { LikertValue } from "../types";

export const COGNITIVE_SCORING_VERSION = "COGNITIVE_SCORE_V1" as const;

export const COGNITIVE_DIMENSIONS = [
  "VERBAL_REASONING",
  "NUMERICAL_REASONING",
  "LOGICAL_REASONING",
  "ABSTRACT_REASONING",
] as const;

export type CognitiveDimension = (typeof COGNITIVE_DIMENSIONS)[number];

export type CognitiveQuestion = {
  id: string;
  code: string;
  dimension: CognitiveDimension;
  reverseScore: boolean;
  weight: number;
};

export type CognitiveAnswer = {
  questionId: string;
  value: LikertValue;
};

export type CognitiveMeasurement = {
  testType: "COGNITIVE";
  scoringVersion: typeof COGNITIVE_SCORING_VERSION;
  overallScore: number;
  dimensionScores: Array<{
    dimension: CognitiveDimension;
    score: number;
    answeredCount: number;
    questionCount: number;
  }>;
};

function normalize(value: number) {
  return Math.max(0, Math.min(100, Math.round(((value - 1) / 4) * 100)));
}

export function scoreCognitive(
  questions: CognitiveQuestion[],
  answers: CognitiveAnswer[],
): CognitiveMeasurement {
  const byId = new Map(answers.map((a) => [a.questionId, a.value]));
  const dimensionScores = COGNITIVE_DIMENSIONS.map((dimension) => {
    const qs = questions.filter((q) => q.dimension === dimension);
    if (qs.length !== 6) {
      throw new Error(`Cognitive dimension "${dimension}" requires exactly 6 questions; received ${qs.length}.`);
    }
    let weighted = 0;
    let weightTotal = 0;
    let answeredCount = 0;
    for (const q of qs) {
      const raw = byId.get(q.id);
      if (raw === undefined) continue;
      const scored = q.reverseScore ? 6 - raw : raw;
      const weight = q.weight > 0 ? q.weight : 1;
      weighted += scored * weight;
      weightTotal += weight;
      answeredCount += 1;
    }
    return {
      dimension,
      score: weightTotal ? normalize(weighted / weightTotal) : 0,
      answeredCount,
      questionCount: qs.length,
    };
  });

  const overallScore = Math.round(
    dimensionScores.reduce((sum, item) => sum + item.score, 0) / dimensionScores.length,
  );

  return {
    testType: "COGNITIVE",
    scoringVersion: COGNITIVE_SCORING_VERSION,
    overallScore,
    dimensionScores,
  };
}

export function createCognitivePersistableResult(measurement: CognitiveMeasurement) {
  return {
    contractVersion: "COGNITIVE_RESULT_V1" as const,
    measurement,
  };
}

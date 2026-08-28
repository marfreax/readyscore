export const EQ_SCORING_VERSION = "EQ_SCORE_V1";

export const EQ_DIMENSIONS = [
  "EMOTION_AWARENESS",
  "EMOTION_REGULATION",
  "EMPATHY_SOCIAL_AWARENESS",
  "RELATIONSHIP_SOCIAL_RESPONSE",
] as const;

export type EqDimension = typeof EQ_DIMENSIONS[number];

export type EqQuestion = {
  id: string;
  code: string;
  dimension: EqDimension;
  reverseScore: boolean;
  weight: number;
  // Optional source fields retained for compatibility with the generic Question shape.
  domain?: string;
  answerType?: "LIKERT_5";
  scale?: number[];
};

export type EqAnswer = {
  questionId: string;
  value: number;
};

export type EqDimensionScore = {
  dimension: EqDimension;
  score: number;
  answeredCount: number;
  questionCount: number;
};

export type EqMeasurement = {
  overallScore: number;
  dimensionScores: EqDimensionScore[];
};

export type EqPersistableResult = {
  contractVersion: "EQ_RESULT_V1";
  measurement: {
    testType: "EQ";
    scoringVersion: typeof EQ_SCORING_VERSION;
    dimensionScores: EqDimensionScore[];
    overallScore: number;
  };
};

export function scoreEq(
  questions: EqQuestion[],
  answers: EqAnswer[],
): EqMeasurement {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));
  const dimensionScores = EQ_DIMENSIONS.map((dimension) => {
    const qs = questions.filter((q) => q.dimension === dimension);
    let weightedTotal = 0;
    let weightTotal = 0;

    for (const q of qs) {
      const raw = answerMap.get(q.id);
      if (raw == null) continue;
      const scored = q.reverseScore ? 6 - raw : raw;
      const weight = q.weight > 0 ? q.weight : 1;
      weightedTotal += scored * weight;
      weightTotal += weight;
    }

    const score = weightTotal > 0
      ? Math.round(((weightedTotal / weightTotal) - 1) * 25)
      : 0;

    return {
      dimension,
      score,
      answeredCount: qs.filter((q) => answerMap.has(q.id)).length,
      questionCount: qs.length,
    };
  });

  const overallScore = dimensionScores.length
    ? Math.round(
        dimensionScores.reduce((sum, d) => sum + d.score, 0) /
        dimensionScores.length,
      )
    : 0;

  return { overallScore, dimensionScores };
}

export function createEqPersistableResult(
  measurement: EqMeasurement,
): EqPersistableResult {
  return {
    contractVersion: "EQ_RESULT_V1",
    measurement: {
      testType: "EQ",
      scoringVersion: EQ_SCORING_VERSION,
      dimensionScores: measurement.dimensionScores,
      overallScore: measurement.overallScore,
    },
  };
}

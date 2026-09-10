export const EQ_SCORING_VERSION = "EQ_SCORE_V2";

export const EQ_DIMENSIONS = [
  "EMOTION_AWARENESS",
  "EMOTION_REGULATION",
  "EMPATHY_SOCIAL_AWARENESS",
  "RELATIONSHIP_SOCIAL_RESPONSE",
] as const;

export type EqDimension = typeof EQ_DIMENSIONS[number];
export type EqOptionValue = 1 | 2 | 3 | 4;

export type EqQuestion = {
  id: string;
  code: string;
  dimension: EqDimension;
  reverseScore: boolean;
  weight: number;
  answerType?: "SINGLE_CHOICE_4";
  scale?: number[];
  scoringKey: readonly number[];
  options?: readonly string[];
};

export type EqAnswer = {
  questionId: string;
  value: EqOptionValue;
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
  contractVersion: "EQ_RESULT_V2";
  measurement: {
    testType: "EQ";
    scoringVersion: typeof EQ_SCORING_VERSION;
    dimensionScores: EqDimensionScore[];
    overallScore: number;
  };
};

function validateQuestion(question: EqQuestion) {
  if (question.answerType !== "SINGLE_CHOICE_4") {
    throw new Error(`EQ question ${question.id} must use SINGLE_CHOICE_4.`);
  }
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    throw new Error(`EQ question ${question.id} requires exactly four options.`);
  }
  if (!Array.isArray(question.scoringKey) || question.scoringKey.length !== 4) {
    throw new Error(`EQ question ${question.id} requires an explicit four-value scoring key.`);
  }
  if (!question.scoringKey.every((value) => Number.isInteger(value) && value >= 1 && value <= 4)) {
    throw new Error(`EQ question ${question.id} has an invalid ordinal scoring key.`);
  }
  if (new Set(question.scoringKey).size !== 4) {
    throw new Error(`EQ question ${question.id} scoring key must contain four distinct ordinal values.`);
  }
}

export function scoreEq(
  questions: EqQuestion[],
  answers: EqAnswer[],
): EqMeasurement {
  for (const question of questions) validateQuestion(question);

  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));
  const dimensionScores = EQ_DIMENSIONS.map((dimension) => {
    const qs = questions.filter((q) => q.dimension === dimension);
    let weightedTotal = 0;
    let weightTotal = 0;
    let answeredCount = 0;

    for (const q of qs) {
      const raw = answerMap.get(q.id);
      if (raw == null) continue;
      if (![1, 2, 3, 4].includes(raw)) {
        throw new Error(`Invalid EQ answer for question ${q.id}.`);
      }

      const keyedOrdinal = q.scoringKey[raw - 1];
      const weight = q.weight > 0 ? q.weight : 1;
      weightedTotal += keyedOrdinal * weight;
      weightTotal += weight;
      answeredCount += 1;
    }

    // Ordinal 1 is the lower keyed response and 4 is the higher keyed response.
    // Normalize the weighted mean from [1,4] to [0,100].
    const mean = weightTotal > 0 ? weightedTotal / weightTotal : 1;
    const score = weightTotal > 0
      ? Math.round(((mean - 1) / 3) * 100)
      : 0;

    return {
      dimension,
      score,
      answeredCount,
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
    contractVersion: "EQ_RESULT_V2",
    measurement: {
      testType: "EQ",
      scoringVersion: EQ_SCORING_VERSION,
      dimensionScores: measurement.dimensionScores,
      overallScore: measurement.overallScore,
    },
  };
}

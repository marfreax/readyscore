import type { LikertValue } from "../types";

export const EQ_SCORING_VERSION = "EQ_SCORE_V1" as const;

export const EQ_DIMENSIONS = [
  "EMOTION_AWARENESS",
  "EMOTION_REGULATION",
  "EMPATHY_SOCIAL_AWARENESS",
  "RELATIONSHIP_SOCIAL_RESPONSE",
] as const;

export type EqDimension = (typeof EQ_DIMENSIONS)[number];

export type EqQuestion = {
  id: string;
  code: string;
  dimension: EqDimension;
  reverseScore: boolean;
  weight: number;
};

export type EqAnswer = {
  questionId: string;
  value: LikertValue;
};

export type EqMeasurement = {
  testType: "EQ";
  scoringVersion: typeof EQ_SCORING_VERSION;
  overallScore: number;
  dimensionScores: Array<{
    dimension: EqDimension;
    score: number;
    answeredCount: number;
    questionCount: number;
  }>;
};

function normalize(value: number) {
  return Math.max(0, Math.min(100, Math.round(((value - 1) / 4) * 100)));
}

export function scoreEq(questions: EqQuestion[], answers: EqAnswer[]): EqMeasurement {
  const byId = new Map(answers.map((a) => [a.questionId, a.value]));
  const dimensionScores = EQ_DIMENSIONS.map((dimension) => {
    const qs = questions.filter((q) => q.dimension === dimension);
    if (qs.length !== 6) {
      throw new Error(`EQ dimension "${dimension}" requires exactly 6 questions; received ${qs.length}.`);
    }
    let weighted = 0;
    let weightTotal = 0;
    let answeredCount = 0;
    for (const q of qs) {
      const raw = byId.get(q.id);
      if (raw === undefined) continue;
      if (![1,2,3,4,5].includes(raw)) {
        throw new Error(`Invalid EQ answer for question ${q.id}.`);
      }
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
    testType: "EQ",
    scoringVersion: EQ_SCORING_VERSION,
    overallScore,
    dimensionScores,
  };
}

export function createEqPersistableResult(measurement: EqMeasurement) {
  return {
    contractVersion: "EQ_RESULT_V1" as const,
    measurement,
  };
}

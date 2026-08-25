import {
  RIASEC_DIMENSIONS,
  RIASEC_MIN_COVERAGE_PERCENT,
  RIASEC_SCORING_VERSION,
  RIASEC_TARGET_ITEMS_PER_DIMENSION,
  RIASEC_TOP_CODE_LENGTH,
  type RiasecAnswer,
  type RiasecDimension,
  type RiasecDimensionScore,
  type RiasecQuestion,
  type RiasecResult,
} from "./types";

const MIN_LIKERT = 1;
const MAX_LIKERT = 5;

type Bucket = {
  dimension: RiasecDimension;
  questionCount: number;
  answeredCount: number;
  weightedScore: number;
  totalWeight: number;
};

function normalizeScore(mean: number): number {
  return Number(
    (((mean - MIN_LIKERT) / (MAX_LIKERT - MIN_LIKERT)) * 100).toFixed(2),
  );
}

function scoreLikert(
  value: RiasecAnswer["value"],
  reverseScore: boolean,
): number {
  return reverseScore ? MAX_LIKERT + MIN_LIKERT - value : value;
}

function getWeight(question: RiasecQuestion): number {
  const weight = Number(question.weight);
  return Number.isFinite(weight) && weight > 0 ? weight : 1;
}

function rankDimensions(
  scores: RiasecDimensionScore[],
): RiasecDimensionScore[] {
  return scores.slice().sort((a, b) => {
    const scoreA = a.score ?? -1;
    const scoreB = b.score ?? -1;

    if (scoreB !== scoreA) return scoreB - scoreA;

    return (
      RIASEC_DIMENSIONS.indexOf(a.dimension) -
      RIASEC_DIMENSIONS.indexOf(b.dimension)
    );
  });
}

export function scoreRiasec(
  questions: RiasecQuestion[],
  answers: RiasecAnswer[],
): RiasecResult {
  const answerMap = new Map<string, RiasecAnswer>();

  for (const answer of answers) {
    if (!answer?.questionId) continue;

    if (
      answer.value !== 1 &&
      answer.value !== 2 &&
      answer.value !== 3 &&
      answer.value !== 4 &&
      answer.value !== 5
    ) {
      continue;
    }

    answerMap.set(answer.questionId, answer);
  }

  const buckets = new Map<RiasecDimension, Bucket>();

  for (const dimension of RIASEC_DIMENSIONS) {
    buckets.set(dimension, {
      dimension,
      questionCount: 0,
      answeredCount: 0,
      weightedScore: 0,
      totalWeight: 0,
    });
  }

  for (const question of questions) {
    const bucket = buckets.get(question.dimension);
    if (!bucket) continue;

    bucket.questionCount += 1;

    const answer = answerMap.get(question.id);
    if (!answer) continue;

    const weight = getWeight(question);
    const scoredValue = scoreLikert(answer.value, question.reverseScore);

    bucket.answeredCount += 1;
    bucket.weightedScore += scoredValue * weight;
    bucket.totalWeight += weight;
  }

  const dimensionScores: RiasecDimensionScore[] = RIASEC_DIMENSIONS.map(
    (dimension) => {
      const bucket = buckets.get(dimension)!;

      const score =
        bucket.totalWeight > 0
          ? normalizeScore(bucket.weightedScore / bucket.totalWeight)
          : null;

      return {
        dimension,
        answeredCount: bucket.answeredCount,
        questionCount: bucket.questionCount,
        score,
        sufficient:
          bucket.answeredCount >=
          RIASEC_TARGET_ITEMS_PER_DIMENSION *
            (RIASEC_MIN_COVERAGE_PERCENT / 100),
      };
    },
  );

  const rankedDimensions = rankDimensions(dimensionScores);

  const measuredDimensions = dimensionScores.filter(
    (item) => item.score !== null && item.answeredCount > 0,
  );

  const measuredDimensionCount = measuredDimensions.length;

  const coveragePercent = Number(
    ((measuredDimensionCount / RIASEC_DIMENSIONS.length) * 100).toFixed(2),
  );

  const isComplete =
    coveragePercent >= RIASEC_MIN_COVERAGE_PERCENT &&
    dimensionScores.every((item) => item.sufficient);

  const topCode = isComplete
    ? rankedDimensions
        .filter((item) => item.score !== null)
        .slice(0, RIASEC_TOP_CODE_LENGTH)
        .map((item) => item.dimension)
        .join("")
    : null;

  const answeredQuestions = measuredDimensions.reduce(
    (total, item) => total + item.answeredCount,
    0,
  );

  return {
    testType: "RIASEC",
    scoringVersion: RIASEC_SCORING_VERSION,
    totalQuestions: questions.length,
    answeredQuestions,
    dimensionScores,
    rankedDimensions,
    topCode,
    coveragePercent,
    measuredDimensionCount,
    isComplete,
    quality: {
      scoreableQuestions: answeredQuestions,
      measuredDimensions: measuredDimensionCount,
      totalDimensions: RIASEC_DIMENSIONS.length,
      coveragePercent,
      complete: isComplete,
    },
  };
}

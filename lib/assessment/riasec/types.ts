export const RIASEC_DIMENSIONS = [
  "R",
  "I",
  "A",
  "S",
  "E",
  "C",
] as const;

export type RiasecDimension = (typeof RIASEC_DIMENSIONS)[number];

export const RIASEC_SCORING_VERSION = "RIASEC_SCORE_V1";
export const RIASEC_DIMENSION_COUNT = 6;
export const RIASEC_TARGET_ITEMS_PER_DIMENSION = 10;
export const RIASEC_MIN_COVERAGE_PERCENT = 80;
export const RIASEC_TOP_CODE_LENGTH = 3;

export type RiasecLikertValue = 1 | 2 | 3 | 4 | 5;

export type RiasecQuestion = {
  id: string;
  code: string;
  dimension: RiasecDimension;
  reverseScore: boolean;
  weight: number;
};

export type RiasecAnswer = {
  questionId: string;
  value: RiasecLikertValue;
};

export type RiasecDimensionScore = {
  dimension: RiasecDimension;
  answeredCount: number;
  questionCount: number;
  score: number | null;
  sufficient: boolean;
};

export type RiasecResult = {
  testType: "RIASEC";
  scoringVersion: typeof RIASEC_SCORING_VERSION;
  totalQuestions: number;
  answeredQuestions: number;
  dimensionScores: RiasecDimensionScore[];
  rankedDimensions: RiasecDimensionScore[];
  topCode: string | null;
  coveragePercent: number;
  measuredDimensionCount: number;
  isComplete: boolean;
  quality: {
    scoreableQuestions: number;
    measuredDimensions: number;
    totalDimensions: number;
    coveragePercent: number;
    complete: boolean;
  };
};

export const RIASEC_DIMENSIONS = [
  "R",
  "I",
  "A",
  "S",
  "E",
  "C",
] as const;

export type RiasecDimension = (typeof RIASEC_DIMENSIONS)[number];

/** Active V8.6 RIASEC scoring semantics. */
export const RIASEC_SCORING_VERSION = "RIASEC_SCORE_V2" as const;
/** Historical V1 scoring semantics; retained for immutable golden contracts. */
export const RIASEC_SCORING_VERSION_V1 = "RIASEC_SCORE_V1" as const;

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

type RiasecResultBase = {
  testType: "RIASEC";
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

/** Historical V1 result shape. Never mutate this to V2. */
export type RiasecResultV1 = RiasecResultBase & {
  scoringVersion: typeof RIASEC_SCORING_VERSION_V1;
};

/** Active V8.6 result shape. */
export type RiasecResultV2 = RiasecResultBase & {
  scoringVersion: typeof RIASEC_SCORING_VERSION;
};

/** Compatibility union for shared/golden infrastructure across versions. */
export type RiasecResult = RiasecResultV1 | RiasecResultV2;

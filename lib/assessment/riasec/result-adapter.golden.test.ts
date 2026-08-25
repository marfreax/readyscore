import { toAssessmentResult } from "./result-adapter";
import type { RiasecResult } from "./types";

const result: RiasecResult = {
  testType: "RIASEC",
  scoringVersion: "RIASEC_SCORE_V1",
  totalQuestions: 60,
  answeredQuestions: 60,

  dimensionScores: [
    { dimension: "R", answeredCount: 10, questionCount: 10, score: 75, sufficient: true },
    { dimension: "I", answeredCount: 10, questionCount: 10, score: 100, sufficient: true },
    { dimension: "A", answeredCount: 10, questionCount: 10, score: 25, sufficient: true },
    { dimension: "S", answeredCount: 10, questionCount: 10, score: 25, sufficient: true },
    { dimension: "E", answeredCount: 10, questionCount: 10, score: 50, sufficient: true },
    { dimension: "C", answeredCount: 10, questionCount: 10, score: 25, sufficient: true },
  ],

  rankedDimensions: [
    { dimension: "I", answeredCount: 10, questionCount: 10, score: 100, sufficient: true },
    { dimension: "R", answeredCount: 10, questionCount: 10, score: 75, sufficient: true },
    { dimension: "E", answeredCount: 10, questionCount: 10, score: 50, sufficient: true },
    { dimension: "A", answeredCount: 10, questionCount: 10, score: 25, sufficient: true },
    { dimension: "S", answeredCount: 10, questionCount: 10, score: 25, sufficient: true },
    { dimension: "C", answeredCount: 10, questionCount: 10, score: 25, sufficient: true },
  ],

  topCode: "IRE",
  coveragePercent: 100,
  measuredDimensionCount: 6,
  isComplete: true,

  quality: {
    scoreableQuestions: 60,
    measuredDimensions: 6,
    totalDimensions: 6,
    coveragePercent: 100,
    complete: true,
  },
};

const mapped = toAssessmentResult(result, {
  attemptId: "attempt-test",
  assessmentConfigurationVersion: "RIASEC_CONFIG_V1",
  questionBankVersion: "RIASEC_QB_V1",
  taxonomyVersion: "RIASEC_TAXONOMY_V1",
  scoringVersion: "RIASEC_SCORE_V1",
  completedAt: "2026-08-22T00:00:00.000Z",
});

/*
 * F.6 deliberately validates only fields that are confirmed by the
 * existing generic AssessmentResult TypeScript contract.
 *
 * RIASEC-specific measurement fields remain in RiasecResult and are not
 * asserted through AssessmentResult until the dedicated v3 result contract
 * is introduced.
 */

if (mapped.attemptId !== "attempt-test") {
  throw new Error("attemptId mismatch.");
}

if (mapped.assessmentType !== "RIASEC") {
  throw new Error("assessmentType mismatch.");
}

if (mapped.scoringVersion !== "RIASEC_SCORE_V1") {
  throw new Error("scoringVersion mismatch.");
}

console.log("RIASEC_F6_RESULT_ADAPTER_TEST passed.");

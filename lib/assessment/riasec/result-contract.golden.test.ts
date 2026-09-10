import {
  createRiasecPersistableResult,
  RIASEC_RESULT_CONTRACT_VERSION,
} from "./result-contract";
import type { RiasecResult } from "./types";

const measurement: RiasecResult = {
  testType: "RIASEC",
  scoringVersion: "RIASEC_SCORE_V2",
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

const persisted = createRiasecPersistableResult(measurement, {
  attemptId: "attempt-test",
  testType: "RIASEC",
  assessmentConfigurationVersion: "RIASEC_CONFIG_V2",
  questionBankVersion: "RIASEC_QB_V2",
  scoringVersion: "RIASEC_SCORE_V2",
  completedAt: "2026-08-22T00:00:00.000Z",
});

if (persisted.contractVersion !== RIASEC_RESULT_CONTRACT_VERSION) {
  throw new Error("Result contract version mismatch.");
}

if (persisted.provenance.testType !== "RIASEC") {
  throw new Error("Result provenance test type mismatch.");
}

if (persisted.provenance.scoringVersion !== "RIASEC_SCORE_V2") {
  throw new Error("Result provenance scoring version mismatch.");
}

if (persisted.measurement.topCode !== "IRE") {
  throw new Error("RIASEC measurement was not preserved.");
}

if (persisted.measurement.coveragePercent !== 100) {
  throw new Error("RIASEC coverage was not preserved.");
}

console.log("RIASEC_F7_RESULT_CONTRACT_TEST passed.");

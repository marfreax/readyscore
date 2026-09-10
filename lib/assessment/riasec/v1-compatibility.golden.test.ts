import {
  createRiasecPersistableResult,
  RIASEC_RESULT_CONTRACT_VERSION_V1,
} from "./result-contract";
import type { RiasecResultV1 } from "./types";

const measurement: RiasecResultV1 = {
  testType: "RIASEC",
  scoringVersion: "RIASEC_SCORE_V1",
  totalQuestions: 60,
  answeredQuestions: 60,
  dimensionScores: [
    "R","I","A","S","E","C"
  ].map((dimension) => ({
    dimension: dimension as "R"|"I"|"A"|"S"|"E"|"C",
    answeredCount: 10,
    questionCount: 10,
    score: 50,
    sufficient: true,
  })),
  rankedDimensions: [
    "R","I","A","S","E","C"
  ].map((dimension) => ({
    dimension: dimension as "R"|"I"|"A"|"S"|"E"|"C",
    answeredCount: 10,
    questionCount: 10,
    score: 50,
    sufficient: true,
  })),
  topCode: "RIA",
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
  attemptId: "historical-v1-attempt",
  testType: "RIASEC",
  assessmentConfigurationVersion: "RIASEC_CONFIG_V1",
  questionBankVersion: "RIASEC_QB_V1",
  scoringVersion: "RIASEC_SCORE_V1",
  completedAt: "2026-08-22T00:00:00.000Z",
});

if (persisted.contractVersion !== RIASEC_RESULT_CONTRACT_VERSION_V1) {
  throw new Error("Historical RIASEC V1 contract was not preserved.");
}
if (persisted.provenance.scoringVersion !== "RIASEC_SCORE_V1") {
  throw new Error("Historical RIASEC V1 scoring provenance was not preserved.");
}

console.log("RIASEC_V1_COMPATIBILITY_TEST passed.");

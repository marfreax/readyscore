import type { RiasecPersistableResult } from "./result-contract";

function makeResult(): RiasecPersistableResult {
  return {
    contractVersion: "RIASEC_RESULT_V1",
    provenance: {
      attemptId: "attempt-riasec-test",
      testType: "RIASEC",
      assessmentConfigurationVersion: "RIASEC_CONFIG_V1",
      questionBankVersion: "RIASEC_QB_V1",
      scoringVersion: "RIASEC_SCORE_V1",
      completedAt: "2026-08-22T00:00:00.000Z",
    },
    measurement: {
      testType: "RIASEC",
      scoringVersion: "RIASEC_SCORE_V1",
      totalQuestions: 60,
      answeredQuestions: 60,
      dimensionScores: [],
      rankedDimensions: [],
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
    },
  };
}

const result = makeResult();

if (result.contractVersion !== "RIASEC_RESULT_V1") {
  throw new Error("Contract version mismatch.");
}

if (result.provenance.testType !== "RIASEC") {
  throw new Error("Test type mismatch.");
}

if (result.provenance.attemptId !== "attempt-riasec-test") {
  throw new Error("Attempt provenance mismatch.");
}

if (result.measurement.topCode !== "IRE") {
  throw new Error("Measurement payload mismatch.");
}

console.log("RIASEC_F8_PERSISTENCE_CONTRACT_TEST passed.");

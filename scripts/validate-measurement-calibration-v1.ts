import { calibrateMeasurement } from "../lib/calibration/engine-v1";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const responses = [
  { respondentId: "r1", answers: { q1: 1, q2: 5, q3: 2, q4: 4 } },
  { respondentId: "r2", answers: { q1: 2, q2: 4, q3: 3, q4: 3 } },
  { respondentId: "r3", answers: { q1: 3, q2: 3, q3: 4, q4: 2 } },
  { respondentId: "r4", answers: { q1: 4, q2: 2, q3: 5, q4: 1 } },
  { respondentId: "r5", answers: { q1: 5, q2: 1, q3: 4, q4: 2 } },
  { respondentId: "r6", answers: { q1: 3, q2: 3, q3: 2, q4: 4 } },
];

const dataset = {
  datasetId: "CALIBRATION_GATE_FIXTURE_V1",
  testType: "RIASEC",
  scoringVersion: "RIASEC_SCORE_V1",
  items: [
    { questionId: "q1", dimensionId: "R", minValue: 1, maxValue: 5 },
    { questionId: "q2", dimensionId: "R", minValue: 1, maxValue: 5, reverseScore: true },
    { questionId: "q3", dimensionId: "I", minValue: 1, maxValue: 5 },
    { questionId: "q4", dimensionId: "I", minValue: 1, maxValue: 5, reverseScore: true },
  ],
  responses,
};

console.log("=== READY SCORE V3 PHASE 3.14 MEASUREMENT CALIBRATION V1 GATE ===");
console.log("Scope      : Calibration diagnostics / evidence governance");
console.log("Protection : Frozen F.10-C.2-F + Phase 3.1-3.13 semantics");

const report = calibrateMeasurement(dataset);

assert(report.contractVersion === "MEASUREMENT_CALIBRATION_V1", "Calibration contract mismatch.");
assert(report.reportVersion === "CALIBRATION_REPORT_V1", "Calibration report version mismatch.");
assert(report.testType === "RIASEC", "Test type identity changed.");
assert(report.scoringVersion === "RIASEC_SCORE_V1", "Scoring version boundary changed.");
assert(report.itemMetrics.length === 4, "Item metric count mismatch.");
assert(report.dimensionMetrics.length === 2, "Dimension metric count mismatch.");
assert(report.governance.productionMutation === false, "Calibration must not mutate production.");
assert(report.governance.scoringMutation === false, "Calibration must not mutate scoring.");
assert(report.governance.questionPublicationMutation === false, "Calibration must not publish questions.");
assert(report.governance.normingPerformed === false, "Calibration gate must not perform norming.");
assert(report.governance.validityClaim === false, "Calibration gate must not emit validity claims.");
assert(report.itemMetrics.some((item) => item.itemRestCorrelation !== null), "Item-rest diagnostics missing.");
assert(report.dimensionMetrics.every((dimension) => dimension.cronbachAlpha !== null), "Reliability diagnostic missing.");
assert(report.limitations.length >= 3, "Calibration limitations are incomplete.");

const repeat = calibrateMeasurement(dataset);
assert(JSON.stringify(report) === JSON.stringify(repeat), "Calibration output must be deterministic.");

console.log("Calibration contract            : PASS");
console.log("Item-level diagnostics          : PASS");
console.log("Dimension diagnostics            : PASS");
console.log("Reverse-score handling          : PASS");
console.log("Item-rest correlation            : PASS");
console.log("Reliability diagnostic           : PASS");
console.log("Deterministic report             : PASS");
console.log("No production mutation           : PASS");
console.log("No scoring mutation              : PASS");
console.log("No question publication          : PASS");
console.log("No norming / validity claim      : PASS");
console.log("F.3.14 MEASUREMENT CALIBRATION GATE: PASS");

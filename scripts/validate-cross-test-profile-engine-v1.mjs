import { buildCrossTestProfile, listProfileAdapters } from "../lib/profile/engine-v1.ts";

console.log("=== READY SCORE V3 PHASE 3.6 CROSS-TEST PROFILE ENGINE V1 GATE ===");
console.log("Scope      : Cross-test synthesis / profile contract / evidence governance");
console.log("Protection : Frozen F.10-C.2-F + 3.1 + 3.2 + 3.3 + 3.4 + 3.5 semantics");

const measurement = {
  testType: "RIASEC",
  scoringVersion: "RIASEC_SCORE_V1",
  totalQuestions: 60,
  answeredQuestions: 60,
  dimensionScores: ["R", "I", "A", "S", "E", "C"].map((dimension, index) => ({ dimension, answeredCount: 10, questionCount: 10, score: 50 + index * 5, sufficient: true })),
  rankedDimensions: ["C", "E", "S", "A", "I", "R"].map((dimension, index) => ({ dimension, answeredCount: 10, questionCount: 10, score: 75 - index * 5, sufficient: true })),
  topCode: "CES",
  coveragePercent: 100,
  measuredDimensionCount: 6,
  isComplete: true,
  quality: { scoreableQuestions: 60, measuredDimensions: 6, totalDimensions: 6, coveragePercent: 100, complete: true },
};

const result = {
  attemptId: "gate-riasec-attempt",
  assessmentType: "RIASEC",
  scoringVersion: "RIASEC_SCORE_V1",
  status: "COMPLETE",
  interpretation: { contractVersion: "TEST_RESULT_V1", interpretationVersion: "RIASEC_INTERPRETATION_V1", status: "COMPLETE", confidence: "HIGH" },
};

const profile = buildCrossTestProfile([{ result, testSpecific: { contractVersion: "RIASEC_RESULT_V1", measurement } }], "2026-08-26T00:00:00.000Z");

if (profile.contractVersion !== "CROSS_TEST_PROFILE_V1") throw new Error("Unexpected profile contract version.");
if (profile.engineVersion !== "CROSS_TEST_PROFILE_ENGINE_V1") throw new Error("Unexpected profile engine version.");
if (profile.domains.find((d) => d.domain === "INTEREST")?.signalCount !== 6) throw new Error("Expected six RIASEC interest signals.");
if (profile.completeness.percentage !== Math.round((1 / 7) * 100)) throw new Error("Unexpected completeness calculation.");
if ("overallScore" in profile) throw new Error("Cross-test profile must not expose a universal overallScore.");
if (profile.claims.prohibited.some((claim) => claim.includes("averaging"))) {
  // expected governance
} else throw new Error("Raw-average claim governance missing.");
if (!profile.synthesis.limitations.some((item) => item.includes("one profile domain"))) throw new Error("Insufficient cross-test limitation missing.");
if (!listProfileAdapters().includes("RIASEC")) throw new Error("RIASEC adapter not registered.");

const unknown = buildCrossTestProfile([{ result: { ...result, assessmentType: "COGNITIVE", attemptId: "unknown" } }], "2026-08-26T00:00:00.000Z");
if (unknown.sources[0].includedSignalCount !== 0) throw new Error("Unknown test must not generate synthetic evidence.");

console.log("Profile contract             : PASS");
console.log("RIASEC adapter               : PASS");
console.log("Heterogeneous evidence model : PASS");
console.log("No universal overall score   : PASS");
console.log("Raw-average prohibition      : PASS");
console.log("Unknown-test safety          : PASS");
console.log("Cross-test profile gate      : PASS");

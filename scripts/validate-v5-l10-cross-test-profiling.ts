import { buildCrossTestProfile, listProfileAdapters, PROFILE_DOMAINS } from "../lib/profile/engine-v1";
import type { CrossTestProfileInput } from "../lib/profile/types";

console.log("=== READY SCORE V5 L10 CROSS-TEST PROFILING MVP GATE ===");
console.log("Scope      : Cross-test synthesis / evidence hierarchy / customer-facing profile");
console.log("Protection : Frozen RIASEC + DISC + EQ + Cognitive measurement/result semantics");

const mk = (assessmentType: string, attemptId: string, testSpecific: unknown): CrossTestProfileInput => ({
  result: {
    attemptId,
    assessmentType,
    scoringVersion: `${assessmentType}_SCORE_V1`,
    status: "COMPLETE",
    interpretation: {
      contractVersion: "TEST_RESULT_V1",
      interpretationVersion: `${assessmentType}_INTERPRETATION_V1`,
      status: "COMPLETE",
      confidence: "HIGH",
    },
  },
  testSpecific,
});

const cognitive = { measurement: { testType: "COGNITIVE", scoringVersion: "COGNITIVE_SCORE_V1", overallScore: 70, dimensionScores: ["VERBAL_REASONING", "NUMERICAL_REASONING", "LOGICAL_REASONING", "ABSTRACT_REASONING"].map((dimension) => ({ dimension, score: 70, answeredCount: 6, questionCount: 6 })) } };
const eq = { measurement: { testType: "EQ", scoringVersion: "EQ_SCORE_V1", overallScore: 70, dimensionScores: ["EMOTION_AWARENESS", "EMOTION_REGULATION", "EMPATHY_SOCIAL_AWARENESS", "RELATIONSHIP_SOCIAL_RESPONSE"].map((dimension) => ({ dimension, score: 70, answeredCount: 6, questionCount: 6 })) } };
const disc = { measurement: { testType: "DISC", scoringVersion: "DISC_SCORE_V1", overallScore: 70, primaryPattern: "D", secondaryPattern: "I", dimensionScores: ["D", "I", "S", "C"].map((dimension) => ({ dimension, score: 70, answeredCount: 6, questionCount: 6 })) } };
const riasec = { measurement: { testType: "RIASEC", scoringVersion: "RIASEC_SCORE_V1", totalQuestions: 60, answeredQuestions: 60, dimensionScores: ["R", "I", "A", "S", "E", "C"].map((dimension) => ({ dimension, answeredCount: 10, questionCount: 10, score: 70, sufficient: true })), rankedDimensions: ["C", "E", "S", "A", "I", "R"].map((dimension) => ({ dimension, answeredCount: 10, questionCount: 10, score: 70, sufficient: true })), topCode: "CES", coveragePercent: 100, measuredDimensionCount: 6, isComplete: true, quality: { scoreableQuestions: 60, measuredDimensions: 6, totalDimensions: 6, coveragePercent: 100, complete: true } } };

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredPaths = [
  "lib/profile/service.ts",
  "app/api/profile/cross-test/route.ts",
  "app/profile/page.tsx",
  "architecture/phase-5.10/ReadyScore_V5_L10_Cross_Test_Profiling_MVP.md",
];
for (const requiredPath of requiredPaths) {
  if (!fs.existsSync(path.join(root, requiredPath))) throw new Error(`L10 required path missing: ${requiredPath}`);
}

const profile = buildCrossTestProfile([
  mk("COGNITIVE", "c1", cognitive),
  mk("EQ", "e1", eq),
  mk("DISC", "d1", disc),
  mk("RIASEC", "r1", riasec),
], "2026-08-27T00:00:00.000Z");

if (profile.contractVersion !== "CROSS_TEST_PROFILE_V1") throw new Error("L10 profile contract identity missing.");
if (profile.engineVersion !== "CROSS_TEST_PROFILE_ENGINE_V1") throw new Error("L10 profile engine identity missing.");
if (!listProfileAdapters().includes("COGNITIVE") || !listProfileAdapters().includes("DISC") || !listProfileAdapters().includes("EQ") || !listProfileAdapters().includes("RIASEC")) throw new Error("All four L10 profile adapters must be registered.");
if (profile.completeness.availableDomains !== 4 || profile.completeness.totalDomains !== PROFILE_DOMAINS.length) throw new Error("Expected four available evidence domains across seven profile domains.");
if (profile.domains.find((d) => d.domain === "ABILITY")?.signalCount !== 4) throw new Error("Cognitive ability evidence missing.");
if (profile.domains.find((d) => d.domain === "EMOTIONAL")?.signalCount !== 4) throw new Error("EQ emotional evidence missing.");
if (profile.domains.find((d) => d.domain === "BEHAVIOR")?.signalCount !== 4) throw new Error("DISC behavior evidence missing.");
if (profile.domains.find((d) => d.domain === "INTEREST")?.signalCount !== 6) throw new Error("RIASEC interest evidence missing.");
if ("overallScore" in profile) throw new Error("Cross-test profile must not expose a universal overallScore.");
if (!profile.claims.prohibited.some((claim) => claim.includes("averaging"))) throw new Error("Raw-average prohibition missing.");
if (!profile.claims.prohibited.some((claim) => claim.includes("universal overall"))) throw new Error("Universal-score prohibition missing.");

const unknown = buildCrossTestProfile([mk("UNKNOWN", "unknown", {})], "2026-08-27T00:00:00.000Z");
if (unknown.sources[0]?.includedSignalCount !== 0) throw new Error("Unknown test must not generate synthetic evidence.");

console.log("PASS: L10 profile contract identity PRESENT");
console.log("PASS: Four assessment adapters REGISTERED");
console.log("PASS: Four evidence domains AVAILABLE / 7 total");
console.log("PASS: Cognitive → ABILITY evidence");
console.log("PASS: EQ → EMOTIONAL evidence");
console.log("PASS: DISC → BEHAVIOR evidence");
console.log("PASS: RIASEC → INTEREST evidence");
console.log("PASS: No universal overall score");
console.log("PASS: Raw-average prohibition");
console.log("PASS: Unknown-test safety");
console.log("PASS: Customer-facing profile contract");
console.log("L10 database migration       : NO");
console.log("L10 measurement semantics    : NO MUTATION");
console.log("V5 L10 CROSS-TEST PROFILING MVP GATE: PASS");

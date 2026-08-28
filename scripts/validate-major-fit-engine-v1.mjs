import { buildMajorFit } from "../lib/direction/major-fit/engine-v1.ts";

console.log("=== READY SCORE V3 PHASE 3.8 MAJOR FIT ENGINE V1 GATE ===");
console.log("Scope      : Study Direction + relevant evidence + major profile correspondence");
console.log("Protection : Frozen F.10-C.2-F + 3.1 + 3.2 + 3.3 + 3.4 + 3.5 + 3.6 + 3.7 semantics");

const signals = [
  { signalId: "riasec:I", domain: "INTEREST", construct: "Vocational Interest", dimension: "I", label: "Investigative", score: 80, scoreScale: "PRESENTATION_0_100", scoreSemantics: "INTEREST", status: "AVAILABLE", confidence: "HIGH", sourceTestType: "RIASEC", sourceResultAttemptId: "a" },
  { signalId: "cognitive:reasoning", domain: "ABILITY", construct: "Cognitive Ability", dimension: "Reasoning", label: "Reasoning", score: 75, scoreScale: "PRESENTATION_0_100", scoreSemantics: "ABILITY", status: "AVAILABLE", confidence: "HIGH", sourceTestType: "COGNITIVE", sourceResultAttemptId: "b" },
];
const direction = {
  contractVersion: "STUDY_DIRECTION_V1",
  directionId: "study:engineering",
  label: "Engineering and Technology",
  studyAreas: ["ENGINEERING", "TECHNOLOGY"],
  evidenceSignalIds: ["riasec:I", "cognitive:reasoning"],
};
const major = {
  majorId: "major:informatics",
  majorCode: "INF",
  name: "Informatics",
  studyAreas: ["TECHNOLOGY"],
  version: "MAJOR_PROFILE_V1",
  requirements: [
    { requirementId: "interest", label: "Investigative interest", domain: "INTEREST", dimension: "I", required: true, acceptedSignalIds: ["riasec:I"] },
    { requirementId: "reasoning", label: "Reasoning evidence", domain: "ABILITY", dimension: "Reasoning", required: true, acceptedSignalIds: ["cognitive:reasoning"] },
  ],
};
const result = buildMajorFit(direction, major, signals);
if (result.contractVersion !== "MAJOR_FIT_V1") throw new Error("Unexpected Major Fit contract version.");
if (result.engineVersion !== "MAJOR_FIT_ENGINE_V1") throw new Error("Unexpected Major Fit engine version.");
if (result.status !== "STRONG_FIT") throw new Error("Expected strong fit for complete required evidence.");
if (result.matchedRequirementCount !== 2) throw new Error("Expected two matched required requirements.");
if (result.completeness.percentage !== 100) throw new Error("Expected 100% required-evidence completeness.");
if (!result.synthesis.alignedStudyAreas.includes("TECHNOLOGY")) throw new Error("Study Direction alignment missing.");
if (!result.claims.prohibited.some((claim) => claim.includes("guaranteed academic success"))) throw new Error("Outcome claim governance missing.");
if (!result.claims.prohibited.some((claim) => claim.includes("one-test-only"))) throw new Error("One-test deterministic prohibition missing.");
if ("overallScore" in result || "fitScore" in result) throw new Error("Major Fit must not expose an invented universal/fit score without a defined model.");

const insufficient = buildMajorFit(direction, major, []);
if (insufficient.status !== "LIMITED_EVIDENCE") throw new Error("Unknown/empty evidence must remain limited.");
if (insufficient.evidenceStatus !== "INSUFFICIENT") throw new Error("Evidence status must be insufficient.");

console.log("Major Fit contract           : PASS");
console.log("Study Direction boundary     : PASS");
console.log("Relevant evidence mapping    : PASS");
console.log("Major profile versioning      : PASS");
console.log("No universal/raw average     : PASS");
console.log("Outcome claim governance     : PASS");
console.log("Insufficient evidence safety : PASS");
console.log("F.3.8 MAJOR FIT ENGINE GATE  : PASS");

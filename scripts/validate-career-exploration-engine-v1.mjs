import { buildCareerExploration } from "../lib/direction/career-exploration/engine-v1.ts";

console.log("=== READY SCORE V3 PHASE 3.9 CAREER EXPLORATION ENGINE V1 GATE ===");
console.log("Scope      : Cross-Test Profile + Study Direction + Major Fit + career profile exploration");
console.log("Protection : Frozen F.10-C.2-F + 3.1 + 3.2 + 3.3 + 3.4 + 3.5 + 3.6 + 3.7 + 3.8 semantics");

const profile = {
  profileId: "profile:test",
  contractVersion: "CROSS_TEST_PROFILE_V1",
  status: "COMPLETE",
  signals: [
    { signalId: "riasec:I", domain: "INTEREST", dimension: "I", label: "Investigative", status: "AVAILABLE", sourceTestType: "RIASEC" },
    { signalId: "cognitive:reasoning", domain: "ABILITY", dimension: "Reasoning", label: "Reasoning", status: "AVAILABLE", sourceTestType: "COGNITIVE" },
  ],
};
const direction = {
  contractVersion: "STUDY_DIRECTION_V1",
  directionId: "study:engineering",
  label: "Engineering and Technology",
  studyAreas: ["ENGINEERING", "TECHNOLOGY"],
};
const majorFit = {
  contractVersion: "MAJOR_FIT_V1",
  majorId: "major:informatics",
  status: "STRONG_FIT",
};
const career = {
  careerId: "career:software-engineering",
  careerCode: "SWE",
  name: "Software Engineering",
  family: "Technology & Software",
  studyAreas: ["TECHNOLOGY"],
  majorIds: ["major:informatics"],
  version: "CAREER_PROFILE_V1",
  requirements: [
    { requirementId: "interest", label: "Investigative interest", domain: "INTEREST", dimension: "I", required: true, acceptedSignalIds: ["riasec:I"] },
    { requirementId: "reasoning", label: "Reasoning evidence", domain: "ABILITY", dimension: "Reasoning", required: true, acceptedSignalIds: ["cognitive:reasoning"] },
  ],
};

const result = buildCareerExploration({ profile, direction, majorFit }, career);

if (result.contractVersion !== "CAREER_EXPLORATION_V1") throw new Error("Unexpected Career Exploration contract version.");
if (result.engineVersion !== "CAREER_EXPLORATION_ENGINE_V1") throw new Error("Unexpected Career Exploration engine version.");
if (result.status !== "STRONG_EXPLORATION") throw new Error("Expected strong exploration for complete required evidence.");
if (result.matchedRequirementCount !== 2) throw new Error("Expected two matched required requirements.");
if (result.completeness.percentage !== 100) throw new Error("Expected 100% required-evidence completeness.");
if (!result.exploration.alignedStudyAreas.includes("TECHNOLOGY")) throw new Error("Study Direction alignment missing.");
if (!result.exploration.alignedMajors.includes("major:informatics")) throw new Error("Major alignment missing.");
if (!result.claims.prohibited.some((claim) => claim.includes("deterministic career assignment"))) throw new Error("Deterministic career prohibition missing.");
if (!result.claims.prohibited.some((claim) => claim.includes("one-test-only"))) throw new Error("One-test deterministic prohibition missing.");
if ("overallScore" in result || "fitScore" in result || "careerScore" in result) throw new Error("Career Exploration must not expose invented universal/career scores.");

const insufficient = buildCareerExploration(
  { profile: { ...profile, status: "INSUFFICIENT", signals: [] }, direction, majorFit: { ...majorFit, status: "LIMITED_EVIDENCE" } },
  career,
);
if (insufficient.status !== "LIMITED_EVIDENCE") throw new Error("Insufficient evidence must remain limited.");
if (insufficient.evidenceStatus !== "INSUFFICIENT") throw new Error("Evidence status must be insufficient.");

console.log("Career Exploration contract      : PASS");
console.log("Cross-Test Profile boundary     : PASS");
console.log("Study Direction boundary        : PASS");
console.log("Major Fit boundary               : PASS");
console.log("Career profile versioning        : PASS");
console.log("Exploration-only claim model    : PASS");
console.log("No universal/raw average        : PASS");
console.log("Insufficient evidence safety     : PASS");
console.log("F.3.9 CAREER EXPLORATION GATE    : PASS");

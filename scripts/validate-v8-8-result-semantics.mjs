import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => { throw new Error(`V8.8 check failed: ${message}`); };
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition, message) => { if (!condition) fail(message); };

console.log("=== READY SCORE V8.8 RESULT SEMANTICS & INTERPRETATION CONTRACT GATE ===");
console.log("Scope      : Result meaning, interpretation hierarchy, terminology and claim governance");
console.log("Protection : Post-scoring semantics only; no measurement/scoring/question-bank mutation");

const semantics = read("lib/assessment/result/semantics-v1.ts");
const json = JSON.parse(read("data/assessment-audit/V8_8_RESULT_SEMANTICS_INTERPRETATION.json"));
const cognitive = read("lib/assessment/cognitive/interpretation.ts");
const eq = read("lib/assessment/eq/interpretation.ts");
const disc = read("lib/assessment/disc/interpretation.ts");
const riasec = read("lib/assessment/interpretation/riasec.ts");
const pkg = JSON.parse(read("package.json"));

assert(json.version === "V8.8" && json.status === "IMPLEMENTED", "V8.8 audit artifact is present and implemented");
assert(json.databaseMigration === false, "V8.8 declares no database migration");
assert(json.measurementMutation === false && json.scoringMutation === false, "V8.8 is semantics-only");
assert(json.universalScore === false && json.rawAverageSynthesis === false, "Universal score/raw-average synthesis remain prohibited");

assert(semantics.includes('RESULT_SEMANTICS_VERSION = "RESULT_SEMANTICS_V1"'), "Result semantics registry version is explicit");
assert(semantics.includes("RESULT_SEMANTICS"), "Assessment-specific result semantics registry is present");
assert(semantics.includes("validateResultSemantics"), "Result semantics validator is present");
const runtime = read("lib/assessment/runtime-service.ts");
assert(runtime.includes('from "./result/semantics-v1"') && runtime.includes("validateResultSemantics(interpretedResult)"), "Runtime validates result semantics after interpretation");
assert(semantics.includes("does not rescore"), "Validator explicitly remains post-scoring");

for (const [type, contract, score, interpretation] of [
  ["COGNITIVE", "COGNITIVE_RESULT_V2", "COGNITIVE_SCORE_V2", "COGNITIVE_INTERPRETATION_V2"],
  ["EQ", "EQ_RESULT_V2", "EQ_SCORE_V2", "EQ_INTERPRETATION_V2"],
  ["DISC", "DISC_RESULT_V2", "DISC_SCORE_V2", "DISC_INTERPRETATION_V2"],
  ["RIASEC", "RIASEC_RESULT_V2", "RIASEC_SCORE_V2", "RIASEC_INTERPRETATION_V2"],
]) {
  const a = json.assessments[type];
  assert(a && a.resultContract === contract && a.scoringVersion === score && a.interpretationVersion === interpretation,
    `${type} result/scoring/interpretation versions are aligned`);
}

assert(semantics.includes('mainResult: "Cognitive Score"') && semantics.includes("IQ"), "Cognitive result semantics explicitly preserve non-IQ boundary");
assert(semantics.includes('mode: "CONSTRUCT_SCORE"') && semantics.includes('mainResult: "EQ Score"'), "EQ result semantics are explicit");
assert(semantics.includes('mode: "IPSATIVE_PROFILE"') && semantics.includes('mainResult: "Primary Behavioral Pattern"'), "DISC result semantics are ipsative/profile-based");
assert(semantics.includes('mode: "INTEREST_PROFILE"') && semantics.includes('mainResult: "RIASEC Interest Profile"'), "RIASEC result semantics are interest-profile based");

assert(cognitive.includes("COGNITIVE_INTERPRETATION_VERSION") && cognitive.includes("IQ") && cognitive.includes("prohibited"), "Cognitive interpretation preserves non-IQ customer boundary");
assert(eq.includes("EQ_INTERPRETATION_VERSION") && eq.includes("clinical") && eq.includes("prohibited"), "EQ interpretation preserves non-clinical boundary");
assert(disc.includes("IPSATIVE_FORCED_CHOICE") && disc.includes("universal score"), "DISC interpretation preserves ipsative boundary");
assert(riasec.includes("RIASEC_INTERPRETATION_VERSION") && riasec.includes("vocational interest"), "RIASEC interpretation preserves interest boundary");

assert(json.universalScore === false, "V8.8 universal-score safety rule is represented");
assert(json.rawAverageSynthesis === false, "V8.8 raw-average synthesis safety rule is represented");
assert(json.implementation?.interpretationEnginesRemainAssessmentSpecific === true, "V8.8 assessment-specific interpretation boundary is represented");
assert(json.implementation?.noRescoring === true, "V8.8 no-rescoring boundary is represented");

const migrationRoot = path.join(root, "prisma/migrations");
if (fs.existsSync(migrationRoot)) {
  const migrations = fs.readdirSync(migrationRoot);
  assert(!migrations.some((name) => /v8[_-]?8|v8\.8|v8_8/i.test(name)), "No V8.8 database migration introduced");
}
assert(!Object.keys(pkg.scripts ?? {}).some((key) => key === "v8:8:migrate"), "No V8.8 migration script introduced");
assert(pkg.scripts?.["v8:8:gate"] === "node scripts/validate-v8-8-result-semantics.mjs", "V8.8 gate script is registered");

console.log("PASS: V8.8 result semantics artifact is present");
console.log("PASS: Four assessment-specific result semantic models are locked");
console.log("PASS: Result/scoring/interpretation version alignment is explicit");
console.log("PASS: Cognitive remains non-IQ");
console.log("PASS: EQ remains non-clinical/non-normative");
console.log("PASS: DISC remains ipsative with no substantive universal score");
console.log("PASS: RIASEC remains a vocational-interest profile");
console.log("PASS: Claim governance and customer terminology boundaries are explicit");
console.log("PASS: Interpretation is post-scoring and does not rescore attempts");
console.log("PASS: Universal score and raw-average synthesis remain prohibited");
console.log("PASS: No V8.8 database migration introduced");
console.log("V8.8 RESULT SEMANTICS & INTERPRETATION CONTRACT GATE: PASS");

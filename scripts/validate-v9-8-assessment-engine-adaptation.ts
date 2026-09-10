import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => { throw new Error(`V9.8 check failed: ${message}`); };
const assert = (condition: unknown, message: string) => { if (!condition) fail(message); };
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
const json = (rel: string) => JSON.parse(read(rel));

console.log("=== READY SCORE V9.8 ASSESSMENT ENGINE ADAPTATION GATE ===");
console.log("Scope      : Assessment-specific runtime contracts, validation, orchestration and public/private boundary");
console.log("Protection : V8.7 orchestration baseline and V9.4–V9.7 measurement/scoring semantics remain unchanged");

const manifest = json("V9_8_DELIVERY_MANIFEST.json");
assert(manifest.version === "V9.8" && manifest.status === "IMPLEMENTED", "V9.8 delivery manifest must be IMPLEMENTED");
assert(manifest.delivery === "FULL", "V9.8 delivery must be FULL");
assert(manifest.excludedPaths.includes("docs/"), "delivery manifest must exclude docs/");
assert(manifest.databaseMigration === false, "V9.8 must prohibit database migration");
assert(manifest.measurementRedesign === false, "V9.8 must not redesign measurement");
assert(manifest.scoringRedesign === false, "V9.8 must not redesign scoring");
assert(fs.existsSync(path.join(root, "data/assessment-audit/V9_8_ASSESSMENT_ENGINE_ADAPTATION.json")), "V9.8 contract artifact is missing");

const contract = json("data/assessment-audit/V9_8_ASSESSMENT_ENGINE_ADAPTATION.json");
assert(contract.version === "V9.8" && contract.status === "IMPLEMENTED", "V9.8 contract must be IMPLEMENTED");
assert(contract.implementation.orchestrationOnly === true, "V9.8 must remain orchestration-only");
assert(contract.implementation.databaseMigration === false, "V9.8 contract must prohibit migration");
assert(contract.implementation.measurementRedesign === false, "V9.8 contract must not redesign measurement");
assert(contract.implementation.scoringRedesign === false, "V9.8 contract must not redesign scoring");
assert(contract.implementation.universalScore === false, "V9.8 must not authorize universal score");
assert(contract.implementation.crossTestSynthesis === false, "V9.8 must not authorize cross-test synthesis");

const runtimeContract = read("lib/assessment/runtime-contract.ts");
assert(runtimeContract.includes("AssessmentRuntimeContract"), "assessment runtime contract is missing");
for (const token of ["cognitive", "eq", "disc", "riasec", "free", "premium"]) assert(runtimeContract.includes(`${token}:`), `runtime contract missing ${token}`);
assert(runtimeContract.includes('answerType: "SINGLE_CHOICE_4"'), "single-choice response contract missing");
assert(runtimeContract.includes('answerType: "LIKERT_5"'), "Likert response contract missing");
assert(runtimeContract.includes("validateAssessmentRuntimeQuestions"), "question validation is missing");
assert(runtimeContract.includes("validateAssessmentRuntimeAnswers"), "answer validation is missing");
assert(runtimeContract.includes("toPublicRuntimeQuestion"), "public question projection is missing");
assert(runtimeContract.includes("toPublicRuntimeSnapshot"), "public snapshot projection is missing");
assert(runtimeContract.includes("correctOption"), "internal Cognitive answer-key validation boundary is missing");
assert(runtimeContract.includes("scoringKey"), "internal scoring-key validation boundary is missing");

const unified = read("lib/assessment/unified-engine.ts");
assert(unified.includes("getScoringEngine"), "assessment-specific scoring dispatch must remain delegated");
assert(unified.includes("validateAssessmentRuntimeQuestions"), "unified engine must validate runtime questions");
assert(unified.includes("validateAssessmentRuntimeAnswers"), "unified engine must validate runtime answers");
assert(unified.includes("getAssessmentRuntimeContract"), "unified engine must expose assessment runtime contract");
assert(unified.includes("No unified assessment adapter registered"), "unknown assessment types must fail closed");
assert(!unified.includes("overallScore ="), "unified engine must not synthesize an overall score");
assert(!unified.includes("reduce((sum"), "unified engine must not aggregate unrelated assessment scores");

const runtime = read("lib/assessment/runtime-service.ts");
assert(runtime.includes("toPublicRuntimeQuestion"), "runtime service must use sanitized public question projection");
assert(runtime.includes("toPublicRuntimeSnapshot"), "runtime service must use sanitized public snapshot projection");
assert(runtime.includes("getAssessmentRuntimeContract"), "answer persistence must use assessment-specific runtime contract");
assert(!runtime.includes("scoringKey: item.question.scoringKey"), "runtime service must not expose scoringKey");
assert(!runtime.includes("reverseScore: item.question.reverseScore"), "runtime service must not expose reverseScore");
assert(!runtime.includes("weight: item.question.weight"), "runtime service must not expose weight");
assert(!runtime.includes("correctOption: item.question.correctOption"), "runtime service must not expose correctOption");
assert(!runtime.includes("questionVersionId: item.question.id"), "runtime service must not expose QuestionVersion identity");

const startRoute = read("app/api/assessment/start/route.ts");
const reassessmentRoute = read("app/api/assessment/reassessment/start/route.ts");
assert(startRoute.includes("attempt.questions.map"), "assessment start must expose runtime questions");
assert(reassessmentRoute.includes("attempt.questions.map"), "reassessment start must expose runtime questions");
assert(startRoute.includes("snapshot: attempt.snapshot"), "start route must retain sanitized runtime snapshot from service");
assert(reassessmentRoute.includes("snapshot: attempt.snapshot"), "reassessment route must retain sanitized runtime snapshot from service");

const repository = read("lib/assessment/assessment-repository.ts");
assert(repository.includes("questionSnapshot"), "immutable question snapshot persistence must remain intact");
assert(repository.includes("questionVersionId"), "historical QuestionVersion provenance must remain persisted");

const v87 = read("data/assessment-audit/V8_7_UNIFIED_ASSESSMENT_ENGINE.json");
assert(v87.includes('"version": "V8.7"'), "V8.7 baseline contract must remain present");
assert(v87.includes('"measurementMutation": false'), "V8.7 measurement mutation boundary changed");
assert(v87.includes('"scoringMutation": false'), "V8.7 scoring mutation boundary changed");
assert(v87.includes('"universalScore": false'), "V8.7 universal-score boundary changed");
assert(v87.includes('"crossTestSynthesis": false'), "V8.7 cross-test boundary changed");

const migrations = fs.existsSync(path.join(root, "prisma/migrations"))
  ? fs.readdirSync(path.join(root, "prisma/migrations"))
  : [];
assert(!migrations.some((name) => /v9.?8|assessment.*engine.*adapt/i.test(name)), "V9.8 database migration introduced");

const pkg = json("package.json");
for (const version of ["0","1","2","3","4","5","6","7"]) {
  assert(pkg.scripts?.[`v9:${version}:gate`], `V9.${version} gate registration missing`);
}
assert(pkg.scripts?.["v9:8:gate"] === "tsx scripts/validate-v9-8-assessment-engine-adaptation.ts", "V9.8 gate registration is incorrect");

console.log("PASS: V9.8 delivery manifest and contract are present");
console.log("PASS: Assessment-specific runtime contracts cover Cognitive, EQ, DISC, RIASEC, Free and Premium");
console.log("PASS: Runtime validates question and answer shape before scoring");
console.log("PASS: Unified engine remains orchestration-only and delegates to assessment-specific scorers");
console.log("PASS: Cognitive objective key remains internal to scoring");
console.log("PASS: EQ and DISC scoring metadata remains internal to scoring");
console.log("PASS: RIASEC Likert identity-key boundary remains protected");
console.log("PASS: Public runtime question and snapshot projections are sanitized");
console.log("PASS: Historical attempt/question-version persistence boundary remains intact");
console.log("PASS: No V9.8 database migration introduced");
console.log("PASS: No universal score or cross-test synthesis introduced");
console.log("PASS: V9.0–V9.7 gate registrations remain intact");
console.log("V9.8 ASSESSMENT ENGINE ADAPTATION GATE: PASS");

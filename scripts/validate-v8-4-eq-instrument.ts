import fs from "node:fs";
import path from "node:path";
import { ASSESSMENT_CONFIG } from "../lib/assessment-config";
import { EQ_SCORING_VERSION, EQ_DIMENSIONS } from "../lib/assessment/eq/scoring";
import { EQ_INTERPRETATION_VERSION } from "../lib/assessment/eq/interpretation";

function fail(message: string): never { throw new Error(`V8.4 check failed: ${message}`); }
function assert(condition: unknown, message: string) {
  if (!condition) fail(message);
  console.log(`PASS: ${message}`);
}

const root = process.cwd();
console.log("=== READY SCORE V8.4 EQ INSTRUMENT CONTRACT GATE ===");
console.log("Scope      : Situational-judgment EQ instrument, keyed ordinal scoring, runtime boundary");
console.log("Protection : EQ-only semantic versioning; Cognitive V2 and historical EQ V1 boundaries remain intact");

const auditPath = path.join(root, "data/assessment-audit/V8_4_EQ_INSTRUMENT.json");
const bankPath = path.join(root, "data/question-bank/eq/EQ_V2_SJT_PRODUCTION_BANK.json");
assert(fs.existsSync(auditPath), "V8.4 audit artifact is present");
assert(fs.existsSync(bankPath), "EQ V2 source bank is present");

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));

assert(audit.version === "V8.4" && audit.status === "IMPLEMENTED", "V8.4 audit status is implemented");
assert(ASSESSMENT_CONFIG.cognitive.version === "COGNITIVE_CONFIG_V2" &&
       ASSESSMENT_CONFIG.cognitive.scoringVersion === "COGNITIVE_SCORE_V2",
       "Cognitive V2 configuration/scoring boundary remains preserved");
assert(ASSESSMENT_CONFIG.eq.id === "eq-v2", "EQ configuration identity is V2");
assert(ASSESSMENT_CONFIG.eq.version === "EQ_CONFIG_V2", "EQ configuration version is V2");
assert(ASSESSMENT_CONFIG.eq.scoringVersion === EQ_SCORING_VERSION && EQ_SCORING_VERSION === "EQ_SCORE_V2", "EQ scoring version is V2");
assert(ASSESSMENT_CONFIG.eq.selectionAlgorithmVersion === "EQ_SELECTION_V2", "EQ selection algorithm version is V2");
assert(ASSESSMENT_CONFIG.eq.questionCount === 24, "EQ question count = 24");
assert(EQ_INTERPRETATION_VERSION === "EQ_INTERPRETATION_V2", "EQ interpretation version is V2");

assert(bank.length === 24, "EQ V2 bank contains 24 items");
assert(new Set(bank.map((q:any) => q.code)).size === 24, "EQ V2 logical question codes are unique");
for (const dimension of EQ_DIMENSIONS) {
  assert(bank.filter((q:any) => q.dimension === dimension).length === 6, `EQ ${dimension} coverage = 6`);
}
assert(bank.every((q:any) => q.type === "SCENARIO" && q.answerType === "SINGLE_CHOICE_4"), "EQ V2 response model is scenario single-choice");
assert(bank.every((q:any) => Array.isArray(q.options) && q.options.length === 4 && new Set(q.options).size === 4), "Every EQ item has exactly four unique options");
assert(bank.every((q:any) => Array.isArray(q.scoringKey) && q.scoringKey.length === 4), "Every EQ item has an explicit four-position scoring key");
assert(bank.every((q:any) => q.scoringKey.every((v:number) => Number.isInteger(v) && v >= 1 && v <= 4)), "EQ scoring keys use ordinal values 1–4");
assert(bank.every((q:any) => new Set(q.scoringKey).size === 4), "EQ scoring keys are item-specific permutations, not duplicated ordinal values");
assert(bank.every((q:any) => q.weight === 1), "EQ V2 item weights are explicitly equal");
assert(bank.every((q:any) => q.correctOption === undefined || q.correctOption === null), "EQ does not use objective correctOption metadata");
assert(bank.every((q:any) => q.reverseScore === undefined || q.reverseScore === false), "EQ V2 does not use reverse scoring");
assert(audit.safety.clinical_claim_allowed === false, "Clinical EQ claim remains prohibited");
assert(audit.safety.universal_score === false, "Universal score remains prohibited");

const migrationPath = path.join(root, "prisma/migrations/20260830150000_v8_4_eq_sjt_instrument/migration.sql");
assert(fs.existsSync(migrationPath), "V8.4 migration is present");
const migration = fs.readFileSync(migrationPath, "utf8");
assert(migration.includes("EQ_TAXONOMY_V2") && migration.includes("EQ_TAXONOMY_V1"), "Historical EQ V1 and active V2 taxonomy boundaries are explicit");
assert(migration.includes("RETIRED") && migration.includes("ACTIVE"), "Taxonomy lifecycle transition is explicit");
assert(migration.includes("ON CONFLICT"), "V8.4 taxonomy migration is idempotent");
assert(!migration.includes('ALTER TABLE "QuestionVersion"'), "V8.4 does not mutate QuestionVersion schema");
assert(!migration.includes("DROP TABLE"), "V8.4 migration contains no destructive table operation");

const sourceFiles = [
  "lib/assessment/eq/scoring.ts",
  "lib/assessment/eq/interpretation.ts",
  "lib/assessment/scoring/engine-v2.ts",
  "lib/assessment/question-engine.ts",
  "components/assessment/AssessmentRunner.tsx",
];
for (const rel of sourceFiles) assert(fs.existsSync(path.join(root, rel)), `Protected EQ runtime source present: ${rel}`);

const scoring = fs.readFileSync(path.join(root, "lib/assessment/eq/scoring.ts"), "utf8");
assert(scoring.includes("EQ_SCORE_V2") && scoring.includes("scoringKey[raw - 1]"), "EQ runtime uses item-specific keyed ordinal scoring");
assert(scoring.includes("(mean - 1) / 3") && scoring.includes("* 100"), "EQ dimension normalization is explicit 0–100");
assert(!scoring.includes("correctOption"), "EQ scoring does not depend on objective correctOption");

console.log("V8.4 EQ INSTRUMENT CONTRACT GATE: PASS");

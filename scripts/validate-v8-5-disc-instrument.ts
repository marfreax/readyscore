import fs from "node:fs";
import path from "node:path";
import { ASSESSMENT_CONFIG, LEGACY_ASSESSMENT_CONFIG_V1 } from "../lib/assessment-config";
import { DISC_SCORING_VERSION, DISC_DIMENSIONS } from "../lib/assessment/disc/scoring";
import { DISC_INTERPRETATION_VERSION } from "../lib/assessment/disc/interpretation";

function fail(message: string): never { throw new Error(`V8.5 check failed: ${message}`); }
function assert(condition: unknown, message: string) {
  if (!condition) fail(message);
  console.log(`PASS: ${message}`);
}

const root = process.cwd();
console.log("=== READY SCORE V8.5 DISC INSTRUMENT CONTRACT GATE ===");
console.log("Scope      : Situational forced-choice DISC instrument, item-specific dimension mapping, profile scoring");
console.log("Protection : DISC-only semantic versioning; Cognitive V2, EQ V2, and historical DISC V1 boundaries remain intact");

const auditPath = path.join(root, "data/assessment-audit/V8_5_DISC_INSTRUMENT.json");
const bankPath = path.join(root, "data/question-bank/disc/DISC_V2_SITUATIONAL_FORCED_CHOICE_PRODUCTION_BANK.json");
const migrationPath = path.join(root, "prisma/migrations/20260830160000_v8_5_disc_forced_choice_instrument/migration.sql");
assert(fs.existsSync(auditPath), "V8.5 audit artifact is present");
assert(fs.existsSync(bankPath), "DISC V2 source bank is present");
assert(fs.existsSync(migrationPath), "V8.5 migration is present");

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
const migration = fs.readFileSync(migrationPath, "utf8");

assert(audit.version === "V8.5" && audit.status === "IMPLEMENTED", "V8.5 audit status is implemented");
assert(ASSESSMENT_CONFIG.cognitive.version === "COGNITIVE_CONFIG_V2" &&
  ASSESSMENT_CONFIG.cognitive.scoringVersion === "COGNITIVE_SCORE_V2", "Cognitive V2 boundary remains preserved");
assert(ASSESSMENT_CONFIG.eq.version === "EQ_CONFIG_V2" &&
  ASSESSMENT_CONFIG.eq.scoringVersion === "EQ_SCORE_V2", "EQ V2 boundary remains preserved");
assert(ASSESSMENT_CONFIG.disc.id === "disc-v2", "DISC configuration identity is V2");
assert(ASSESSMENT_CONFIG.disc.version === "DISC_CONFIG_V2", "DISC configuration version is V2");
assert(ASSESSMENT_CONFIG.disc.scoringVersion === DISC_SCORING_VERSION && DISC_SCORING_VERSION === "DISC_SCORE_V2", "DISC scoring version is V2");
assert(ASSESSMENT_CONFIG.disc.selectionAlgorithmVersion === "DISC_SELECTION_V2", "DISC selection algorithm version is V2");
assert(ASSESSMENT_CONFIG.disc.questionCount === 24, "DISC question count = 24");
assert(DISC_INTERPRETATION_VERSION === "DISC_INTERPRETATION_V2", "DISC interpretation version is V2");

assert(LEGACY_ASSESSMENT_CONFIG_V1.disc.id === "disc-v1", "Historical DISC V1 configuration identity remains explicit");
assert(LEGACY_ASSESSMENT_CONFIG_V1.disc.version === "DISC_CONFIG_V1", "Historical DISC V1 configuration version remains explicit");
assert(LEGACY_ASSESSMENT_CONFIG_V1.disc.scoringVersion === "DISC_SCORE_V1", "Historical DISC V1 scoring boundary remains explicit");
assert(LEGACY_ASSESSMENT_CONFIG_V1.disc.selectionAlgorithmVersion === "DISC_SELECTION_V1", "Historical DISC V1 selection boundary remains explicit");

assert(bank.length === 24, "DISC V2 bank contains 24 items");
assert(new Set(bank.map((q: any) => q.code)).size === 24, "DISC V2 logical question codes are unique");
assert(bank.every((q: any) => q.dimension === "DISC"), "Every DISC V2 item uses DISC as its construct domain");
for (const target of ["D", "I", "S", "C"]) {
  assert(bank.filter((q: any) => q.subdomain === `TARGET_${target}`).length === 6, `DISC ${target} target-scenario coverage = 6`);
}
assert(bank.every((q: any) => q.type === "SCENARIO" && q.answerType === "SINGLE_CHOICE_4"), "DISC V2 response model is situational single-choice");
assert(bank.every((q: any) => Array.isArray(q.options) && q.options.length === 4 && new Set(q.options).size === 4), "Every DISC item has exactly four unique plausible response options");
assert(bank.every((q: any) => Array.isArray(q.optionDimensions) && q.optionDimensions.length === 4 && new Set(q.optionDimensions).size === 4), "Every DISC item maps four response options to four distinct dimensions");
assert(bank.every((q: any) => Array.isArray(q.scoringKey) && q.scoringKey.length === 4), "Every DISC item has a four-position dimension scoring key");
assert(bank.every((q: any) => q.scoringKey.every((v: number) => Number.isInteger(v) && v >= 1 && v <= 4) && new Set(q.scoringKey).size === 4), "DISC scoring keys are per-item permutations of D/I/S/C ordinals");
const uniqueKeys = new Set(bank.map((q: any) => JSON.stringify(q.scoringKey)));
assert(uniqueKeys.size > 1, "DISC option-position mapping varies across items");
assert(bank.every((q: any) => q.weight === 1), "DISC V2 item weights are explicitly equal");
assert(bank.every((q: any) => q.correctOption === undefined || q.correctOption === null), "DISC V2 has no objective correctOption metadata");
assert(bank.every((q: any) => q.reverseScore === undefined || q.reverseScore === false), "DISC V2 does not use reverse scoring");

assert(audit.measurement.responseModel === "situational_forced_choice", "DISC response model is explicitly situational forced-choice");
assert(audit.measurement.scoring === "Ipsative forced-choice count. Each selected option is mapped through the item-specific scoringKey to one DISC dimension. Dimension score = selected choices / 24 × 100.", "DISC scoring model is explicitly ipsative and item-keyed");
assert(audit.measurement.overallRule.includes("No substantive overall DISC score"), "DISC substantive result does not define an overall score");
assert(audit.measurement.normalization.includes("ipsative"), "DISC normalization explicitly identifies ipsative scores");
assert(audit.customerTerminology.prohibited.includes("universal score"), "Universal score remains prohibited");
assert(audit.safety.universal_score === false, "Universal score safety boundary is locked");
assert(audit.safety.ability_claim_allowed === false, "Ability claim remains prohibited");

assert(migration.includes("DISC_TAXONOMY_V2") && migration.includes("DISC_TAXONOMY_V1"), "Historical DISC V1 and active V2 taxonomy boundaries are explicit");
assert(migration.includes("RETIRED") && migration.includes("ACTIVE"), "DISC taxonomy lifecycle transition is explicit");
assert(migration.includes("ON CONFLICT"), "V8.5 taxonomy migration is idempotent");
assert(!migration.includes('ALTER TABLE "QuestionVersion"'), "V8.5 does not mutate QuestionVersion schema");
assert(!migration.includes("DROP TABLE"), "V8.5 migration contains no destructive table operation");

const sourceFiles = [
  "lib/assessment/disc/scoring.ts",
  "lib/assessment/disc/interpretation.ts",
  "lib/assessment/scoring/engine-v2.ts",
  "lib/assessment/question-engine.ts",
  "components/assessment/AssessmentRunner.tsx",
  "lib/admin-content-operations.ts",
  "lib/profile/adapters/disc.ts",
];
for (const rel of sourceFiles) assert(fs.existsSync(path.join(root, rel)), `Protected DISC runtime/admin source present: ${rel}`);

const scoring = fs.readFileSync(path.join(root, "lib/assessment/disc/scoring.ts"), "utf8");
const engine = fs.readFileSync(path.join(root, "lib/assessment/scoring/engine-v2.ts"), "utf8");
const questionEngine = fs.readFileSync(path.join(root, "lib/assessment/question-engine.ts"), "utf8");
const validation = fs.readFileSync(path.join(root, "lib/admin-content-operations.ts"), "utf8");
assert(scoring.includes("DISC_SCORE_V2") && scoring.includes("IPSATIVE_FORCED_CHOICE"), "DISC runtime scoring identity and profile model are V2");
assert(scoring.includes("question.scoringKey[raw - 1]"), "DISC runtime uses item-specific option-to-dimension mapping");
assert(scoring.includes("selectedCount / questions.length") && scoring.includes("* 100"), "DISC dimension scoring is explicit choice-share normalization");
assert(!scoring.includes("reverseScore ? 6 - raw"), "DISC V2 scoring does not use Likert reverse normalization");
assert(engine.includes('version: DISC_SCORING_VERSION') && engine.includes('question.scoringKey'), "Unified scoring engine routes DISC V2 through item-keyed scoring");
assert(questionEngine.includes('seededShuffle(runtimeQuestions, `${s}:DISC`).slice(0, config.questionCount)'), "DISC V2 selection is across the 24-item forced-choice bank");
assert(questionEngine.includes('selected[0]?.taxonomyVersion ?? "DISC_TAXONOMY_V2"'), "DISC V2 snapshot captures active taxonomy");
assert(validation.includes("DISC_FORCED_CHOICE_KEY_INVALID") && validation.includes("DISC_FORCED_CHOICE_MUST_NOT_HAVE_CORRECT_OPTION"), "Question-bank validation understands DISC forced-choice semantics");
const profileAdapter = fs.readFileSync(path.join(root, "lib/profile/adapters/disc.ts"), "utf8");
assert(profileAdapter.includes("DISC_RESULT_V2") && !profileAdapter.includes("DISC_RESULT_V1 measurement payload is missing"), "Cross-test DISC profile adapter accepts V2 result semantics");

console.log("V8.5 DISC INSTRUMENT CONTRACT GATE: PASS");

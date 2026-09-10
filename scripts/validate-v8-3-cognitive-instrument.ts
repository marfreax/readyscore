import fs from "node:fs";
import path from "node:path";

function fail(message: string): never {
  throw new Error(`V8.3 check failed: ${message}`);
}
function assert(condition: unknown, message: string): void {
  if (!condition) fail(message);
}
function read(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}
function json(rel: string): any {
  return JSON.parse(read(rel));
}

console.log("=== READY SCORE V8.3 COGNITIVE/IQ INSTRUMENT CONTRACT GATE ===");
console.log("Scope      : Objective Cognitive instrument, question bank, runtime scoring, result boundary");
console.log("Protection : Cognitive-only semantic versioning; historical V7/V8.2 contracts remain intact");

const spec = json("data/assessment-audit/V8_2_QUESTION_SCORING_ARCHITECTURE.json");
assert(spec.status === "LOCKED", "V8.2 architecture must remain LOCKED");
assert(spec.global_rules.no_universal_score === true, "V8.2 no_universal_score rule must remain locked");
assert(spec.global_rules.historical_question_versions_immutable === true, "Historical question immutability must remain locked");
assert(spec.assessments.cognitive.question_type === "SINGLE_CHOICE", "V8.2 Cognitive architecture must remain SINGLE_CHOICE");
assert(spec.assessments.cognitive.response_model === "objective_keyed", "V8.2 Cognitive response model must remain objective_keyed");

const integrity = json("data/assessment-audit/V8_3_COGNITIVE_INSTRUMENT.json");
assert(integrity.status === "IMPLEMENTED", "V8.3 integrity status must be IMPLEMENTED");
assert(integrity.questionCount === 24, "V8.3 integrity question count must be 24");
assert(integrity.scoringVersion === "COGNITIVE_SCORE_V2", "V8.3 integrity scoring version must be V2");
assert(integrity.resultContract === "COGNITIVE_RESULT_V2", "V8.3 result contract must be V2");
assert(integrity.iqClaimAllowed === false, "V8.3 must not authorize an IQ claim");
assert(integrity.databaseMigration === true, "V8.3 objective metadata requires its declared additive migration");

const bank = json("data/question-bank/cognitive/COGNITIVE_V2_PRODUCTION_BANK.json");
assert(Array.isArray(bank) && bank.length === 24, "Cognitive V2 bank must contain exactly 24 items");
const dims = ["VERBAL_REASONING", "NUMERICAL_REASONING", "LOGICAL_REASONING", "ABSTRACT_REASONING"];
for (const d of dims) {
  const rows = bank.filter((q: any) => q.dimension === d);
  assert(rows.length === 6, `Cognitive dimension ${d} must contain 6 items`);
}
assert(new Set(bank.map((q: any) => q.code)).size === 24, "Cognitive question identities must be unique");
assert(new Set(bank.map((q: any) => q.id)).size === 24, "Cognitive question IDs must be unique");
assert(bank.every((q: any) => q.type === "SINGLE_CHOICE"), "Cognitive V2 must not use Likert question type");
assert(bank.every((q: any) => q.answerType === "SINGLE_CHOICE_4"), "Cognitive V2 must use SINGLE_CHOICE_4");
assert(bank.every((q: any) => q.status === "PUBLISHED"), "Cognitive V2 bank must be publish-ready");
assert(bank.every((q: any) => q.scoringKey === undefined), "Cognitive V2 source bank must not depend on legacy scoringKey");
assert(bank.every((q: any) => Array.isArray(q.options) && q.options.length === 4), "Every Cognitive item must have exactly four options");
assert(bank.every((q: any) => new Set(q.options).size === 4), "Every Cognitive item must have four unique options");
assert(bank.every((q: any) => Number.isInteger(q.correctOption) && q.correctOption >= 1 && q.correctOption <= 4), "Every Cognitive item must have one valid hidden objective key");
assert(bank.every((q: any) => q.weight > 0), "Every Cognitive item must have positive weight");
assert(bank.every((q: any) => q.reverseScore === undefined || q.reverseScore === false), "Cognitive objective items must not use reverse scoring");
const keyDistribution = Object.fromEntries([1, 2, 3, 4].map((position) => [
  position,
  bank.filter((q: any) => q.correctOption === position).length,
]));
assert(Object.values(keyDistribution).every((count) => count === 6), "Correct-option positions must be balanced 6/6/6/6");

const scoring = read("lib/assessment/cognitive/scoring.ts");
assert(scoring.includes('COGNITIVE_SCORING_VERSION = "COGNITIVE_SCORE_V2"'), "Cognitive scoring version must be V2");
assert(scoring.includes("correctOption"), "Cognitive scoring must use explicit correctOption");
assert(scoring.includes("raw === q.correctOption"), "Cognitive scoring must score objective correctness");
assert(!scoring.includes("normalize(value: number)"), "Legacy Likert normalization must not remain in Cognitive V2 scoring");
assert(scoring.includes("answers.length !== questions.length"), "Cognitive scoring must enforce complete response count");

const runner = read("components/assessment/AssessmentRunner.tsx");
assert(runner.includes("question.options"), "Customer runtime must render Cognitive options");
assert(runner.includes("SINGLE_CHOICE"), "Customer runtime must recognize objective Cognitive answer type");
assert(runner.includes("Setiap soal memiliki satu jawaban yang benar"), "Cognitive instruction must state objective response semantics");

const config = read("lib/assessment-config.ts");
assert(config.includes('version: "COGNITIVE_CONFIG_V2"'), "Cognitive configuration must be V2");
assert(config.includes('scoringVersion: "COGNITIVE_SCORE_V2"'), "Cognitive configuration scoring version must be V2");
assert(config.includes('selectionAlgorithmVersion: "COGNITIVE_SELECTION_V2"'), "Cognitive selection version must be V2");
assert(config.includes('version: "DISC_CONFIG_V1"'), "Unchanged DISC configuration boundary must remain V1");
assert(config.includes('version: "EQ_CONFIG_V1"'), "Unchanged EQ configuration boundary must remain V1");
assert(config.includes('version: "RIASEC_CONFIG_V1"'), "Unchanged RIASEC configuration boundary must remain V1");
assert(config.includes("LEGACY_ASSESSMENT_CONFIG_V1"), "Historical V1 configuration registry must remain explicit");

const engine = read("lib/assessment/question-engine.ts");
assert(engine.includes('type === "cognitive"'), "Cognitive selector branch must remain explicit");
assert(engine.includes('"COGNITIVE_TAXONOMY_V2"'), "Cognitive snapshot must use V2 taxonomy");
assert(engine.includes("q.answerType"), "Question engine must preserve assessment-specific answer type");
assert(engine.includes("q.scale"), "Question engine must preserve assessment-specific scale");

const catalog = read("lib/catalog/question-bank.ts");
assert(catalog.includes("identity.taxonomyVersion"), "Published question bank must be scoped to the active taxonomy boundary");
assert(catalog.includes("taxonomyVersion: identity.taxonomyVersion"), "Cognitive V2 must not mix with historical Cognitive V1 questions");

const contentValidation = read("lib/admin-content-operations.ts");
assert(contentValidation.includes("OBJECTIVE_OPTIONS_INVALID"), "Admin content validation must support objective options");
assert(contentValidation.includes("OBJECTIVE_CORRECT_OPTION_INVALID"), "Admin content validation must support objective answer keys");

const repository = read("lib/question-bank-repository.ts");
assert(repository.includes("answerType: v.answerType"), "Repository must preserve answerType");
assert(repository.includes("scale: v.scale.map(Number)"), "Repository must preserve objective scale");
assert(repository.includes("options: Array.isArray(v.options)"), "Repository must preserve objective options");
assert(repository.includes("correctOption: typeof v.correctOption"), "Repository must preserve hidden objective answer key");
assert(repository.includes("answerType: input.answerType"), "Question version writes must preserve answer type");

const runtime = read("lib/assessment/runtime-service.ts");
assert(runtime.includes('targetQuestion?.answerType === "SINGLE_CHOICE_4" ? 4 : 5'), "Answer validation must be assessment/question-type aware");
assert(runtime.includes("options: item.question.options"), "Runtime must expose options");
assert(!runtime.includes("correctOption: item.question.correctOption"), "Runtime must never expose correctOption");

const assessmentRepository = read("lib/assessment/assessment-repository.ts");
assert(assessmentRepository.includes("correctOption: question.correctOption"), "Attempt snapshot must preserve hidden answer key server-side");
assert(assessmentRepository.includes("answerType: question.answerType"), "Attempt snapshot must preserve response model");

const prisma = read("prisma/schema.prisma");
assert(prisma.includes("options       Json?") && prisma.includes("correctOption Int?"), "QuestionVersion must support objective option metadata");

const migrationPath = "prisma/migrations/20260830133000_v8_3_cognitive_objective_items/migration.sql";
assert(fs.existsSync(path.join(process.cwd(), migrationPath)), "V8.3 migration must be present");
const migration = read(migrationPath);
assert(migration.includes('ADD COLUMN "options" JSONB'), "V8.3 migration must add options");
assert(migration.includes('ADD COLUMN "correctOption" INTEGER'), "V8.3 migration must add correctOption");
assert(migration.includes("QuestionVersion_correctOption_range"), "V8.3 migration must constrain correctOption to 1–4");
assert(migration.includes("COGNITIVE_TAXONOMY_V2"), "V8.3 migration must establish Cognitive taxonomy V2");
assert(migration.includes("COGNITIVE_TAXONOMY_V1"), "V8.3 migration must explicitly retire V1 as an active selection source");
assert(!/UPDATE\s+"QuestionVersion"/i.test(migration), "V8.3 migration must not rewrite historical QuestionVersion rows");

const pkg = json("package.json");
assert(pkg.scripts?.["v8:3:gate"] === "tsx scripts/validate-v8-3-cognitive-instrument.ts", "V8.3 gate script must be registered");
assert(pkg.scripts?.["v8:3:migrate"] === "prisma migrate deploy", "V8.3 migration command must be explicit");
assert(pkg.scripts?.["v8:3:seed:cognitive"] === "tsx scripts/seed-v8-3-cognitive.ts", "V8.3 seed command must be explicit");
assert(pkg.scripts?.["e2e:v8:3:cognitive"] === "node scripts/e2e-cognitive-runtime.mjs", "V8.3 Cognitive E2E must be registered");

const seed = read("scripts/seed-v8-3-cognitive.ts");
assert(seed.includes("prisma.$transaction"), "Cognitive V2 seed must be transactional");
assert(seed.includes("COGNITIVE_V2_SEED_DUPLICATE"), "Cognitive V2 seed must reject duplicate logical identities");
assert(seed.includes("scoringKey: [item.correctOption]"), "Objective key must be persisted as internal scoring metadata");

const interpretation = read("lib/assessment/cognitive/interpretation.ts");
assert(interpretation.includes("COGNITIVE_INTERPRETATION_V2"), "Cognitive interpretation must be V2");
assert(interpretation.includes("bukan skor IQ"), "IQ terminology boundary must remain explicit");

console.log("PASS: V8.2 architecture remains locked");
console.log("PASS: Cognitive V2 has 24 objective items / 4×6 balanced blueprint");
console.log("PASS: Correct-option positions are balanced 6/6/6/6");
console.log("PASS: Every Cognitive item has exactly 4 unique options and one hidden answer key");
console.log("PASS: Cognitive V2 source bank is independent of legacy scoringKey");
console.log("PASS: Cognitive question selection is isolated to COGNITIVE_TAXONOMY_V2");
console.log("PASS: Cognitive scoring is objective correct/incorrect, not Likert normalization");
console.log("PASS: Cognitive runtime renders item-specific options without exposing answer keys");
console.log("PASS: Cognitive configuration/scoring/interpretation versions are V2");
console.log("PASS: Historical V1 configuration boundaries remain explicit");
console.log("PASS: Additive V8.3 migration and transactional seed are version-safe");
console.log("PASS: IQ claim remains prohibited");
console.log("V8.3 COGNITIVE/IQ INSTRUMENT CONTRACT GATE: PASS");

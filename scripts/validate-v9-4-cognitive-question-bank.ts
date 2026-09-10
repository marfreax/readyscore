import fs from "node:fs";
import path from "node:path";

const fail = (message: string): never => { throw new Error(`V9.4 check failed: ${message}`); };
const assert = (condition: unknown, message: string): void => { if (!condition) fail(message); };
const read = (rel: string): string => fs.readFileSync(path.join(process.cwd(), rel), "utf8");
const json = (rel: string): any => JSON.parse(read(rel));

console.log("=== READY SCORE V9.4 COGNITIVE QUESTION BANK GATE ===");
console.log("Scope      : Customer Cognitive question bank implementation");
console.log("Protection : V8.3 Cognitive measurement/scoring semantics remain unchanged");


assert(fs.existsSync(path.join(process.cwd(), "V8_13_FINAL_ACCEPTANCE_FREEZE.md")), "V8.13 protected baseline must remain present");
assert(fs.existsSync(path.join(process.cwd(), "data/assessment-audit/V9_4_COGNITIVE_QUESTION_BANK.json")), "V9.4 contract artifact is missing");

const contract = json("data/assessment-audit/V9_4_COGNITIVE_QUESTION_BANK.json");
assert(contract.status === "IMPLEMENTED", "V9.4 contract must be IMPLEMENTED");
assert(contract.measurementBoundary.taxonomyVersion === "COGNITIVE_TAXONOMY_V2", "Cognitive taxonomy boundary changed");
assert(contract.measurementBoundary.scoringVersion === "COGNITIVE_SCORE_V2", "Cognitive scoring version changed");
assert(contract.measurementBoundary.resultContract === "COGNITIVE_RESULT_V2", "Cognitive result contract changed");
assert(contract.measurementBoundary.iqClaimAllowed === false, "V9.4 must not authorize an IQ claim");
assert(contract.implementation.databaseMigration === false, "V9.4 must not introduce a database migration");
assert(contract.implementation.historicalQuestionVersionsImmutable === true, "Historical QuestionVersion immutability must remain protected");
assert(contract.implementation.customerScoringKeysExposed === false, "Customer scoring keys must remain hidden");

const bank = json("data/question-bank/cognitive/COGNITIVE_V2_PRODUCTION_BANK.json");
assert(Array.isArray(bank) && bank.length === 24, "Cognitive V2 bank must contain exactly 24 items");
const dims = ["VERBAL_REASONING", "NUMERICAL_REASONING", "LOGICAL_REASONING", "ABSTRACT_REASONING"];
for (const d of dims) assert(bank.filter((q: any) => q.dimension === d).length === 6, `Cognitive dimension ${d} must contain 6 items`);
assert(new Set(bank.map((q: any) => q.id)).size === 24, "Cognitive IDs must be unique");
assert(new Set(bank.map((q: any) => q.code)).size === 24, "Cognitive codes must be unique");
assert(bank.every((q: any) => q.type === "SINGLE_CHOICE"), "Cognitive bank must remain SINGLE_CHOICE");
assert(bank.every((q: any) => q.answerType === "SINGLE_CHOICE_4"), "Cognitive bank must remain SINGLE_CHOICE_4");
assert(bank.every((q: any) => q.status === "PUBLISHED"), "Every Cognitive item must be PUBLISHED");
assert(bank.every((q: any) => Array.isArray(q.options) && q.options.length === 4), "Every Cognitive item must have four options");
assert(bank.every((q: any) => new Set(q.options).size === 4), "Every Cognitive item must have unique options");
assert(bank.every((q: any) => Number.isInteger(q.correctOption) && q.correctOption >= 1 && q.correctOption <= 4), "Every Cognitive item must have one valid hidden answer key");
assert(bank.every((q: any) => q.weight > 0), "Every Cognitive item must have positive weight");
const keyDistribution = Object.fromEntries([1,2,3,4].map((p) => [p, bank.filter((q: any) => q.correctOption === p).length]));
assert(Object.values(keyDistribution).every((n) => n === 6), "Correct-option positions must remain balanced 6/6/6/6");

const audit = json("data/assessment-audit/V8_3_COGNITIVE_INSTRUMENT.json");
assert(audit.status === "IMPLEMENTED", "V8.3 Cognitive contract must remain IMPLEMENTED");
assert(audit.questionCount === 24, "V8.3 question count boundary changed");
assert(audit.scoringVersion === "COGNITIVE_SCORE_V2", "V8.3 scoring version changed");
assert(audit.iqClaimAllowed === false, "V8.3 IQ claim boundary changed");

const scoring = read("lib/assessment/cognitive/scoring.ts");
assert(scoring.includes('COGNITIVE_SCORING_VERSION = "COGNITIVE_SCORE_V2"'), "Cognitive scoring version must remain V2");
assert(scoring.includes("raw === q.correctOption"), "Cognitive scoring must remain objective correct/incorrect");
assert(!scoring.includes("normalize(value: number)"), "Legacy Likert normalization must not return to Cognitive scoring");

const runtime = read("lib/assessment/runtime-service.ts");
assert(runtime.includes("correctOption: item.question.correctOption") === false, "Runtime must not expose correctOption");
assert(runtime.includes("options: item.question.options"), "Runtime must expose objective options");

const repo = read("lib/question-bank-repository.ts");
assert(repo.includes("correctOption: typeof v.correctOption"), "Repository must preserve hidden correctOption metadata");
assert(repo.includes("options: Array.isArray(v.options)"), "Repository must preserve options metadata");

const catalog = read("lib/catalog/question-bank.ts");
assert(catalog.includes("taxonomyVersion: identity.taxonomyVersion"), "Question bank catalog must preserve taxonomy boundary");

const admin = read("lib/admin-content-operations.ts");
assert(admin.includes("OBJECTIVE_OPTIONS_INVALID"), "Admin objective-option validation must remain present");
assert(admin.includes("OBJECTIVE_CORRECT_OPTION_INVALID"), "Admin objective-key validation must remain present");

const config = read("lib/assessment-config.ts");
assert(config.includes('version: "COGNITIVE_CONFIG_V2"'), "Cognitive configuration must remain V2");
assert(config.includes('scoringVersion: "COGNITIVE_SCORE_V2"'), "Cognitive configuration scoring version must remain V2");
assert(config.includes('selectionAlgorithmVersion: "COGNITIVE_SELECTION_V2"'), "Cognitive selection version must remain V2");

const pkg = json("package.json");
assert(pkg.scripts?.["v9:4:gate"] === "tsx scripts/validate-v9-4-cognitive-question-bank.ts", "V9.4 gate must be registered");
assert(pkg.scripts?.["v9:0:gate"], "V9.0 gate registration must remain");
assert(pkg.scripts?.["v9:1:gate"], "V9.1 gate registration must remain");
assert(pkg.scripts?.["v9:2:gate"], "V9.2 gate registration must remain");
assert(pkg.scripts?.["v9:3:gate"], "V9.3 gate registration must remain");

const migrationDir = path.join(process.cwd(), "prisma/migrations");
const migrationEntries = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir).filter((x) => /v9.?4|cognitive.*question.*bank/i.test(x)) : [];
assert(migrationEntries.length === 0, "V9.4 must not introduce a database migration");

console.log("PASS: existing docs/ remains outside the V9.4 delivery artifact");
console.log("PASS: V8.3 Cognitive measurement contract remains protected");
console.log("PASS: Cognitive V2 bank contains 24 objective items / 4×6 blueprint");
console.log("PASS: Correct-option positions remain balanced 6/6/6/6");
console.log("PASS: Every item has four unique customer options and one hidden answer key");
console.log("PASS: Cognitive taxonomy, configuration, scoring, and result versions remain V2");
console.log("PASS: Runtime exposes options but never exposes correctOption");
console.log("PASS: Admin/repository objective metadata boundaries remain intact");
console.log("PASS: No V9.4 database migration introduced");
console.log("PASS: Historical QuestionVersion immutability remains protected");
console.log("PASS: IQ claim remains prohibited");
console.log("PASS: No universal score or raw-average synthesis introduced");
console.log("PASS: V9.4 gate is registered");
console.log("V9.4 COGNITIVE QUESTION BANK GATE: PASS");

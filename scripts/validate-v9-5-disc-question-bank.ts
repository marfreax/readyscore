import fs from "node:fs";
import path from "node:path";

const fail = (message: string): never => { throw new Error(`V9.5 check failed: ${message}`); };
const assert = (condition: unknown, message: string): void => { if (!condition) fail(message); };
const read = (rel: string): string => fs.readFileSync(path.join(process.cwd(), rel), "utf8");
const json = (rel: string): any => JSON.parse(read(rel));

console.log("=== READY SCORE V9.5 DISC QUESTION BANK GATE ===");
console.log("Scope      : Customer DISC question bank implementation");
console.log("Protection : V8.5 DISC measurement/scoring semantics remain unchanged");

assert(fs.existsSync(path.join(process.cwd(), "V8_13_FINAL_ACCEPTANCE_FREEZE.md")), "V8.13 protected baseline must remain present");
const deliveryManifest = json("V9_5_DELIVERY_MANIFEST.json");
assert(Array.isArray(deliveryManifest.excludedPaths) && deliveryManifest.excludedPaths.includes("docs/"), "V9.5 delivery manifest must exclude docs/");
assert(fs.existsSync(path.join(process.cwd(), "data/assessment-audit/V9_5_DISC_QUESTION_BANK.json")), "V9.5 contract artifact is missing");

const contract = json("data/assessment-audit/V9_5_DISC_QUESTION_BANK.json");
assert(contract.status === "IMPLEMENTED", "V9.5 contract must be IMPLEMENTED");
assert(contract.measurementBoundary.taxonomyVersion === "DISC_TAXONOMY_V2", "DISC taxonomy boundary changed");
assert(contract.measurementBoundary.questionBankVersion === "DISC_V2", "DISC question bank version changed");
assert(contract.measurementBoundary.scoringVersion === "DISC_SCORE_V2", "DISC scoring version changed");
assert(contract.measurementBoundary.resultContract === "DISC_RESULT_V2", "DISC result contract changed");
assert(contract.measurementBoundary.overallScoreSubstantive === false, "V9.5 must not authorize a substantive overall DISC score");
assert(contract.implementation.databaseMigration === false, "V9.5 must not introduce a database migration");
assert(contract.implementation.historicalQuestionVersionsImmutable === true, "Historical QuestionVersion immutability must remain protected");
assert(contract.implementation.customerScoringKeysExposed === false, "Customer scoring keys must remain hidden");
assert(contract.implementation.customerDimensionMappingsExposed === false, "Customer dimension mappings must remain hidden");

const bank = json("data/question-bank/disc/DISC_V2_SITUATIONAL_FORCED_CHOICE_PRODUCTION_BANK.json");
assert(Array.isArray(bank) && bank.length === 24, "DISC V2 bank must contain exactly 24 items");
assert(new Set(bank.map((q: any) => q.id)).size === 24, "DISC IDs must be unique");
assert(new Set(bank.map((q: any) => q.code)).size === 24, "DISC codes must be unique");
assert(bank.every((q: any) => q.version === "DISC_V2"), "Every DISC item must remain DISC_V2");
assert(bank.every((q: any) => q.dimension === "DISC"), "Every DISC item must use DISC domain");
assert(bank.every((q: any) => q.type === "SCENARIO"), "Every DISC item must remain SCENARIO");
assert(bank.every((q: any) => q.answerType === "SINGLE_CHOICE_4"), "Every DISC item must remain SINGLE_CHOICE_4");
assert(bank.every((q: any) => q.weight === 1), "Every DISC item must have equal weight 1");
assert(bank.every((q: any) => q.difficulty === "MEDIUM"), "DISC production difficulty boundary changed");

const targets = ["TARGET_D", "TARGET_I", "TARGET_S", "TARGET_C"];
for (const target of targets) assert(bank.filter((q: any) => q.subdomain === target).length === 6, `DISC target ${target} must contain 6 items`);

const dimensions = ["D", "I", "S", "C"];
const permutationCounts = new Map<string, number>();
const positionDimensionCounts: Record<string, Record<string, number>> = Object.fromEntries(
  [1,2,3,4].map((position) => [String(position), Object.fromEntries(dimensions.map((d) => [d, 0]))]),
);

for (const q of bank) {
  assert(Array.isArray(q.options) && q.options.length === 4, `DISC item ${q.id} requires four options`);
  assert(new Set(q.options).size === 4, `DISC item ${q.id} requires four unique options`);
  assert(Array.isArray(q.optionDimensions) && q.optionDimensions.length === 4, `DISC item ${q.id} requires four internal dimension mappings`);
  assert(q.optionDimensions.every((d: any) => dimensions.includes(d)) && new Set(q.optionDimensions).size === 4, `DISC item ${q.id} requires a D/I/S/C permutation`);
  assert(Array.isArray(q.scoringKey) && q.scoringKey.length === 4, `DISC item ${q.id} requires a four-position scoring key`);
  assert(q.scoringKey.every((v: any) => Number.isInteger(v) && v >= 1 && v <= 4) && new Set(q.scoringKey).size === 4, `DISC item ${q.id} scoringKey must be a permutation of 1..4`);
  assert(q.scoringKey.every((v: number, index: number) => v === dimensions.indexOf(q.optionDimensions[index]) + 1), `DISC item ${q.id} scoringKey must match its internal option mapping`);
  assert(q.correctOption === undefined, `DISC item ${q.id} must not contain correctOption`);
  const permutation = q.optionDimensions.join("");
  permutationCounts.set(permutation, (permutationCounts.get(permutation) ?? 0) + 1);
  q.optionDimensions.forEach((dimension: string, index: number) => { positionDimensionCounts[String(index + 1)][dimension] += 1; });
}

assert(permutationCounts.size >= 4, "DISC option mapping must use multiple item-specific permutations");
for (const position of [1,2,3,4]) {
  for (const dimension of dimensions) {
    assert(positionDimensionCounts[String(position)][dimension] === 6, `DISC ${dimension} must appear exactly 6 times at option position ${position}`);
  }
}

const audit = json("data/assessment-audit/V8_5_DISC_INSTRUMENT.json");
assert(audit.status === "IMPLEMENTED", "V8.5 DISC contract must remain IMPLEMENTED");
assert(audit.measurement.responseModel === "situational_forced_choice", "V8.5 response model changed");
assert(audit.measurement.questionCount === 24, "V8.5 question count boundary changed");
assert(audit.versioning.questionBankVersion === "DISC_V2", "V8.5 question bank version changed");
assert(audit.versioning.taxonomyVersion === "DISC_TAXONOMY_V2", "V8.5 taxonomy version changed");
assert(audit.versioning.scoringVersion === "DISC_SCORE_V2", "V8.5 scoring version changed");
assert(audit.safety.universal_score === false, "V8.5 universal score boundary changed");
assert(audit.safety.ability_claim_allowed === false, "V8.5 ability claim boundary changed");

const scoring = read("lib/assessment/disc/scoring.ts");
assert(scoring.includes('DISC_SCORING_VERSION = "DISC_SCORE_V2"'), "DISC scoring version must remain V2");
assert(scoring.includes("question.scoringKey[raw - 1]"), "DISC scoring must remain item-keyed forced-choice");
assert(scoring.includes('profileModel: "IPSATIVE_FORCED_CHOICE"'), "DISC profile model must remain ipsative forced-choice");
assert(scoring.includes('scoreMeaning: "SHARE_OF_FORCED_CHOICES"'), "DISC score meaning must remain share of forced choices");
assert(!scoring.includes("correctOption"), "DISC scoring implementation must not introduce objective correctOption semantics");

const runtime = read("lib/assessment/runtime-service.ts");
assert(runtime.includes("options: item.question.options"), "Runtime must expose DISC customer options");
assert(!runtime.includes("scoringKey: item.question.scoringKey"), "Runtime must not expose scoringKey");
assert(!runtime.includes("optionDimensions: item.question.optionDimensions"), "Runtime must not expose optionDimensions");
assert(!runtime.includes("correctOption: item.question.correctOption"), "Runtime must not expose correctOption");

const admin = read("lib/admin-content-operations.ts");
assert(admin.includes("DISC_FORCED_CHOICE_KEY_INVALID"), "DISC forced-choice validation branch must remain present");
assert(admin.includes("DISC_FORCED_CHOICE_MUST_NOT_HAVE_CORRECT_OPTION"), "DISC correctOption prohibition must remain present");

const config = read("lib/assessment-config.ts");
assert(config.includes('version: "DISC_CONFIG_V2"'), "DISC configuration must remain V2");
assert(config.includes('scoringVersion: "DISC_SCORE_V2"'), "DISC configuration scoring version must remain V2");
assert(config.includes('selectionAlgorithmVersion: "DISC_SELECTION_V2"'), "DISC selection version must remain V2");

const pkg = json("package.json");
assert(pkg.scripts?.["v9:5:gate"] === "tsx scripts/validate-v9-5-disc-question-bank.ts", "V9.5 gate must be registered");
for (const gate of ["v9:0:gate", "v9:1:gate", "v9:2:gate", "v9:3:gate", "v9:4:gate"]) {
  assert(pkg.scripts?.[gate], `${gate} registration must remain`);
}

const migrationDir = path.join(process.cwd(), "prisma/migrations");
const migrationEntries = fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).filter((x) => /v9.?5|disc.*question.*bank/i.test(x))
  : [];
assert(migrationEntries.length === 0, "V9.5 must not introduce a database migration");

// This gate checks implementation semantics, not prohibition text in documentation.
// The V9.5 contract and architecture deliberately contain the words "universal score"
// and "raw-average synthesis" as explicit non-goals/prohibitions; scanning those prose
// strings would therefore create a false positive.
const contractText = read("data/assessment-audit/V9_5_DISC_QUESTION_BANK.json");
const architectureText = read("architecture/phase-9.5/ReadyScore_V9_5_DISC_Question_Bank.md");
const scoringText = read("lib/assessment/disc/scoring.ts");
assert(!/universal[_ -]?score\s*[:=]\s*true/i.test(contractText), "V9.5 must not authorize a universal score");
assert(!/raw[-_ ]?average\s*[:=]\s*true/i.test(contractText), "V9.5 must not authorize raw-average synthesis");
assert(!/function\s+.*raw[-_ ]?average|raw[-_ ]?average\s*\(/i.test(scoringText), "V9.5 scoring must not introduce raw-average synthesis");
assert(!/universal[_ -]?score\s*[:=]\s*true|raw[-_ ]?average\s*[:=]\s*true/i.test(architectureText), "V9.5 architecture must not authorize prohibited synthesis");

console.log("PASS: delivery manifest excludes docs/ from the V9.5 delivery artifact");
console.log("PASS: V8.5 DISC measurement contract remains protected");
console.log("PASS: DISC V2 bank contains 24 situational forced-choice items");
console.log("PASS: Target scenario coverage remains 6/6/6/6");
console.log("PASS: Every item has four unique customer options");
console.log("PASS: Every item has an item-specific D/I/S/C permutation");
console.log("PASS: DISC option positions remain balanced 6/6/6/6 per dimension");
console.log("PASS: DISC items contain no correctOption answer key");
console.log("PASS: DISC taxonomy, configuration, scoring, selection, and result versions remain V2");
console.log("PASS: Runtime exposes customer options but not internal DISC mapping metadata");
console.log("PASS: Admin forced-choice validation boundary remains intact");
console.log("PASS: No V9.5 database migration introduced");
console.log("PASS: Historical QuestionVersion immutability remains protected");
console.log("PASS: No substantive overall DISC score introduced");
console.log("PASS: No universal score or raw-average synthesis introduced");
console.log("PASS: V9.5 gate is registered and V9.0–V9.4 gates remain registered");
console.log("V9.5 DISC QUESTION BANK GATE: PASS");

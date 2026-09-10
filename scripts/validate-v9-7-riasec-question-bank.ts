import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => {
  throw new Error(`V9.7 check failed: ${message}`);
};
const assert = (condition: unknown, message: string): void => {
  if (!condition) fail(message);
};
const read = (rel: string): string => fs.readFileSync(path.join(root, rel), "utf8");
const json = (rel: string): any => JSON.parse(read(rel));

console.log("=== READY SCORE V9.7 RIASEC QUESTION BANK GATE ===");
console.log("Scope      : RIASEC question bank quality and runtime hardening");
console.log("Protection : V8.6 RIASEC measurement/scoring semantics remain unchanged");

const manifest = json("V9_7_DELIVERY_MANIFEST.json");
assert(Array.isArray(manifest.excludedPaths) && manifest.excludedPaths.includes("docs/"), "delivery manifest must exclude docs/");
assert(manifest.databaseMigration === false, "V9.7 delivery manifest must prohibit database migration");
assert(fs.existsSync(path.join(root, "data/assessment-audit/V9_7_RIASEC_QUESTION_BANK.json")), "V9.7 contract artifact is missing");
const contract = json("data/assessment-audit/V9_7_RIASEC_QUESTION_BANK.json");
assert(contract.version === "V9.7" && contract.status === "IMPLEMENTED", "V9.7 contract must be IMPLEMENTED");
assert(contract.implementation.databaseMigration === false, "V9.7 must not introduce a database migration");
assert(contract.implementation.measurementRedesign === false, "V9.7 must not redesign measurement");
assert(contract.implementation.scoringRedesign === false, "V9.7 must not redesign scoring");
assert(contract.measurementBoundary.questionBankVersion === "RIASEC_QB_V2", "RIASEC question bank version changed");
assert(contract.measurementBoundary.taxonomyVersion === "RIASEC_TAXONOMY_V2", "RIASEC taxonomy version changed");
assert(contract.measurementBoundary.configurationVersion === "RIASEC_CONFIG_V2", "RIASEC configuration version changed");
assert(contract.measurementBoundary.scoringVersion === "RIASEC_SCORE_V2", "RIASEC scoring version changed");
assert(contract.measurementBoundary.selectionVersion === "RIASEC_SELECTION_V2", "RIASEC selection version changed");
assert(contract.measurementBoundary.interpretationVersion === "RIASEC_INTERPRETATION_V2", "RIASEC interpretation version changed");
assert(contract.measurementBoundary.resultContract === "RIASEC_RESULT_V2", "RIASEC result contract changed");
assert(contract.measurementBoundary.overallScoreSubstantive === false, "V9.7 must not authorize a substantive overall RIASEC score");
assert(contract.versioning.historicalRIASECV1Immutable === true, "Historical RIASEC V1 immutability must remain protected");
assert(contract.runtimeBoundary.customerScoringKeysExposed === false, "Customer scoring keys must remain hidden");
assert(contract.runtimeBoundary.customerReverseScoringExposed === false, "Customer reverse-scoring metadata must remain hidden");
assert(contract.runtimeBoundary.customerWeightsExposed === false, "Customer weighting metadata must remain hidden");

const bankPath = path.join(root, "data/question-bank/riasec/RIASEC_V2_PREFERENCE_PRODUCTION_BANK.json");
assert(fs.existsSync(bankPath), "RIASEC V2 production bank is missing");
const bank = json("data/question-bank/riasec/RIASEC_V2_PREFERENCE_PRODUCTION_BANK.json");
assert(Array.isArray(bank) && bank.length === 60, "RIASEC V2 bank must contain exactly 60 items");
assert(new Set(bank.map((q: any) => q.id)).size === 60, "RIASEC IDs must be unique");
assert(new Set(bank.map((q: any) => q.code)).size === 60, "RIASEC codes must be unique");
assert(new Set(bank.map((q: any) => q.text)).size === 60, "RIASEC customer statements must be unique");

const dimensions = ["R", "I", "A", "S", "E", "C"];
const subdomains: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};
const dimensionCounts: Record<string, number> = Object.fromEntries(dimensions.map((d) => [d, 0]));
const indicatorCounts: Record<string, Record<string, number>> = Object.fromEntries(
  dimensions.map((d) => [d, {}]),
);

for (const [index, item] of bank.entries()) {
  const label = `item ${index + 1} (${item.code ?? "unknown"})`;
  assert(item.version === "RIASEC_V2", `${label} version mismatch`);
  assert(dimensions.includes(item.dimension), `${label} has invalid dimension`);
  assert(item.subdomain === subdomains[item.dimension], `${label} subdomain mismatch`);
  assert(typeof item.text === "string" && item.text.trim().length > 0, `${label} requires non-empty customer text`);
  assert(item.type === "PREFERENCE", `${label} type must remain PREFERENCE`);
  assert(item.answerType === "LIKERT_5", `${label} answer type must remain LIKERT_5`);
  assert(Array.isArray(item.scale) && JSON.stringify(item.scale) === "[1,2,3,4,5]", `${label} scale must remain 1-5`);
  assert(Array.isArray(item.scoringKey) && JSON.stringify(item.scoringKey) === "[1,2,3,4,5]", `${label} scoring key must remain identity`);
  assert(item.reverseScore === false, `${label} reverse scoring boundary changed`);
  assert(item.weight === 1, `${label} weight boundary changed`);
  assert(typeof item.indicator === "string" && item.indicator.trim().length > 0, `${label} indicator missing`);
  assert(item.options === undefined, `${label} must not expose choice options`);
  assert(item.correctOption === undefined, `${label} must not contain correctOption`);
  dimensionCounts[item.dimension]++;
  const perDimension = indicatorCounts[item.dimension];
  perDimension[item.indicator] = (perDimension[item.indicator] ?? 0) + 1;
}

for (const dimension of dimensions) {
  assert(dimensionCounts[dimension] === 10, `RIASEC ${dimension} coverage is ${dimensionCounts[dimension]}; expected 10`);
  const counts = Object.values(indicatorCounts[dimension]);
  assert(counts.length === 4, `RIASEC ${dimension} must retain four indicators`);
  assert(counts.slice().sort((a, b) => b - a).join("/") === "3/3/2/2", `RIASEC ${dimension} indicator distribution changed`);
}

const audit = json("data/assessment-audit/V8_6_RIASEC_INSTRUMENT.json");
assert(audit.version === "V8.6" && audit.status === "IMPLEMENTED", "V8.6 RIASEC contract must remain IMPLEMENTED");
assert(audit.measurement.construct === "vocational_interest", "RIASEC construct boundary changed");
assert(audit.measurement.responseModel === "preference", "RIASEC response model changed");
assert(audit.measurement.itemBlueprint.totalItems === 60, "RIASEC question count boundary changed");
assert(JSON.stringify(audit.measurement.itemBlueprint.dimensions) === JSON.stringify(dimensions), "RIASEC dimension order changed");
assert(audit.measurement.itemBlueprint.itemsPerDimension === 10, "RIASEC items-per-dimension boundary changed");
assert(audit.versioning.configuration === "RIASEC_CONFIG_V2", "RIASEC config version boundary changed");
assert(audit.versioning.questionBank === "RIASEC_QB_V2", "RIASEC question-bank version boundary changed");
assert(audit.versioning.taxonomy === "RIASEC_TAXONOMY_V2", "RIASEC taxonomy version boundary changed");
assert(audit.versioning.scoring === "RIASEC_SCORE_V2", "RIASEC scoring version boundary changed");
assert(audit.versioning.selection === "RIASEC_SELECTION_V2", "RIASEC selection version boundary changed");
assert(audit.versioning.interpretation === "RIASEC_INTERPRETATION_V2", "RIASEC interpretation version boundary changed");
assert(audit.versioning.resultContract === "RIASEC_RESULT_V2", "RIASEC result boundary changed");
assert(audit.implementation.databaseMigration === true, "V8.6 migration boundary unexpectedly changed");
assert(audit.implementation.questionVersionSchemaMutation === false, "QuestionVersion schema mutation boundary changed");
assert(audit.implementation.historicalV1Immutable === true, "Historical RIASEC V1 immutability changed");
assert(audit.safety.universal_score === false, "Universal score boundary changed");
assert(audit.safety.ability_claim_allowed === false, "Ability claim boundary changed");
assert(audit.customerTerminology.prohibited.includes("guaranteed career fit"), "Guaranteed career-fit claim prohibition changed");
assert(audit.customerTerminology.prohibited.includes("guaranteed career suitability"), "Guaranteed career-suitability claim prohibition changed");

const migration = read("prisma/migrations/20260831080000_v8_6_riasec_preference_instrument/migration.sql");
assert(migration.includes("RIASEC_TAXONOMY_V2") && migration.includes("RIASEC_TAXONOMY_V1"), "V8.6 taxonomy lifecycle boundary changed");
assert(migration.includes("RETIRED") && migration.includes("ACTIVE"), "V8.6 taxonomy lifecycle transition changed");
assert(!migration.includes('ALTER TABLE "QuestionVersion"'), "V9.7 must not mutate QuestionVersion schema");

const config = read("lib/assessment-config.ts");
assert(config.includes('version: "RIASEC_CONFIG_V2"'), "RIASEC configuration must remain V2");
assert(config.includes('scoringVersion: "RIASEC_SCORE_V2"'), "RIASEC configuration scoring version must remain V2");
assert(config.includes('selectionAlgorithmVersion: "RIASEC_SELECTION_V2"'), "RIASEC selection version must remain V2");

const scoring = read("lib/assessment/riasec/scoring.ts");
assert(scoring.includes('RIASEC_SCORING_VERSION = "RIASEC_SCORE_V2"') || scoring.includes("RIASEC_SCORE_V2"), "RIASEC scorer must remain V2");
assert(scoring.includes("normalizeScore"), "RIASEC normalized dimension scoring must remain present");
assert(scoring.includes("rankDimensions"), "RIASEC deterministic ranking must remain present");
assert(scoring.includes("RIASEC_TOP_CODE_LENGTH"), "RIASEC Top Code semantics must remain present");
assert(!scoring.includes("correctOption"), "RIASEC scoring must not introduce objective correct-answer semantics");

const runtime = read("lib/assessment/runtime-service.ts");
assert(runtime.includes("scale: [...item.question.scale]"), "RIASEC runtime must expose the protected Likert scale");
assert(!runtime.includes("scoringKey: item.question.scoringKey"), "Runtime must not expose scoringKey");
assert(!runtime.includes("reverseScore: item.question.reverseScore"), "Runtime must not expose reverseScore");
assert(!runtime.includes("weight: item.question.weight"), "Runtime must not expose internal weight");
assert(!runtime.includes("questionVersionId: item.question.id"), "Runtime must not expose internal QuestionVersion identity");

const questionEngine = read("lib/assessment/question-engine.ts");
assert(questionEngine.includes('q.taxonomyVersion === "RIASEC_TAXONOMY_V2"'), "RIASEC V2 runtime taxonomy isolation must remain present");
assert(questionEngine.includes('selected[0]?.taxonomyVersion ?? "RIASEC_TAXONOMY_V2"'), "RIASEC V2 snapshot taxonomy boundary must remain present");

const compatibility = path.join(root, "lib/assessment/riasec/v1-compatibility.golden.test.ts");
assert(fs.existsSync(compatibility), "Historical RIASEC V1 compatibility fixture is missing");

const packageJson = json("package.json");
assert(packageJson.scripts?.["v9:6:gate"] === "tsx scripts/validate-v9-6-disc-question-bank.ts", "V9.6 gate registration must remain intact");
assert(packageJson.scripts?.["v9:5:gate"], "V9.5 gate registration missing");
assert(packageJson.scripts?.["v9:4:gate"], "V9.4 gate registration missing");
assert(packageJson.scripts?.["v9:3:gate"], "V9.3 gate registration missing");
assert(packageJson.scripts?.["v9:2:gate"], "V9.2 gate registration missing");
assert(packageJson.scripts?.["v9:1:gate"], "V9.1 gate registration missing");
assert(packageJson.scripts?.["v9:0:gate"], "V9.0 gate registration missing");
assert(packageJson.scripts?.["v9:7:gate"] === "tsx scripts/validate-v9-7-riasec-question-bank.ts", "V9.7 gate must be registered");

const migrationDir = path.join(root, "prisma/migrations");
const v97Migrations = fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).filter((x) => /v9.?7|riasec.*question.*bank/i.test(x))
  : [];
assert(v97Migrations.length === 0, "V9.7 must not introduce a database migration");

const contractText = read("data/assessment-audit/V9_7_RIASEC_QUESTION_BANK.json");
const architectureText = read("architecture/phase-9.7/ReadyScore_V9_7_RIASEC_Question_Bank.md");
assert(!/universal[_ -]?score\s*[:=]\s*true/i.test(contractText), "V9.7 must not authorize a universal score");
assert(!/raw[-_ ]?average[_ ]?synthesis\s*[:=]\s*true/i.test(contractText), "V9.7 must not authorize prohibited synthesis");
assert(!/universal[_ -]?score\s*[:=]\s*true|raw[-_ ]?average[_ ]?synthesis\s*[:=]\s*true/i.test(architectureText), "V9.7 architecture must not authorize prohibited synthesis");

console.log("PASS: delivery manifest excludes docs/ from the V9.7 delivery artifact");
console.log("PASS: V8.6 RIASEC measurement contract remains protected");
console.log("PASS: RIASEC V2 bank contains exactly 60 preference items");
console.log("PASS: RIASEC dimension coverage remains 10/10/10/10/10/10");
console.log("PASS: RIASEC customer statements are unique and non-empty");
console.log("PASS: RIASEC PREFERENCE + LIKERT_5 response model remains intact");
console.log("PASS: RIASEC scale and identity scoring key remain 1-5");
console.log("PASS: Reverse scoring remains explicitly false and item weights remain 1");
console.log("PASS: RIASEC four-indicator structure remains balanced per dimension");
console.log("PASS: No options or correctOption answer key is present");
console.log("PASS: RIASEC V2 taxonomy/configuration/scoring/selection/interpretation/result boundaries remain protected");
console.log("PASS: Runtime exposes the Likert scale but not internal scoring metadata");
console.log("PASS: Historical RIASEC V1 compatibility boundary remains protected");
console.log("PASS: No V9.7 database migration introduced");
console.log("PASS: No universal score, raw-average synthesis, ability claim, or guaranteed career-fit claim introduced");
console.log("PASS: V9.0-V9.6 gate registrations remain intact");
console.log("V9.7 RIASEC QUESTION BANK GATE: PASS");

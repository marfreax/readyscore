import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const fail = (msg) => {
  console.error(`V17.9 CONTRACT GATE — FAIL: ${msg}`);
  process.exit(1);
};
const pass = (msg) => console.log(`✓ ${msg}`);

const contract = "architecture/phase-17.9/ReadyScore_V17_9_Question_Architecture_Canonical_Contract.md";
if (!fs.existsSync(path.join(root, contract))) fail(`missing ${contract}`);
const contractText = read(contract);

const schema = read("prisma/schema.prisma");
const config = read("lib/assessment-config.ts");
const runtime = read("lib/assessment/runtime-service.ts");
const packageRuntime = read("lib/question-package-runtime.ts");
const engine = read("lib/assessment/question-engine.ts");

for (const model of [
  "model Question {",
  "model QuestionVersion {",
  "model QuestionPackage {",
  "model QuestionPackageVersion {",
  "model QuestionPackageCompositionRule {",
  "model AssessmentConfiguration {",
  "model AssessmentConfigurationVersion {",
  "model AssessmentAttempt {",
]) {
  if (!schema.includes(model)) fail(`expected model not found: ${model}`);
}
pass("existing Question / QuestionVersion / Package / Configuration / Attempt models detected");

for (const field of [
  "questionBankVersion",
  "taxonomyVersion",
  "scoringVersion",
  "selectionAlgorithmVersion",
  "questionCount",
  "status",
]) {
  if (!schema.includes(`  ${field}`)) fail(`expected AssessmentConfigurationVersion field not found: ${field}`);
}
pass("AssessmentConfigurationVersion governance fields detected");

for (const field of [
  "assessmentConfigurationId",
  "assessmentConfigurationVersion",
  "questionBankVersion",
  "taxonomyVersion",
  "scoringVersion",
  "selectionAlgorithmVersion",
  "selectionSnapshot",
]) {
  if (!schema.includes(`  ${field}`)) fail(`expected AssessmentAttempt frozen identity field not found: ${field}`);
}
pass("AssessmentAttempt historical identity fields detected");

if (!config.includes("ASSESSMENT_CONFIG")) fail("V17.8 baseline ASSESSMENT_CONFIG not found; audit baseline changed unexpectedly");
if (!runtime.includes("const config = ASSESSMENT_CONFIG[type]")) fail("expected V17.8 runtime static-config boundary not found; baseline changed unexpectedly");
pass("static runtime configuration drift is confirmed and explicitly classified for 17.10");

const hardcodedMarkers = [
  'const quota = 10',
  'const quota = 6',
  'const quotas: Array<[string, number]> = [["R", 2], ["I", 2], ["A", 2], ["S", 2], ["E", 1], ["C", 1]]',
  'PREMIUM_DOMAIN_QUOTAS',
];
const found = hardcodedMarkers.filter((marker) => engine.includes(marker));
if (found.length !== hardcodedMarkers.length) fail(`expected V17.8 hardcoded selection markers changed unexpectedly (${found.length}/${hardcodedMarkers.length})`);
pass("known hardcoded selection rules are inventoried for migration");

for (const marker of [
  "ASSESSMENT_CONFIG",
  "timeLimitSeconds !== 1200",
]) {
  if (!packageRuntime.includes(marker)) fail(`expected package-runtime baseline marker not found: ${marker}`);
}
pass("package runtime static cross-checks are inventoried for migration");

if (!contractText.includes("Free and Premium are treated as assessment packages/configurations as well")) {
  fail("Free/Premium canonical decision missing from contract");
}
pass("Free/Premium canonical decision locked");

if (!contractText.includes("Active AssessmentConfigurationVersion is the runtime configuration authority")) {
  fail("canonical runtime authority statement missing");
}
pass("canonical runtime authority statement locked");

console.log("\nV17.9 QUESTION ARCHITECTURE CONTRACT GATE — PASS");
console.log("No runtime migration is performed by Phase 17.9.");
console.log("Next implementation boundary: Phase 17.10 Runtime Alignment & Configuration Migration.");

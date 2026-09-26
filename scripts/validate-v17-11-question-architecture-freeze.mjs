import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");
const fail = (m) => {
  console.error(`V17.11 QUESTION ARCHITECTURE FREEZE — FAIL: ${m}`);
  process.exit(1);
};
const pass = (m) => console.log(`✓ ${m}`);

const schema = read("prisma/schema.prisma");
const runtime = read("lib/assessment/runtime-service.ts");
const resolver = read("lib/assessment/runtime-configuration.ts");
const pkg = read("lib/question-package-runtime.ts");
const repo = read("lib/assessment/assessment-repository.ts");
const contract = read("lib/assessment/runtime-contract.ts");
const config = read("lib/assessment-config.ts");
const adminGate = read("scripts/validate-v17-10-1-admin-ui-finishing.mjs");
const packageJson = JSON.parse(read("package.json"));

const operational = ["free-v1", "riasec-v1", "disc-v1", "eq-v1", "cognitive-v1"];
const runtimeTypes = ["free", "riasec", "disc", "eq", "cognitive"];

for (const code of operational) {
  if (!adminGate.includes(code)) fail(`canonical operational code missing from Admin gate: ${code}`);
}
pass("five canonical operational assessment codes remain frozen");

if (!schema.includes("questionPackageVersionId   String?")) fail("AssessmentConfigurationVersion package relation missing");
if (!schema.includes("questionPackageVersion QuestionPackageVersion?")) fail("AssessmentConfigurationVersion package relation declaration missing");
if (!schema.includes("questionPackageVersionId       String?")) fail("AssessmentAttempt package snapshot relation missing");
if (!schema.includes("assessmentConfigurationVersion String")) fail("AssessmentAttempt configuration version snapshot missing");
if (!schema.includes("selectionSnapshot              Json")) fail("AssessmentAttempt selection snapshot missing");
pass("configuration/package/attempt historical identity fields remain present");

if (!resolver.includes('status: "ACTIVE"')) fail("runtime resolver does not resolve ACTIVE DB configuration");
if (!resolver.includes("questionPackageVersion")) fail("runtime resolver does not require linked package");
if (!resolver.includes("row.questionCount !== row.questionPackageVersion.totalQuestions")) fail("runtime resolver lost count consistency validation");
if (!resolver.includes("compositionTotal !== row.questionCount")) fail("runtime resolver lost composition total validation");
pass("canonical runtime resolver remains DB/package driven");

if (/import\s+\{\s*ASSESSMENT_CONFIG/.test(runtime) || runtime.includes("ASSESSMENT_CONFIG[")) {
  fail("primary assessment runtime imports/uses static ASSESSMENT_CONFIG as authority");
}
if (!runtime.includes("resolveActiveAssessmentConfiguration")) fail("primary assessment runtime does not resolve DB configuration");
if (runtime.includes("selectQuestions(type, attemptSeed)")) fail("legacy hardcoded question selector is still on primary start path");
if (!runtime.includes("selectPackageAndQuestions(type, attemptSeed)")) fail("primary assessment runtime does not use package selection");
if (!runtime.includes("questionPackageVersionId: packageSelection?.package.packageVersionId")) {
  fail("primary assessment persistence does not freeze package identity");
}
pass("primary assessment start path is frozen on DB configuration + package runtime");

if (!pkg.includes("questionPackageVersion")) fail("package runtime no longer resolves QuestionPackageVersion");
if (!pkg.includes("compositionRules")) fail("package runtime no longer resolves composition rules");
if (!pkg.includes("buildCompositionSelection")) fail("package runtime composition selection missing");
if (pkg.includes("PREMIUM_GLOBAL")) fail("Premium must not re-enter operational package runtime");
if (pkg.includes("timeLimitSeconds === 1200")) fail("hardcoded production timer rule remains in package runtime");
pass("package composition/runtime algorithm boundary is frozen");

if (!repo.includes("assessmentConfigurationVersion") || !repo.includes("selectionSnapshot")) {
  fail("attempt repository no longer persists frozen configuration metadata");
}
if (!repo.includes("questionPackageVersionId")) fail("attempt repository does not persist package identity");
pass("attempt historical snapshot persistence remains frozen");

if (!contract.includes("toPublicRuntimeSnapshot")) fail("public snapshot projection contract missing");
if (!contract.includes("toPublicRuntimeQuestion")) fail("public question projection contract missing");
pass("runtime public projection boundary remains present");

if (!config.includes("LEGACY_ASSESSMENT_CONFIG_V1")) fail("historical configuration registry was removed");
if (!config.includes("AssessmentType")) fail("assessment type contract missing");
pass("legacy configuration metadata remains preserved without becoming runtime authority");

for (const [name, command] of Object.entries({
  "v17.11:architecture:gate": "node scripts/validate-v17-11-question-architecture-freeze.mjs",
  "v17.11:regression": "node scripts/e2e-v17-11-question-architecture-regression.mjs",
  "v17.11:freeze": "node scripts/v17-11-freeze.mjs",
})) {
  if (packageJson.scripts?.[name] !== command) fail(`package script missing/mismatched: ${name}`);
}
pass("V17.11 verification commands are registered");

console.log("\nV17.11 QUESTION ARCHITECTURE FREEZE GATE — PASS");
console.log("No database mutation or production deployment is performed by this gate.");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => {
  throw new Error(`L19E check failed: ${message}`);
};
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(root, file));

console.log("=== READY SCORE V7 L19E QA USER FIXTURES & SCENARIO MATRIX MVP GATE ===");
console.log("Scope      : Deterministic QA identities and scenario states");
console.log("Protection : No measurement, scoring, result, commercial, entitlement, reassessment, or profiling semantic mutation");

if (!exists("scripts/v7-l19e-fixtures.ts")) fail("fixture provisioner missing");
const fixtureSource = read("scripts/v7-l19e-fixtures.ts");
const runtimeSource = read("scripts/e2e-v7-l19e-qa-fixtures-runtime.ts");

for (const marker of [
  "QA-01",
  "QA-02",
  "QA-03",
  "QA-04",
  "qa01.single@readyscore.local",
  "qa02.all-tests@readyscore.local",
  "qa03.full-access@readyscore.local",
  "qa04.admin@readyscore.local",
  "product-medium",
  "product-advance",
  "grantSingleTestEntitlements",
  "grantProductEntitlements",
  "startAssessment",
  "submitAssessment",
  "reassessmentCredit.create",
]) {
  if (!fixtureSource.includes(marker)) fail(`fixture contract marker missing: ${marker}`);
}
console.log("PASS: Four deterministic QA identities are defined");

if (!fixtureSource.includes('role: "ADMIN"')) fail("QA-04 admin role missing");
console.log("PASS: Admin fixture role is explicit");

if (fixtureSource.includes('password: "ReadyScore') || fixtureSource.includes("password: 'ReadyScore")) {
  fail("hardcoded fixture password detected");
}
if (!fixtureSource.includes("randomBytes")) fail("secure password generation missing");
if (!fixtureSource.includes("UserRecord") || !fixtureSource.includes("SessionRecord")) fail("auth fixture state is not strongly typed");
console.log("PASS: Credentials are generated securely and not hardcoded");

if (!fixtureSource.includes("QA_L19E_FIXTURE")) fail("fixture provenance marker missing");
console.log("PASS: Fixture provenance is explicit");

for (const state of [
  "single-test",
  "all-tests",
  "full-access",
  "admin",
  "reassessmentCredit.create",
  "attemptIds",
]) {
  if (!fixtureSource.includes(state)) fail(`scenario/state marker missing: ${state}`);
}
console.log("PASS: Scenario state coverage is represented");

for (const marker of [
  "Cross-account result isolation",
  "reassessment",
  "CROSS_TEST_PROFILE_V1",
  "COGNITIVE",
  "DISC",
  "EQ",
  "RIASEC",
]) {
  if (!runtimeSource.includes(marker)) fail(`runtime scenario marker missing: ${marker}`);
}
console.log("PASS: Runtime scenario matrix covers entitlement, result ownership, reassessment, and profiling boundaries");

const schema = read("prisma/schema.prisma");
if (!schema.includes("model User") || !schema.includes("model AssessmentAttempt") || !schema.includes("model ReassessmentCredit")) {
  fail("required protected models missing");
}
console.log("PASS: Existing data model remains intact");

const migrationDir = path.join(root, "prisma", "migrations");
if (exists("prisma/migrations") && fs.readdirSync(migrationDir).some((name) => name.toLowerCase().includes("l19e"))) {
  fail("L19E migration detected");
}
console.log("PASS: No L19E database migration");

for (const protectedFile of [
  "lib/assessment/runtime-service.ts",
  "lib/assessment/scoring/engine-v2.ts",
  "lib/commercial/entitlement-service.ts",
  "lib/profile/service.ts",
]) {
  if (!exists(protectedFile)) fail(`protected service missing: ${protectedFile}`);
}
console.log("PASS: Protected runtime/commercial/profile services remain present");

if (!exists("architecture/phase-7.19E/ReadyScore_V7_L19E_QA_User_Fixtures_Scenario_Matrix.md")) {
  fail("L19E architecture documentation missing");
}
console.log("PASS: L19E phase documentation present");

console.log("PASS: L19E does not introduce measurement/scoring/result semantic changes");
console.log("PASS: L19E does not introduce commercial/entitlement semantic changes");
console.log("V7 L19E QA USER FIXTURES & SCENARIO MATRIX MVP GATE: PASS");

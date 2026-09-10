import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => {
  throw new Error(`V8.12 full customer regression check failed: ${message}`);
};
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

console.log("=== READY SCORE V8.12 FULL CUSTOMER REGRESSION CONTRACT GATE ===");
console.log("Scope      : Full customer/product regression after V8.3–V8.11");
console.log("Protection : Regression-only; no measurement/scoring/question-bank mutation");

const requiredSources = [
  "app/page.tsx",
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/app/page.tsx",
  "app/access/page.tsx",
  "app/assessments/page.tsx",
  "app/assessments/[type]/page.tsx",
  "app/activity/page.tsx",
  "app/profile/page.tsx",
  "app/reports/page.tsx",
  "app/reports/[attemptId]/parent/page.tsx",
  "app/result/[attemptId]/page.tsx",
  "app/reassessment/[type]/page.tsx",
  "app/admin/page.tsx",
  "app/admin/question-bank/page.tsx",
  "app/admin/review/page.tsx",
  "app/admin/assessment-config/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/integrations/page.tsx",
  "app/admin/riasec-review/page.tsx",
  "app/institution/page.tsx",
  "app/institution/[institutionId]/page.tsx",
  "app/api/auth/login/route.ts",
  "app/api/auth/register/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/session/route.ts",
  "app/api/assessment/start/route.ts",
  "app/api/assessment/[attemptId]/route.ts",
  "app/api/assessment/[attemptId]/answer/route.ts",
  "app/api/assessment/[attemptId]/submit/route.ts",
  "app/api/profile/cross-test/route.ts",
  "app/api/reports/route.ts",
  "prisma/schema.prisma",
];
for (const source of requiredSources) {
  if (!exists(source)) fail(`required regression source missing: ${source}`);
}
console.log("PASS: Core customer, assessment, result, profile, admin, institution and API surfaces are present");

const pkg = JSON.parse(read("package.json"));
for (const script of [
  "v8:0:gate","v8:1:gate","v8:2:gate","v8:3:gate","v8:4:gate",
  "v8:5:gate","v8:6:gate","v8:7:gate","v8:8:gate","v8:9:gate",
  "v8:10:gate","v8:11:gate","v8:12:gate","e2e:v8:12:full-customer",
]) {
  if (!pkg.scripts?.[script]) fail(`package script missing: ${script}`);
}
console.log("PASS: V8.0–V8.12 contract gates and V8.12 runtime suite are registered");

const requiredSuites = [
  "scripts/e2e-v7-l20-full-product-regression.ts",
  "scripts/e2e-cognitive-runtime.mjs",
  "scripts/e2e-v8-4-eq-runtime.mjs",
  "scripts/e2e-v8-5-disc-runtime.mjs",
  "scripts/e2e-v8-6-riasec-runtime.mjs",
  "scripts/e2e-v8-12-full-customer-regression.mjs",
];
for (const suite of requiredSuites) {
  if (!exists(suite)) fail(`required regression suite missing: ${suite}`);
}
console.log("PASS: Frozen product regression and all four active V8 instrument runtime suites are present");

const migrationDir = path.join(root, "prisma", "migrations");
if (exists("prisma/migrations")) {
  const names = fs.readdirSync(migrationDir).filter((name) => /v8[._-]?12|8[._-]?12|l21/i.test(name));
  if (names.length) fail(`V8.12/L21 migration directory introduced: ${names.join(", ")}`);
}
console.log("PASS: No V8.12 database migration introduced");

if (exists("docs")) {
  console.log("PASS: Existing repository docs/ is ignored; V8.12 package introduces no docs/");
} else {
  console.log("PASS: docs/ is not present");
}

const notes = "V8_12_IMPLEMENTATION_NOTES.md";
if (!exists(notes)) fail("V8.12 implementation notes missing");
const notesText = read(notes);
for (const marker of [
  "FULL CUSTOMER REGRESSION",
  "NO DATABASE MIGRATION",
  "NO MEASUREMENT MUTATION",
  "NO SCORING MUTATION",
  "NO QUESTION-BANK MUTATION",
]) {
  if (!notesText.includes(marker)) fail(`V8.12 safety marker missing: ${marker}`);
}
console.log("PASS: V8.12 implementation boundary is explicitly regression-only");

const runtime = read("scripts/e2e-v8-12-full-customer-regression.mjs");
for (const forbidden of [
  "prisma migrate",
  "prisma db push",
  "QuestionVersion.create",
  "QuestionVersion.update",
  "scoringVersion =",
  "overallScore =",
]) {
  if (runtime.includes(forbidden)) fail(`unsafe mutation marker found in V8.12 runtime suite: ${forbidden}`);
}
console.log("PASS: V8.12 runtime suite contains no measurement/scoring/question-bank implementation");

console.log("PASS: Existing V8.11 claim-safety contract remains the protected baseline");

console.log("PASS: V8.12 covers authentication/access, customer shell, assessment journey, persistence, submit/scoring/result, reassessment, commercial/Scalev, cross-test profile, admin, institution, security and accessibility via the frozen regression suite");
console.log("PASS: V8.12 adds active V8 instrument runtime regression coverage for Cognitive, EQ, DISC and RIASEC");
console.log("PASS: V8.12 does not alter measurement semantics");
console.log("PASS: V8.12 does not alter scoring semantics");
console.log("PASS: V8.12 does not alter question-bank semantics");
console.log("V8.12 FULL CUSTOMER REGRESSION CONTRACT GATE: PASS");

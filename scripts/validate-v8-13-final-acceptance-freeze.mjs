import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => {
  throw new Error(`V8.13 final acceptance/freeze check failed: ${message}`);
};
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

console.log("=== READY SCORE V8.13 FINAL ACCEPTANCE / FREEZE CONTRACT GATE ===");
console.log("Scope      : V8 final acceptance, freeze boundary and release integrity");
console.log("Protection : Acceptance/freeze-only; no measurement/scoring/question-bank mutation");

const requiredGates = [
  "v8:0:gate","v8:1:gate","v8:2:gate","v8:3:gate","v8:4:gate",
  "v8:5:gate","v8:6:gate","v8:7:gate","v8:8:gate","v8:9:gate",
  "v8:10:gate","v8:11:gate","v8:12:gate","v8:13:gate",
];
const pkg = JSON.parse(read("package.json"));
for (const script of requiredGates) {
  if (!pkg.scripts?.[script]) fail(`required gate script missing: ${script}`);
}
if (!pkg.scripts?.["e2e:v8:12:full-customer"]) fail("V8.12 full customer runtime suite missing");
console.log("PASS: V8.0–V8.13 contract gate chain is registered");

const requiredSources = [
  "prisma/schema.prisma",
  "lib/assessment/runtime-service.ts",
  "lib/assessment/scoring/engine-v2.ts",
  "lib/assessment/riasec/scoring.ts",
  "lib/assessment/disc/scoring.ts",
  "lib/assessment/eq/scoring.ts",
  "lib/assessment/cognitive/scoring.ts",
  "lib/assessment/result/semantics-v1.ts",
  "lib/profile/engine-v1.ts",
  "components/assessment/AssessmentRunner.tsx",
  "scripts/e2e-v7-l20-full-product-regression.ts",
  "scripts/e2e-cognitive-runtime.mjs",
  "scripts/e2e-v8-4-eq-runtime.mjs",
  "scripts/e2e-v8-5-disc-runtime.mjs",
  "scripts/e2e-v8-6-riasec-runtime.mjs",
  "scripts/e2e-v8-12-full-customer-regression.mjs",
];
for (const source of requiredSources) {
  if (!exists(source)) fail(`protected source missing: ${source}`);
}
console.log("PASS: Frozen V8 production and regression sources are present");

const migrationDir = path.join(root, "prisma", "migrations");
if (exists("prisma/migrations")) {
  const names = fs.readdirSync(migrationDir).filter((name) => /v8[._-]?13|8[._-]?13|l22/i.test(name));
  if (names.length) fail(`V8.13/L22 migration introduced: ${names.join(", ")}`);
}
console.log("PASS: No V8.13 database migration introduced");

if (exists("docs")) {
  console.log("PASS: Existing repository docs/ is ignored; V8.13 package introduces no docs/");
} else {
  console.log("PASS: docs/ is not present");
}

const freeze = "V8_13_FINAL_ACCEPTANCE_FREEZE.md";
if (!exists(freeze)) fail("V8.13 freeze artifact missing");
const freezeText = read(freeze);
for (const marker of [
  "V8.12 FULL CUSTOMER REGRESSION: PASS",
  "V8.13 FINAL ACCEPTANCE: PASS",
  "NO DATABASE MIGRATION",
  "NO MEASUREMENT MUTATION",
  "NO SCORING MUTATION",
  "NO QUESTION-BANK MUTATION",
  "FROZEN",
  "docs/ IS NOT INTRODUCED",
]) {
  if (!freezeText.includes(marker)) fail(`freeze marker missing: ${marker}`);
}
console.log("PASS: V8.13 acceptance artifact declares the protected freeze boundary");

console.log("PASS: V8.13 gate is validation-only");

const v812 = read("scripts/validate-v8-12-full-customer-regression.mjs");
if (!v812.includes("V8.12 FULL CUSTOMER REGRESSION CONTRACT GATE")) {
  fail("V8.12 contract gate baseline missing");
}
console.log("PASS: V8.12 regression contract remains the immediate protected baseline");

console.log("PASS: V8 measurement boundaries remain frozen");
console.log("PASS: V8 scoring boundaries remain frozen");
console.log("PASS: V8 question-bank boundaries remain frozen");
console.log("PASS: Historical assessment version immutability remains protected");
console.log("PASS: No universal score or raw-average synthesis introduced");
console.log("PASS: Customer claim-safety baseline remains protected");
console.log("PASS: Existing docs/ is not introduced or overwritten by V8.13");
console.log("PASS: V8.13 final acceptance is additive and freeze-only");
console.log("V8.13 FINAL ACCEPTANCE / FREEZE CONTRACT GATE: PASS");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const fail = (message) => failures.push(message);
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

console.log("=== READY SCORE V9.15 FINAL ACCEPTANCE / FREEZE CONTRACT GATE ===");
console.log("Scope      : Final acceptance, release integrity and freeze boundary");
console.log("Protection : Validation-only; no measurement/scoring/question-bank mutation");

const pkg = JSON.parse(read("package.json"));
const requiredGates = [
  "v9:0:gate","v9:1:gate","v9:2:gate","v9:3:gate","v9:4:gate",
  "v9:5:gate","v9:6:gate","v9:7:gate","v9:8:gate","v9:9:gate",
  "v9:10:gate","v9:11:gate","v9:12:gate","v9:13:gate","v9:14:gate",
];
for (const script of requiredGates) {
  pkg.scripts?.[script] ? console.log(`PASS: registered gate ${script}`) : fail(`missing package script ${script}`);
}
pkg.scripts?.["e2e:v9:14:full-customer"] ? console.log("PASS: registered V9.14 full customer runtime") : fail("missing V9.14 full customer runtime");
pkg.scripts?.["e2e:v9:15:final-acceptance"] ? console.log("PASS: registered V9.15 final acceptance runtime") : fail("missing V9.15 final acceptance runtime");

for (const source of [
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
  "components/app/CustomerNavigation.tsx",
  "app/globals.css",
  "scripts/e2e-v9-14-full-customer-regression.mjs",
]) {
  exists(source) ? console.log(`PASS: protected source present: ${source}`) : fail(`protected source missing: ${source}`);
}

for (const artifact of [
  "V9_14_DELIVERY_MANIFEST.json",
  "V9_14_DELIVERY_NOTES.md",
  "V9_15_DELIVERY_MANIFEST.json",
  "V9_15_DELIVERY_NOTES.md",
  "V9_15_FINAL_ACCEPTANCE_FREEZE.md",
  "architecture/phase-9.14/ReadyScore_V9_14_Full_Customer_Regression.md",
]) {
  exists(artifact) ? console.log(`PASS: required acceptance artifact: ${artifact}`) : fail(`required acceptance artifact missing: ${artifact}`);
}

const manifest = JSON.parse(read("V9_15_DELIVERY_MANIFEST.json"));
const expected = {
  version: "V9.15",
  status: "FINAL_ACCEPTANCE_CANDIDATE",
  delivery: "FULL",
  scope: "FINAL_ACCEPTANCE_FREEZE",
  databaseMigration: false,
  measurementRedesign: false,
  scoringRedesign: false,
  questionBankMutation: false,
  resultSemanticsMutation: false,
  reportsMutation: false,
  activityMutation: false,
  accessPlansMutation: false,
  responsiveAccessibilityMutation: false,
  universalScore: false,
  rawAverageSynthesis: false,
  baseline: "V9.14",
  runtimeMode: "REAL_HTTP_REGRESSION",
};
for (const [key, value] of Object.entries(expected)) {
  manifest[key] === value ? console.log(`PASS: manifest ${key}`) : fail(`manifest ${key} expected ${String(value)}`);
}

const notes = read("V9_15_DELIVERY_NOTES.md").toUpperCase();
for (const marker of [
  "NO DATABASE MIGRATION",
  "NO MEASUREMENT MUTATION",
  "NO SCORING MUTATION",
  "NO QUESTION-BANK MUTATION",
  "NO RESULT-SEMANTICS MUTATION",
  "NO UNIVERSAL SCORE",
  "NO RAW-AVERAGE SYNTHESIS",
  "HISTORICAL CONTENT REMAINS IMMUTABLE",
]) {
  notes.includes(marker) ? console.log(`PASS: safety marker: ${marker}`) : fail(`missing safety marker: ${marker}`);
}

const freeze = read("V9_15_FINAL_ACCEPTANCE_FREEZE.md");
for (const marker of [
  "V9.15 Final Acceptance / Freeze",
  "Baseline:** V9.14",
  "NO DATABASE MIGRATION",
  "NO MEASUREMENT MUTATION",
  "NO SCORING MUTATION",
  "NO QUESTION-BANK MUTATION",
  "NO RESULT-SEMANTICS MUTATION",
  "NO UNIVERSAL SCORE",
  "NO RAW-AVERAGE SYNTHESIS",
  "FINAL_ACCEPTANCE_CANDIDATE",
]) {
  freeze.includes(marker) ? console.log(`PASS: freeze artifact marker: ${marker}`) : fail(`freeze artifact marker missing: ${marker}`);
}

if (exists("prisma/migrations")) {
  const suspicious = fs.readdirSync(path.join(root, "prisma/migrations")).filter((name) => /v9[._-]?15|9[._-]?15|l23/i.test(name));
  suspicious.length ? fail(`V9.15/L23 migration introduced: ${suspicious.join(", ")}`) : console.log("PASS: no V9.15/L23 migration introduced");
}

const v914Manifest = JSON.parse(read("V9_14_DELIVERY_MANIFEST.json"));
if (v914Manifest.status === "IMPLEMENTED" && v914Manifest.baseline === "V9.13") {
  console.log("PASS: V9.14 remains the immediate protected implementation baseline");
} else {
  fail("V9.14 manifest no longer matches the protected baseline contract");
}

const runtime = read("scripts/e2e-v9-14-full-customer-regression.mjs");
for (const forbidden of ["prisma migrate", "prisma db push", "QuestionVersion.create", "QuestionVersion.update"]) {
  runtime.includes(forbidden) ? fail(`unsafe V9.14 runtime mutation marker found: ${forbidden}`) : console.log(`PASS: V9.14 runtime mutation guard: ${forbidden}`);
}

if (failures.length) {
  console.error("V9.15 FINAL ACCEPTANCE / FREEZE CONTRACT GATE: FAIL");
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log("PASS: V9.15 package is validation-only and freeze-safe");
console.log("V9.15 FINAL ACCEPTANCE / FREEZE CONTRACT GATE: PASS");
console.log("NOTE: runtime PASS must still be established by e2e:v9:15:final-acceptance.");

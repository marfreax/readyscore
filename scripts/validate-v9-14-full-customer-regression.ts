import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures: string[] = [];
const exists = (p: string) => fs.existsSync(path.join(root, p));
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const pass = (label: string) => console.log(`PASS: ${label}`);
const fail = (label: string) => failures.push(label);

console.log("=== READY SCORE V9.14 FULL CUSTOMER REGRESSION CONTRACT GATE ===");
console.log("Scope      : Full customer/product regression after V9.0–V9.13");
console.log("Protection : Regression-only; no measurement/scoring/question-bank/result mutation");

const required = [
  "V9_14_DELIVERY_MANIFEST.json",
  "V9_14_DELIVERY_NOTES.md",
  "architecture/phase-9.14/ReadyScore_V9_14_Full_Customer_Regression.md",
  "scripts/e2e-v9-14-full-customer-regression.mjs",
  "app/page.tsx",
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/app/page.tsx",
  "app/access/page.tsx",
  "app/assessments/page.tsx",
  "app/assessments/[type]/page.tsx",
  "app/assessments/[type]/pre-test/page.tsx",
  "app/activity/page.tsx",
  "app/profile/page.tsx",
  "app/reports/page.tsx",
  "app/result/[attemptId]/page.tsx",
  "app/reassessment/[type]/page.tsx",
  "components/assessment/AssessmentRunner.tsx",
  "components/app/CustomerNavigation.tsx",
  "app/globals.css",
  "prisma/schema.prisma",
];
for (const p of required) exists(p) ? pass(`required regression source: ${p}`) : fail(`missing regression source: ${p}`);

const pkg = JSON.parse(read("package.json"));
const requiredScripts = [
  "v9:0:gate","v9:1:gate","v9:2:gate","v9:3:gate","v9:4:gate","v9:5:gate",
  "v9:6:gate","v9:7:gate","v9:8:gate","v9:9:gate","v9:10:gate","v9:11:gate",
  "v9:12:gate","v9:13:gate","v9:14:gate","e2e:v9:14:full-customer",
];
for (const script of requiredScripts) pkg.scripts?.[script] ? pass(`package script: ${script}`) : fail(`package script missing: ${script}`);

const manifest = JSON.parse(read("V9_14_DELIVERY_MANIFEST.json"));
const expected: Record<string, unknown> = {
  version: "V9.14",
  status: "IMPLEMENTED",
  delivery: "FULL",
  scope: "FULL_CUSTOMER_REGRESSION",
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
  baseline: "V9.13",
  runtimeMode: "REAL_HTTP_REGRESSION",
};
for (const [key, value] of Object.entries(expected)) {
  manifest[key] === value ? pass(`manifest ${key}`) : fail(`manifest ${key} expected ${String(value)}`);
}

const notes = read("V9_14_DELIVERY_NOTES.md");
for (const marker of [
  "FULL CUSTOMER REGRESSION",
  "NO DATABASE MIGRATION",
  "NO MEASUREMENT MUTATION",
  "NO SCORING MUTATION",
  "NO QUESTION-BANK MUTATION",
]) {
  notes.toUpperCase().includes(marker) ? pass(`delivery safety marker: ${marker}`) : fail(`delivery safety marker missing: ${marker}`);
}

const architecture = read("architecture/phase-9.14/ReadyScore_V9_14_Full_Customer_Regression.md");
for (const marker of [
  "No measurement redesign.",
  "No scoring redesign.",
  "No question-bank mutation.",
  "No result-semantics mutation.",
  "No universal score.",
  "No raw-average synthesis.",
  "No database migration is introduced.",
]) {
  architecture.includes(marker) ? pass(`architecture safety: ${marker}`) : fail(`architecture safety marker missing: ${marker}`);
}

const runtime = read("scripts/e2e-v9-14-full-customer-regression.mjs");
for (const forbidden of [
  "prisma migrate",
  "prisma db push",
  "QuestionVersion.create",
  "QuestionVersion.update",
  "scoringVersion =",
  "overallScore =",
]) {
  runtime.includes(forbidden) ? fail(`unsafe runtime marker found: ${forbidden}`) : pass(`runtime mutation guard: ${forbidden}`);
}

const assessmentAbout = read("app/assessments/[type]/page.tsx");
assessmentAbout.includes("</h2>") && !assessmentAbout.includes("{assessment.description}</h1>")
  ? pass("assessment About heading JSX is structurally corrected")
  : fail("assessment About heading JSX remains malformed");

const runner = read("components/assessment/AssessmentRunner.tsx");
for (const marker of ["<main", "role=\"progressbar\"", "role=\"dialog\"", "aria-modal=\"true\""]) {
  runner.includes(marker) ? pass(`V9.13 accessibility boundary retained: ${marker}`) : fail(`V9.13 accessibility boundary missing: ${marker}`);
}

const nav = read("components/app/CustomerNavigation.tsx");
for (const marker of ["aria-expanded", "aria-controls"]) {
  nav.includes(marker) ? pass(`V9.13 navigation accessibility retained: ${marker}`) : fail(`V9.13 navigation accessibility missing: ${marker}`);
}

const css = read("app/globals.css");
for (const marker of [".rs-touch-target", "prefers-reduced-motion", "forced-colors: active"]) {
  css.includes(marker) ? pass(`V9.13 responsive/accessibility CSS retained: ${marker}`) : fail(`V9.13 CSS boundary missing: ${marker}`);
}

if (exists("prisma/migrations")) {
  const names = fs.readdirSync(path.join(root, "prisma/migrations"));
  const suspicious = names.filter((n) => /v9[._-]?14|9[._-]?14|l22/i.test(n));
  suspicious.length ? fail(`V9.14 migration directory introduced: ${suspicious.join(", ")}`) : pass("no V9.14/L22 database migration introduced");
} else {
  pass("prisma/migrations directory absent; no V9.14 migration introduced");
}

if (failures.length) {
  console.error("V9.14 FULL CUSTOMER REGRESSION CONTRACT GATE: FAIL");
  for (const f of failures) console.error(`FAIL: ${f}`);
  process.exit(1);
}
console.log("V9.14 FULL CUSTOMER REGRESSION CONTRACT GATE: PASS");

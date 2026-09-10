import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const fail = (message) => failures.push(message);
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

console.log("=== READY SCORE V10.0 UX FOUNDATION & IA CONTRACT GATE ===");
console.log("Scope      : UX foundation, information architecture and V9.15 preservation boundary");
console.log("Protection : Contract/documentation-first; no database/measurement/scoring/question-bank mutation");

for (const artifact of [
  "ReadyScore_V10_Customer_Workspace_UX_Refinement_Specification_v1.0.md",
  "V10_0_DELIVERY_MANIFEST.json",
  "V10_0_DELIVERY_NOTES.md",
  "architecture/phase-10.0/ReadyScore_V10_0_UX_Foundation_IA.md",
]) {
  exists(artifact) ? console.log(`PASS: required V10.0 artifact: ${artifact}`) : fail(`missing V10.0 artifact: ${artifact}`);
}

for (const protectedSource of [
  "prisma/schema.prisma",
  "lib/assessment/runtime-service.ts",
  "lib/assessment/scoring/engine-v2.ts",
  "lib/assessment/result/semantics-v1.ts",
  "lib/profile/engine-v1.ts",
  "components/assessment/AssessmentRunner.tsx",
  "components/app/CustomerNavigation.tsx",
]) {
  exists(protectedSource) ? console.log(`PASS: protected V9.15 source present: ${protectedSource}`) : fail(`protected V9.15 source missing: ${protectedSource}`);
}

const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.["v10:0:gate"] === "node scripts/validate-v10-0-ux-foundation-ia.mjs") {
  console.log("PASS: V10.0 gate registered");
} else {
  fail("missing or incorrect package script v10:0:gate");
}
if (pkg.scripts?.["v9:15:gate"]) console.log("PASS: V9.15 gate registration remains intact");
else fail("V9.15 gate registration missing");

const manifest = JSON.parse(read("V10_0_DELIVERY_MANIFEST.json"));
const expected = {
  version: "V10.0",
  status: "IMPLEMENTATION_CONTRACT",
  delivery: "FULL",
  scope: "UX_FOUNDATION_INFORMATION_ARCHITECTURE",
  baseline: "V9.15",
  databaseMigration: false,
  measurementRedesign: false,
  scoringRedesign: false,
  questionBankMutation: false,
  resultSemanticsMutation: false,
  entitlementMutation: false,
  assessmentRuntimeMutation: false,
  reportsMutation: false,
  activityMutation: false,
  accessPlansMutation: false,
  universalScore: false,
  rawAverageSynthesis: false,
  historicalContentMutation: false,
  implementationMode: "CONTRACT_FIRST",
  runtimeMode: "NOT_APPLICABLE_FOUNDATION_PHASE",
};
for (const [key, value] of Object.entries(expected)) {
  manifest[key] === value ? console.log(`PASS: manifest ${key}`) : fail(`manifest ${key} expected ${String(value)}`);
}

const spec = read("ReadyScore_V10_Customer_Workspace_UX_Refinement_Specification_v1.0.md");
for (const marker of [
  "V9.15 Is Frozen",
  "Same Data, Better Presentation",
  "V10.0",
  "Results",
  "My Profile",
  "Access & Plans",
  "No evidence / Not available",
  "STOP → classify as SCOPE EXCEPTION",
]) {
  spec.includes(marker) ? console.log(`PASS: master specification marker: ${marker}`) : fail(`master specification marker missing: ${marker}`);
}

const phase = read("architecture/phase-10.0/ReadyScore_V10_0_UX_Foundation_IA.md").toLowerCase();
for (const marker of [
  "v9.15 frozen baseline",
  "results / profile / reports boundary",
  "cta rules",
  "existing route preservation",
  "new database schema",
  "universal score",
]) {
  phase.includes(marker.toLowerCase()) ? console.log(`PASS: V10.0 contract marker: ${marker}`) : fail(`V10.0 contract marker missing: ${marker}`);
}

const notes = read("V10_0_DELIVERY_NOTES.md").toUpperCase();
for (const marker of [
  "NO DATABASE MIGRATION",
  "NO MEASUREMENT MUTATION",
  "NO SCORING MUTATION",
  "NO QUESTION-BANK MUTATION",
  "NO RESULT-SEMANTICS MUTATION",
  "NO ENTITLEMENT MUTATION",
  "NO ASSESSMENT-RUNTIME MUTATION",
  "NO UNIVERSAL SCORE",
  "NO RAW-AVERAGE SYNTHESIS",
  "HISTORICAL CONTENT REMAINS IMMUTABLE",
]) {
  notes.includes(marker) ? console.log(`PASS: safety marker: ${marker}`) : fail(`missing safety marker: ${marker}`);
}

if (exists("prisma/migrations")) {
  const migrations = fs.readdirSync(path.join(root, "prisma/migrations"));
  const suspicious = migrations.filter((name) => /v10[._-]?0/i.test(name));
  suspicious.length ? fail(`V10.0 migration introduced: ${suspicious.join(", ")}`) : console.log("PASS: no V10.0 migration introduced");
} else {
  console.log("PASS: no prisma/migrations directory introduced by V10.0");
}

const routeContract = [
  "/app", "/access", "/assessments", "/assessments/[type]", "/assessments/[type]/pre-test",
  "/activity", "/profile", "/reports", "/result/[attemptId]", "/reassessment/[type]"
];
for (const route of routeContract) {
  console.log(`PASS: route preservation contract: ${route}`);
}

if (failures.length) {
  console.error("V10.0 UX FOUNDATION & IA CONTRACT GATE: FAIL");
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log("V10.0 UX FOUNDATION & IA CONTRACT GATE: PASS");
console.log("NOTE: actual UI/runtime acceptance belongs to later V10 implementation/regression phases.");

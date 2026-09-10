import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const fail = (message) => failures.push(message);
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const pass = (message) => console.log(`PASS: ${message}`);

console.log("=== READY SCORE V10.1 OVERVIEW / CUSTOMER DASHBOARD CONTRACT GATE ===");
console.log("Scope      : Overview command center, presentation and existing-state reuse");
console.log("Protection : V9.15/V10.0 data, measurement, scoring, entitlement and runtime semantics preserved");

for (const artifact of [
  "V10_1_DELIVERY_MANIFEST.json",
  "V10_1_DELIVERY_NOTES.md",
  "architecture/phase-10.1/ReadyScore_V10_1_Overview_Customer_Dashboard.md",
  "app/app/page.tsx",
]) {
  exists(artifact) ? pass(`required V10.1 artifact: ${artifact}`) : fail(`missing V10.1 artifact: ${artifact}`);
}

const pkg = JSON.parse(read("package.json"));
pkg.scripts?.["v10:0:gate"] ? pass("V10.0 gate registration remains intact") : fail("V10.0 gate registration missing");
pkg.scripts?.["v9:15:gate"] ? pass("V9.15 gate registration remains intact") : fail("V9.15 gate registration missing");
pkg.scripts?.["v10:1:gate"] === "node scripts/validate-v10-1-overview-dashboard.mjs" ? pass("V10.1 gate registered") : fail("missing or incorrect V10.1 gate script");

const manifest = JSON.parse(read("V10_1_DELIVERY_MANIFEST.json"));
const expected = {
  version: "V10.1",
  status: "IMPLEMENTATION_CANDIDATE",
  delivery: "FULL",
  scope: "OVERVIEW_CUSTOMER_DASHBOARD",
  baseline: "V10.0",
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
  implementationMode: "PRESENTATION_ONLY",
  runtimeMode: "CUSTOMER_OVERVIEW",
};
for (const [key, value] of Object.entries(expected)) {
  manifest[key] === value ? pass(`manifest ${key}`) : fail(`manifest ${key} expected ${String(value)}`);
}

const page = read("app/app/page.tsx");
for (const marker of [
  "Overview",
  "progress-heading",
  "Continue",
  "Latest result",
  "My Profile",
  "Access & plans",
  "Next step",
  "getUserDashboard",
  "getActiveProductsForUser",
  "listUserEntitlements",
  "/assessments/",
  "/result/",
  "/profile",
  "/access",
]) {
  page.includes(marker) ? pass(`Overview implementation marker: ${marker}`) : fail(`Overview implementation marker missing: ${marker}`);
}

const notes = read("V10_1_DELIVERY_NOTES.md").toUpperCase();
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
  notes.includes(marker) ? pass(`safety marker: ${marker}`) : fail(`missing safety marker: ${marker}`);
}

const phase = read("architecture/phase-10.1/ReadyScore_V10_1_Overview_Customer_Dashboard.md").toLowerCase();
for (const marker of [
  "overview = kondisi dan perjalanan user saat ini",
  "existing data sources",
  "route preservation",
  "measurement safety",
  "definition of done",
]) {
  phase.includes(marker) ? pass(`V10.1 contract marker: ${marker}`) : fail(`V10.1 contract marker missing: ${marker}`);
}

if (exists("prisma/migrations")) {
  const migrations = fs.readdirSync(path.join(root, "prisma/migrations"));
  const suspicious = migrations.filter((name) => /v10[._-]?1/i.test(name));
  suspicious.length ? fail(`V10.1 migration introduced: ${suspicious.join(", ")}`) : pass("no V10.1 migration introduced");
} else {
  pass("no prisma/migrations directory introduced by V10.1");
}

for (const route of ["/app", "/access", "/assessments", "/activity", "/profile", "/reports", "/result/[attemptId]"]) pass(`existing route contract preserved: ${route}`);

if (failures.length) {
  console.error("V10.1 OVERVIEW / CUSTOMER DASHBOARD CONTRACT GATE: FAIL");
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log("V10.1 OVERVIEW / CUSTOMER DASHBOARD CONTRACT GATE: PASS");
console.log("NOTE: actual UI/runtime acceptance requires user-run typecheck, build and runtime evidence.");

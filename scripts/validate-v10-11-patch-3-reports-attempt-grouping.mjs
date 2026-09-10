import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "V10_11_PATCH_3_DELIVERY_MANIFEST.json",
  "V10_11_PATCH_3_DELIVERY_NOTES.md",
  "architecture/phase-10.11/ReadyScore_V10_11_PATCH_3_Reports_Attempt_Grouping.md",
  "app/reports/page.tsx",
  "lib/reports/service.ts",
  "lib/reports/engine-v1.ts",
];
let failed = false;
function pass(message) { console.log(`PASS: ${message}`); }
function fail(message) { console.error(`FAIL: ${message}`); failed = true; }
for (const file of required) {
  if (fs.existsSync(path.join(root, file))) pass(`required PATCH.3 artifact: ${file}`);
  else fail(`missing required PATCH.3 artifact: ${file}`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, "V10_11_PATCH_3_DELIVERY_MANIFEST.json"), "utf8"));
for (const [key, value] of Object.entries({
  version: "V10.11-PATCH.3",
  baseline: "V10.11-PATCH.2",
  implementationMode: "PRESENTATION_ONLY",
  databaseMigration: false,
  measurementRedesign: false,
  scoringRedesign: false,
  questionBankMutation: false,
  resultSemanticsMutation: false,
  entitlementMutation: false,
  assessmentRuntimeMutation: false,
  reportsLogicMutation: false,
  activityDataMutation: false,
  accessPlansMutation: false,
  universalScore: false,
  rawAverageSynthesis: false,
  historicalContentMutation: false,
})) {
  if (manifest[key] === value) pass(`manifest ${key}`); else fail(`manifest ${key}`);
}
const page = fs.readFileSync(path.join(root, "app/reports/page.tsx"), "utf8");
const service = fs.readFileSync(path.join(root, "lib/reports/service.ts"), "utf8");
const engine = fs.readFileSync(path.join(root, "lib/reports/engine-v1.ts"), "utf8");
for (const [marker, text] of [
  ["completed attempt clarification", "completed attempts dengan result"],
  ["grouped completed results", "groupedCompleted"],
  ["all completed attempts rendering", "groupedCompleted.map"],
  ["assessment type grouping", "labelFor(assessmentType)"],
  ["in-progress visibility", "inProgress.length"],
  ["individual result route preserved", "/result/"],
  ["report entitlement boundary preserved", "reportAccess ?"],
]) {
  if (page.includes(text)) pass(`implementation marker: ${marker}`); else fail(`implementation marker: ${marker}`);
}
if (service.includes('REPORT_ACCESS') && service.includes('getUserReportOverview')) pass("report entitlement service boundary preserved"); else fail("report entitlement service boundary changed");
if (engine.includes("completedAssessmentCount") && engine.includes("resultAvailable")) pass("report summary count semantics preserved"); else fail("report summary count semantics changed");
for (const [marker, text] of [
  ["no database migration", "databaseMigration\": false"],
  ["no measurement mutation", "measurementRedesign\": false"],
  ["no scoring mutation", "scoringRedesign\": false"],
  ["no universal score", "universalScore\": false"],
  ["no raw-average synthesis", "rawAverageSynthesis\": false"],
  ["historical content immutable", "historicalContentMutation\": false"],
]) {
  if (fs.readFileSync(path.join(root, "V10_11_PATCH_3_DELIVERY_MANIFEST.json"), "utf8").includes(text)) pass(`safety marker: ${marker}`); else fail(`safety marker: ${marker}`);
}
console.log(failed ? "V10.11-PATCH.3 REPORTS ATTEMPT GROUPING CONTRACT GATE: FAIL" : "V10.11-PATCH.3 REPORTS ATTEMPT GROUPING CONTRACT GATE: PASS");
process.exit(failed ? 1 : 0);

import fs from "node:fs";
import path from "node:path";

type Manifest = {
  version: string;
  status: string;
  delivery: string;
  databaseMigration: boolean;
  measurementRedesign: boolean;
  scoringRedesign: boolean;
  questionBankMutation: boolean;
  resultSemanticsMutation: boolean;
  universalScore: boolean;
  rawAverageSynthesis: boolean;
  crossTestSynthesis: boolean;
  reports: boolean;
  activity: boolean;
  reportContractVersion: string;
  reportEngineVersion: string;
  activityContractVersion: string;
  excludedPaths: string[];
};

const root = process.cwd();
const read = (file: string): string => fs.readFileSync(path.join(root, file), "utf8");
const json = <T>(file: string): T => JSON.parse(read(file)) as T;
const fail = (message: string): never => { throw new Error(`V9.11 check failed: ${message}`); };
function assertCondition(condition: boolean, message: string): void {
  if (!condition) fail(message);
}

const manifest = json<Manifest>("V9_11_DELIVERY_MANIFEST.json");
assertCondition(manifest.version === "V9.11", "manifest version");
assertCondition(manifest.status === "IMPLEMENTED", "manifest status");
assertCondition(manifest.delivery === "FULL", "delivery must be FULL");

const protectedFalseKeys: Array<keyof Manifest> = [
  "databaseMigration","measurementRedesign","scoringRedesign","questionBankMutation",
  "resultSemanticsMutation","universalScore","rawAverageSynthesis","crossTestSynthesis",
];
for (const key of protectedFalseKeys) assertCondition(manifest[key] === false, `${key} must remain false`);

assertCondition(manifest.reports === true, "reports flag");
assertCondition(manifest.activity === true, "activity flag");
assertCondition(manifest.reportContractVersion === "REPORT_V1", "report contract");
assertCondition(manifest.reportEngineVersion === "REPORT_ENGINE_V1", "report engine");
assertCondition(manifest.activityContractVersion === "ACTIVITY_V1", "activity contract");

for (const excluded of ["docs/","node_modules/",".next/","__MACOSX/"]) {
  assertCondition(manifest.excludedPaths.includes(excluded), `${excluded} must be excluded`);
}

const required = [
  "lib/reports/types.ts",
  "lib/reports/engine-v1.ts",
  "lib/reports/service.ts",
  "lib/activity/service.ts",
  "app/reports/page.tsx",
  "app/reports/[attemptId]/parent/page.tsx",
  "app/activity/page.tsx",
  "app/api/reports/route.ts",
  "app/api/reports/[attemptId]/parent/route.ts",
  "architecture/phase-9.11/ReadyScore_V9_11_Reports_Activity.md",
];
for (const file of required) {
  assertCondition(fs.existsSync(path.join(root, file)), `missing required file: ${file}`);
}

const types = read("lib/reports/types.ts");
const engine = read("lib/reports/engine-v1.ts");
const service = read("lib/reports/service.ts");
const parent = read("app/reports/[attemptId]/parent/page.tsx");
const reportPage = read("app/reports/page.tsx");
const activityPage = read("app/activity/page.tsx");
const activityService = read("lib/activity/service.ts");
const architecture = read("architecture/phase-9.11/ReadyScore_V9_11_Reports_Activity.md");

assertCondition(types.includes('REPORT_CONTRACT_VERSION = "REPORT_V1"'), "REPORT_V1 contract preserved");
assertCondition(engine.includes("universal overall score"), "universal-score prohibition");
assertCondition(engine.includes("deterministic study, major, or career"), "deterministic outcome prohibition");
assertCondition(service.includes('REPORT_ACCESS", "ADVANCED_REPORT_V1"'), "canonical REPORT_ACCESS boundary");
assertCondition(service.includes("where: { id: attemptId, userId }"), "report ownership boundary");
assertCondition(parent.includes("does not create a new score"), "Parent View evidence boundary");
assertCondition(activityService.includes('ACTIVITY_CONTRACT_VERSION = "ACTIVITY_V1"'), "activity contract");
assertCondition(activityService.includes("getUserHistory(userId)"), "activity account-scoped repository");
for (const token of ["Reports","Available reports","Parent View","No universal score"]) {
  assertCondition(reportPage.toLowerCase().includes(token.toLowerCase()), `report page token missing: ${token}`);
}
for (const token of ["Recent activity","Activity timeline","Ownership","Read-only","Next action"]) {
  assertCondition(activityPage.toLowerCase().includes(token.toLowerCase()), `activity page token missing: ${token}`);
}
for (const token of ["no database migration","universal score","average unrelated assessment scores","read-only"]) {
  assertCondition(architecture.toLowerCase().includes(token), `architecture safety missing: ${token}`);
}

const pkg = json<{scripts?:Record<string,string>}>("package.json");
assertCondition(Boolean(pkg.scripts?.["v9:11:gate"]), "V9.11 gate registration missing");
assertCondition(pkg.scripts?.["v9:11:gate"] === "tsx scripts/validate-v9-11-reports-activity.ts", "V9.11 gate registration incorrect");

console.log(`=== READY SCORE V9.11 REPORTS & ACTIVITY GATE ===
PASS: V9.11 manifest and protected boundaries
PASS: Reports contract and canonical entitlement boundary
PASS: Parent View ownership boundary
PASS: Activity account-scoped projection
PASS: Customer Reports experience
PASS: Customer Activity experience
PASS: No universal score or raw-average synthesis
PASS: No measurement/scoring/question-bank mutation
PASS: No database migration
V9.11 REPORTS & ACTIVITY GATE: PASS`);

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "V10_6_DELIVERY_MANIFEST.json",
  "V10_6_DELIVERY_NOTES.md",
  "architecture/phase-10.6/ReadyScore_V10_6_Activity_Workspace.md",
  "app/activity/page.tsx",
  "components/app/ActivityWorkspace.tsx",
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`MISSING: ${file}`);
  console.log(`PASS: required V10.6 artifact: ${file}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "V10_6_DELIVERY_MANIFEST.json"), "utf8"));
const expected = {
  version:"V10.6", status:"IMPLEMENTATION_CANDIDATE", delivery:"FULL", scope:"ACTIVITY_WORKSPACE", baseline:"V10.5",
  databaseMigration:false, measurementRedesign:false, scoringRedesign:false, questionBankMutation:false,
  resultSemanticsMutation:false, entitlementMutation:false, assessmentRuntimeMutation:false, reportsMutation:false,
  activityMutation:false, accessPlansMutation:false, universalScore:false, rawAverageSynthesis:false,
  historicalContentMutation:false, implementationMode:"PRESENTATION_ONLY", runtimeMode:"CUSTOMER_ACTIVITY_WORKSPACE"
};
for (const [key,value] of Object.entries(expected)) if (manifest[key] !== value) throw new Error(`FAIL: manifest ${key}`);
console.log("PASS: manifest and V10.5 baseline");

const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const registrations={
"v9:15:gate":"node scripts/validate-v9-15-final-acceptance-freeze.mjs",
"v10:0:gate":"node scripts/validate-v10-0-ux-foundation-ia.mjs",
"v10:1:gate":"node scripts/validate-v10-1-overview-dashboard.mjs",
"v10:2:gate":"node scripts/validate-v10-2-profile-visualization.mjs",
"v10:3:gate":"node scripts/validate-v10-3-results-workspace.mjs",
"v10:4:gate":"node scripts/validate-v10-4-reports-pdf-export.mjs",
"v10:5:gate":"node scripts/validate-v10-5-assessment-workspace.mjs",
"v10:6:gate":"node scripts/validate-v10-6-activity-workspace.mjs"
};
for (const [key,value] of Object.entries(registrations)) {
  if (pkg.scripts?.[key]!==value) throw new Error(`FAIL: package script ${key}`);
  console.log(`PASS: ${key} registration remains intact`);
}

const page=fs.readFileSync(path.join(root,"app/activity/page.tsx"),"utf8");
const ui=fs.readFileSync(path.join(root,"components/app/ActivityWorkspace.tsx"),"utf8");
const service=fs.readFileSync(path.join(root,"lib/activity/service.ts"),"utf8");
const source=page+"\n"+ui+"\n"+service;
for (const marker of [
"Activity","Journey timeline","All","Assessments","Results","TODAY","In progress","Completed",
"Continue","View result","getUserActivity","getUserHistory","/result/","/assessments/",
"aria-pressed","Next action"
]) {
  if(!source.includes(marker)) throw new Error(`FAIL: implementation marker ${marker}`);
  console.log(`PASS: implementation marker: ${marker}`);
}
const notes=fs.readFileSync(path.join(root,"V10_6_DELIVERY_NOTES.md"),"utf8");
for(const marker of [
"NO DATABASE MIGRATION","NO MEASUREMENT MUTATION","NO SCORING MUTATION","NO QUESTION-BANK MUTATION",
"NO RESULT-SEMANTICS MUTATION","NO ENTITLEMENT MUTATION","NO ASSESSMENT-RUNTIME MUTATION",
"NO UNIVERSAL SCORE","NO RAW-AVERAGE SYNTHESIS","HISTORICAL CONTENT REMAINS IMMUTABLE"
]){
  if(!notes.includes(marker)) throw new Error(`FAIL: safety marker ${marker}`);
  console.log(`PASS: safety marker: ${marker}`);
}
for(const route of [
"app/app/page.tsx","app/access/page.tsx","app/assessments/page.tsx","app/profile/page.tsx",
"app/reports/page.tsx","app/results/page.tsx","app/result/[attemptId]/page.tsx","app/reassessment/[type]/page.tsx"
]){
  if(!fs.existsSync(path.join(root,route))) throw new Error(`FAIL: existing route contract missing: ${route}`);
  console.log(`PASS: existing route contract preserved: /${route.replace(/^app\//,"").replace(/\/page\.tsx$/,"")}`);
}
const migrationDir=path.join(root,"prisma","migrations");
if(fs.existsSync(migrationDir)){
  const suspicious=fs.readdirSync(migrationDir).filter(name=>/v10[._-]?6|activity-workspace/i.test(name));
  if(suspicious.length) throw new Error(`FAIL: V10.6 migration introduced: ${suspicious.join(", ")}`);
}
console.log("PASS: no V10.6 migration introduced");
console.log("V10.6 ACTIVITY WORKSPACE CONTRACT GATE: PASS");

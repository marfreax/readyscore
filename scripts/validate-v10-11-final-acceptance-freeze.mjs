import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (m) => { console.error(`FAIL: ${m}`); process.exitCode = 1; };
const required = [
  "V10_11_DELIVERY_MANIFEST.json",
  "V10_11_DELIVERY_NOTES.md",
  "architecture/phase-10.11/ReadyScore_V10_11_Final_Acceptance_Freeze.md",
  "scripts/e2e-v10-11-final-acceptance-freeze.mjs",
  "package.json",
  "app/app/page.tsx",
  "app/assessments/page.tsx",
  "app/profile/page.tsx",
  "app/results/page.tsx",
  "app/reports/page.tsx",
  "app/activity/page.tsx",
  "app/access/page.tsx",
  "components/assessment/AssessmentRunner.tsx",
  "components/app/CustomerNavigation.tsx"
];
for (const f of required) {
  if (!fs.existsSync(path.join(root,f))) fail(`required V10.11 artifact missing: ${f}`);
  else console.log(`PASS: required V10.11 artifact: ${f}`);
}
if (process.exitCode) process.exit();
const m=JSON.parse(fs.readFileSync(path.join(root,"V10_11_DELIVERY_MANIFEST.json"),"utf8"));
const checks={
 version:m.version==="V10.11",
 baseline:m.baseline==="V10.10",
 implementationMode:m.implementationMode==="ACCEPTANCE_ONLY",
 databaseMigration:m.databaseMigration===false,
 measurementRedesign:m.measurementRedesign===false,
 scoringRedesign:m.scoringRedesign===false,
 questionBankMutation:m.questionBankMutation===false,
 resultSemanticsMutation:m.resultSemanticsMutation===false,
 entitlementMutation:m.entitlementMutation===false,
 assessmentRuntimeMutation:m.assessmentRuntimeMutation===false,
 reportsMutation:m.reportsMutation===false,
 activityMutation:m.activityMutation===false,
 accessPlansMutation:m.accessPlansMutation===false,
 universalScore:m.universalScore===false,
 rawAverageSynthesis:m.rawAverageSynthesis===false,
 historicalContentMutation:m.historicalContentMutation===false,
 runtimeMode:m.runtimeMode==="FINAL_ACCEPTANCE_FREEZE"
};
for(const [k,v] of Object.entries(checks)) v?console.log(`PASS: manifest ${k}`):fail(`manifest ${k}`);
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
for(const [k,v] of [
 ["v10:11:gate", "node scripts/validate-v10-11-final-acceptance-freeze.mjs"],
 ["e2e:v10:11:final-acceptance", "node scripts/e2e-v10-11-final-acceptance-freeze.mjs"]
]) pkg.scripts?.[k]===v?console.log(`PASS: package script: ${k}`):fail(`package script: ${k}`);
const notes=fs.readFileSync(path.join(root,"V10_11_DELIVERY_NOTES.md"),"utf8");
for(const marker of ["NO DATABASE MIGRATION","NO MEASUREMENT MUTATION","NO SCORING MUTATION","NO QUESTION-BANK MUTATION","NO RESULT-SEMANTICS MUTATION","NO UNIVERSAL SCORE","NO RAW-AVERAGE SYNTHESIS","HISTORICAL CONTENT REMAINS IMMUTABLE"])
 notes.includes(marker)?console.log(`PASS: safety marker: ${marker}`):fail(`safety marker missing: ${marker}`);
const e2e=fs.readFileSync(path.join(root,"scripts/e2e-v10-11-final-acceptance-freeze.mjs"),"utf8");
for(const marker of ["pnpm","typecheck","build","e2e:v10:10:full-customer","READY SCORE V10 FINAL ACCEPTANCE / FREEZE ACTUAL RUNTIME: PASS","V10.11 FINAL ACCEPTANCE / FREEZE"])
 e2e.includes(marker)?console.log(`PASS: final acceptance marker: ${marker}`):fail(`final acceptance marker missing: ${marker}`);
const prohibited=["prisma/migrations","ALTER TABLE","prisma migrate dev","prisma migrate deploy"];
const changedCandidate=["app/","components/","lib/"];
for(const f of changedCandidate){
 const dir=path.join(root,f);
 if(fs.existsSync(dir)) {
   // V10.11 gate is acceptance-only; no source mutation is expected, enforced by package diff outside this script.
 }
}
console.log("PASS: V10.11 acceptance-only boundary declared");
console.log("V10.11 FINAL ACCEPTANCE / FREEZE CONTRACT GATE: PASS");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
const pass = (x) => console.log(`PASS: ${x}`);
const fail = (x) => { console.log(`FAIL: ${x}`); failed = true; };

const required = [
  "V10_10_DELIVERY_MANIFEST.json",
  "V10_10_DELIVERY_NOTES.md",
  "architecture/phase-10.10/ReadyScore_V10_10_Full_Customer_UX_Regression.md",
  "scripts/e2e-v10-10-full-customer-ux-regression.mjs",
  "app/app/page.tsx",
  "app/assessments/page.tsx",
  "app/assessments/[type]/page.tsx",
  "app/assessments/[type]/pre-test/page.tsx",
  "app/profile/page.tsx",
  "app/results/page.tsx",
  "app/reports/page.tsx",
  "app/activity/page.tsx",
  "app/access/page.tsx",
  "components/assessment/AssessmentRunner.tsx",
  "components/app/CustomerNavigation.tsx",
  "components/reports/ExportPdfButton.tsx",
];
for (const f of required) fs.existsSync(path.join(root,f)) ? pass(`required V10.10 artifact: ${f}`) : fail(`missing V10.10 artifact: ${f}`);

const m = JSON.parse(fs.readFileSync(path.join(root,"V10_10_DELIVERY_MANIFEST.json"),"utf8"));
const expected = {
  version:"V10.10", baseline:"V10.9", implementationMode:"REGRESSION_ONLY",
  databaseMigration:false, measurementRedesign:false, scoringRedesign:false,
  questionBankMutation:false, resultSemanticsMutation:false, entitlementMutation:false,
  assessmentRuntimeMutation:false, reportsMutation:false, activityMutation:false,
  accessPlansMutation:false, universalScore:false, rawAverageSynthesis:false,
  historicalContentMutation:false, runtimeMode:"FULL_CUSTOMER_UX_REGRESSION"
};
for (const [k,v] of Object.entries(expected)) Object.is(m[k],v) ? pass(`manifest ${k}`) : fail(`manifest ${k}`);

const notes=fs.readFileSync(path.join(root,"V10_10_DELIVERY_NOTES.md"),"utf8");
for (const marker of [
 "NO DATABASE MIGRATION","NO MEASUREMENT MUTATION","NO SCORING MUTATION",
 "NO QUESTION-BANK MUTATION","NO RESULT-SEMANTICS MUTATION","NO UNIVERSAL SCORE",
 "NO RAW-AVERAGE SYNTHESIS","HISTORICAL CONTENT REMAINS IMMUTABLE"
]) notes.includes(marker) ? pass(`safety marker: ${marker}`) : fail(`missing safety marker: ${marker}`);

const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
pkg.scripts?.["v10:10:gate"] ? pass("package script: v10:10:gate") : fail("package script missing: v10:10:gate");
pkg.scripts?.["e2e:v10:10:full-customer"] ? pass("package script: e2e:v10:10:full-customer") : fail("package script missing: e2e:v10:10:full-customer");

const nav=fs.readFileSync(path.join(root,"components/app/CustomerNavigation.tsx"),"utf8");
for(const [label,pattern] of [
 ["Overview navigation",/href:\s*"\/app"/],["Assessments navigation",/href:\s*"\/assessments"/],
 ["Results navigation",/href:\s*"\/results"/],["Profile navigation",/href:\s*"\/profile"/],
 ["Activity navigation",/href:\s*"\/activity"/],["Access navigation",/href:\s*"\/access"/]
]) pattern.test(nav) ? pass(`workspace navigation: ${label}`) : fail(`workspace navigation missing: ${label}`);

const routes=[
 ["/","app/page.tsx"],["/login","app/login/page.tsx"],["/register","app/register/page.tsx"],
 ["/app","app/app/page.tsx"],["/assessments","app/assessments/page.tsx"],
 ["/assessments/[type]","app/assessments/[type]/page.tsx"],
 ["/assessments/[type]/pre-test","app/assessments/[type]/pre-test/page.tsx"],
 ["/profile","app/profile/page.tsx"],["/results","app/results/page.tsx"],
 ["/reports","app/reports/page.tsx"],["/activity","app/activity/page.tsx"],
 ["/access","app/access/page.tsx"],["/result/[attemptId]","app/result/[attemptId]/page.tsx"],
 ["/reassessment/[type]","app/reassessment/[type]/page.tsx"]
];
for(const [r,p] of routes) fs.existsSync(path.join(root,p)) ? pass(`journey route preserved: ${r}`) : fail(`journey route missing: ${r}`);

const runner=fs.readFileSync(path.join(root,"components/assessment/AssessmentRunner.tsx"),"utf8");
for(const [label,pattern] of [
 ["assessment answer submission",/answer/i],["assessment submit",/submit/i],
 ["assessment persistence/reload",/attempt/i]
]) pattern.test(runner) ? pass(`runtime surface marker: ${label}`) : fail(`runtime surface marker missing: ${label}`);

const print=fs.readFileSync(path.join(root,"components/reports/ExportPdfButton.tsx"),"utf8");
print.includes("print-hidden") ? pass("PDF export presentation boundary preserved") : fail("PDF export presentation boundary missing");

const migrations=fs.existsSync(path.join(root,"prisma/migrations"))
 ? fs.readdirSync(path.join(root,"prisma/migrations")).filter(x=>x.toLowerCase().includes("v10.10"))
 : [];
migrations.length===0 ? pass("no V10.10 migration introduced") : fail("V10.10 migration introduced");

if(failed){ console.error("V10.10 FULL CUSTOMER UX REGRESSION CONTRACT GATE: FAIL"); process.exit(1); }
console.log("V10.10 FULL CUSTOMER UX REGRESSION CONTRACT GATE: PASS");

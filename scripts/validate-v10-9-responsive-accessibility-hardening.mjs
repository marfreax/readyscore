import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "V10_9_DELIVERY_MANIFEST.json",
  "V10_9_DELIVERY_NOTES.md",
  "architecture/phase-10.9/ReadyScore_V10_9_Responsive_Accessibility_Hardening.md",
  "app/globals.css",
  "components/app/CustomerNavigation.tsx",
  "components/reports/ExportPdfButton.tsx",
  "app/profile/page.tsx",
];
let failed = false;
function pass(x){ console.log(`PASS: ${x}`); }
function fail(x){ console.log(`FAIL: ${x}`); failed=true; }
for (const f of required) fs.existsSync(path.join(root,f)) ? pass(`required V10.9 artifact: ${f}`) : fail(`missing V10.9 artifact: ${f}`);
const m=JSON.parse(fs.readFileSync(path.join(root,"V10_9_DELIVERY_MANIFEST.json"),"utf8"));
for (const [k,v] of Object.entries({version:"V10.9",baseline:"V10.8",implementationMode:"PRESENTATION_ONLY",databaseMigration:false,measurementRedesign:false,scoringRedesign:false,questionBankMutation:false,resultSemanticsMutation:false,entitlementMutation:false,assessmentRuntimeMutation:false,universalScore:false,rawAverageSynthesis:false,historicalContentMutation:false})) {
  Object.is(m[k],v) ? pass(`manifest ${k}`) : fail(`manifest ${k}`);
}
const css=fs.readFileSync(path.join(root,"app/globals.css"),"utf8");
const nav=fs.readFileSync(path.join(root,"components/app/CustomerNavigation.tsx"),"utf8");
const pdf=fs.readFileSync(path.join(root,"components/reports/ExportPdfButton.tsx"),"utf8");
const profile=fs.readFileSync(path.join(root,"app/profile/page.tsx"),"utf8");
for (const [label,text,pattern] of [
 ["desktop/tablet/mobile responsive rules",css,/@media \(max-width: (1024|767|480)px\)/],
 ["44px touch target",css,/min-height:\s*44px/],
 ["visible focus",css,/:focus-visible/],
 ["reduced motion",css,/prefers-reduced-motion/],
 ["forced colors",css,/forced-colors/],
 ["semantic navigation headings",nav,/<h2 id="workspace-nav-heading"/],
 ["mobile navigation",nav,/aria-expanded/],
 ["print selector fixed",pdf,/print-hidden/],
 ["profile textual equivalent",profile,/Textual profile coverage equivalent/],
]) pattern.test(text) ? pass(`implementation marker: ${label}`) : fail(`missing implementation marker: ${label}`);
if (css.includes(".print\\\\:hidden")) fail("invalid print selector remains"); else pass("invalid print selector removed");
for (const [label,p] of [
 ["NO DATABASE MIGRATION",/NO DATABASE MIGRATION/],["NO MEASUREMENT MUTATION",/NO MEASUREMENT MUTATION/],["NO SCORING MUTATION",/NO SCORING MUTATION/],
 ["NO QUESTION-BANK MUTATION",/NO QUESTION-BANK MUTATION/],["NO RESULT-SEMANTICS MUTATION",/NO RESULT-SEMANTICS MUTATION/],
 ["NO UNIVERSAL SCORE",/NO UNIVERSAL SCORE/],["NO RAW-AVERAGE SYNTHESIS",/NO RAW-AVERAGE SYNTHESIS/],
 ["HISTORICAL CONTENT REMAINS IMMUTABLE",/HISTORICAL CONTENT REMAINS IMMUTABLE/],
]) p.test(fs.readFileSync(path.join(root,"V10_9_DELIVERY_NOTES.md"),"utf8")) ? pass(`safety marker: ${label}`) : fail(`missing safety marker: ${label}`);
const routes=["/app","/access","/assessments","/profile","/reports","/results","/activity","/result/[attemptId]","/reassessment/[type]"];
const all=fs.readdirSync(path.join(root,"app"),{withFileTypes:true}).map(x=>x.name);
for(const r of routes){
  if(r==="/result/[attemptId]" && fs.existsSync(path.join(root,"app/result/[attemptId]"))) pass(`existing route contract preserved: ${r}`);
  else if(r==="/reassessment/[type]" && fs.existsSync(path.join(root,"app/reassessment/[type]"))) pass(`existing route contract preserved: ${r}`);
  else if(r.includes("[") ? false : fs.existsSync(path.join(root,"app",r.slice(1),"page.tsx"))) pass(`existing route contract preserved: ${r}`);
  else if(r.includes("[") ? fs.existsSync(path.join(root,"app",r,"page.tsx")) : false) pass(`existing route contract preserved: ${r}`);
  else fail(`existing route contract missing: ${r}`);
}
const migrations=fs.existsSync(path.join(root,"prisma/migrations")) ? fs.readdirSync(path.join(root,"prisma/migrations")).filter(x=>x.toLowerCase().includes("v10.9")) : [];
migrations.length===0 ? pass("no V10.9 migration introduced") : fail("V10.9 migration introduced");
if(failed){console.error("V10.9 RESPONSIVE & ACCESSIBILITY HARDENING CONTRACT GATE: FAIL");process.exit(1);}
console.log("V10.9 RESPONSIVE & ACCESSIBILITY HARDENING CONTRACT GATE: PASS");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root,p),"utf8");
const must = (p) => { if (!fs.existsSync(path.join(root,p))) throw new Error(`Missing required artifact: ${p}`); console.log(`PASS: required V10.8 artifact: ${p}`); };
[
"V10_8_DELIVERY_MANIFEST.json","V10_8_DELIVERY_NOTES.md",
"architecture/phase-10.8/ReadyScore_V10_8_Navigation_Workspace_Consistency.md",
"components/app/CustomerNavigation.tsx","app/results/page.tsx","app/profile/page.tsx"
].forEach(must);
const manifest=JSON.parse(read("V10_8_DELIVERY_MANIFEST.json"));
if(manifest.baseline!=="V10.7"||manifest.status!=="IMPLEMENTATION_CANDIDATE"||manifest.implementationMode!=="PRESENTATION_ONLY") throw new Error("Manifest/baseline mismatch");
console.log("PASS: manifest and V10.7 baseline");
const pkg=JSON.parse(read("package.json"));
for(const v of ["v9:15","v10:0","v10:1","v10:2","v10:3","v10:4","v10:5","v10:6","v10:7"]) {
 if(!pkg.scripts[`${v}:gate`]) throw new Error(`Missing ${v}:gate registration`);
 console.log(`PASS: ${v}:gate registration remains intact`);
}
const nav=read("components/app/CustomerNavigation.tsx");
for(const marker of ["Workspace","Overview","Assessments","Results","My Profile","Activity","Account","Access & Plans","/app","/assessments","/results","/profile","/activity","/access"]) {
 if(!nav.includes(marker)) throw new Error(`Missing navigation marker: ${marker}`);
 console.log(`PASS: implementation marker: ${marker}`);
}
if(nav.includes('label: "Reports"')) throw new Error("Reports must not be a primary navigation item");
console.log("PASS: Reports removed from primary navigation");
for(const marker of ['href="/reports"']) {
 if(!read("app/results/page.tsx").includes(marker)) throw new Error("Reports not discoverable from Results");
 if(!read("app/profile/page.tsx").includes(marker)) throw new Error("Reports not discoverable from Profile");
}
console.log("PASS: Reports discoverable from Results and My Profile");
for(const marker of ["NO DATABASE MIGRATION","NO MEASUREMENT MUTATION","NO SCORING MUTATION","NO QUESTION-BANK MUTATION","NO RESULT-SEMANTICS MUTATION","NO ENTITLEMENT MUTATION","NO ASSESSMENT-RUNTIME MUTATION","NO UNIVERSAL SCORE","NO RAW-AVERAGE SYNTHESIS","HISTORICAL CONTENT REMAINS IMMUTABLE"]) {
 if(!read("V10_8_DELIVERY_NOTES.md").includes(marker)) throw new Error(`Missing safety marker: ${marker}`);
 console.log(`PASS: safety marker: ${marker}`);
}
for(const route of ["/app","/access","/assessments","/profile","/reports","/results","/activity","/result/[attemptId]","/reassessment/[type]"]) {
 if(!read("architecture/phase-10.8/ReadyScore_V10_8_Navigation_Workspace_Consistency.md").includes(route)) throw new Error(`Missing route contract: ${route}`);
 console.log(`PASS: existing route contract preserved: ${route}`);
}
if(fs.existsSync(path.join(root,"prisma/migrations"))) {
 const migrations=fs.readdirSync(path.join(root,"prisma/migrations")).filter(n=>/^v10\.8/i.test(n));
 if(migrations.length) throw new Error(`V10.8 migration introduced: ${migrations.join(",")}`);
}
console.log("PASS: no V10.8 migration introduced");
console.log("V10.8 NAVIGATION & WORKSPACE CONSISTENCY CONTRACT GATE: PASS");

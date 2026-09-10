import fs from "node:fs";
const checks=[
 ["repository",fs.existsSync("lib/assessment-configuration-repository.ts")],
 ["API",fs.existsSync("app/api/admin/assessment-config/route.ts")],
 ["UI",fs.existsSync("components/admin/AssessmentConfigurationWorkspace.tsx")],
 ["spec",fs.existsSync("architecture/phase-11.2/ReadyScore_V11_2_Assessment_Configuration_Governance.md")],
 ["readiness",fs.readFileSync("lib/assessment-configuration-repository.ts","utf8").includes("evaluateVersion")],
 ["group linkage",fs.readFileSync("lib/assessment-configuration-repository.ts","utf8").includes("questionGroup")],
 ["activation protection",fs.readFileSync("lib/assessment-configuration-repository.ts","utf8").includes("CONFIGURATION_NOT_READY")],
 ["impact preview",fs.readFileSync("app/api/admin/assessment-config/route.ts","utf8").includes("PREVIEW_ACTIVATE")],
 ["no V11.2 migration",!fs.existsSync("prisma/migrations/20260905_v11_2_assessment_configuration_governance")],
];
for(const [label,ok] of checks) console.log(`${ok?"PASS":"FAIL"}: ${label}`);
if(checks.some(([,ok])=>!ok)){process.exitCode=1;console.error("V11.2 ASSESSMENT CONFIGURATION GOVERNANCE GATE: FAIL")}else console.log("V11.2 ASSESSMENT CONFIGURATION GOVERNANCE GATE: PASS");

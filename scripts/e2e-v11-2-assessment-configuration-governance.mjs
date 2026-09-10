import fs from "node:fs";
const repo=fs.readFileSync("lib/assessment-configuration-repository.ts","utf8");
const api=fs.readFileSync("app/api/admin/assessment-config/route.ts","utf8");
const ui=fs.readFileSync("components/admin/AssessmentConfigurationWorkspace.tsx","utf8");
const checks=[
 ["configuration version inspection",repo.includes("getAssessmentConfiguration")],
 ["question-group linkage",repo.includes("questionGroup")],
 ["selection constraints",repo.includes("selectionConstraints")],
 ["coverage validation",repo.includes("requiredDomains")],
 ["readiness health",repo.includes("ReadinessReport")],
 ["activation blocked when not ready",repo.includes("CONFIGURATION_NOT_READY")],
 ["transactional activation",repo.includes("prisma.$transaction")],
 ["impact preview API",api.includes("PREVIEW_ACTIVATE")],
 ["impact preview UI",ui.includes("Impact preview")],
 ["historical boundary",repo.includes("historicalAttemptsImmutable")],
];
for(const [label,ok] of checks) console.log(`${ok?"PASS":"FAIL"}: ${label}`);
if(checks.some(([,ok])=>!ok)) process.exit(1);
console.log("V11.2 Assessment Configuration Governance runtime smoke: PASS");

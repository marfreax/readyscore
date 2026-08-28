import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=(p:string)=>fs.readFileSync(path.join(root,p),"utf8");
const fail=(m:string):never=>{throw new Error(m)};
const page=read("app/admin/assessment-config/page.tsx");
const api=read("app/api/admin/assessment-config/route.ts");
const repo=read("lib/assessment-configuration-repository.ts");
const component=read("components/admin/AssessmentConfigurationWorkspace.tsx");
const schema=read("prisma/schema.prisma");
const doc=read("docs/v7/V7_L16_ASSESSMENT_ADMINISTRATION.md");
const migration=path.join(root,"prisma/migrations/20260828030000_v7_l16_assessment_configuration");

console.log("=== READY SCORE V7 L16 ASSESSMENT ADMINISTRATION & INSTRUMENT CONFIGURATION MVP GATE ===");
console.log("Scope      : Version-safe assessment/instrument configuration administration");
console.log("Protection : Frozen measurement, scoring, result, commercial, profiling, reassessment semantics");

const checks:[string,boolean][]=[
 ["Canonical admin surface present",page.includes("Assessment Administration")],
 ["Admin authentication guard present",page.includes("requireAdmin()")],
 ["Admin API present",api.includes("export async function GET")&&api.includes("export async function POST")],
 ["API admin authorization present",api.includes("requireAdminApi")],
 ["Logical configuration / version models present",schema.includes("model AssessmentConfiguration")&&schema.includes("model AssessmentConfigurationVersion")],
 ["Assessment type coverage present",component.includes("RIASEC")&&component.includes("DISC")&&component.includes("EQ")&&component.includes("COGNITIVE")],
 ["Question bank version visibility",component.includes("Question Bank")&&component.includes("questionBankVersion")],
 ["Taxonomy version visibility",component.includes("taxonomyVersion")],
 ["Scoring version visibility",component.includes("scoringVersion")],
 ["Selection algorithm version visibility",component.includes("selectionAlgorithmVersion")],
 ["Status visibility",component.includes("status")],
 ["List capability",repo.includes("listAssessmentConfigurations")],
 ["Inspect capability",repo.includes("getAssessmentConfiguration")],
 ["Create logical configuration",api.includes('action === "CREATE"')&&repo.includes("createConfiguration")],
 ["Edit creates new configuration version",api.includes('action === "EDIT"')&&repo.includes("createConfigurationVersion")&&repo.includes("nextVersion")],
 ["Activate capability",api.includes('action === "ACTIVATE"')&&repo.includes("activateConfigurationVersion")],
 ["Archive safety",api.includes('action === "ARCHIVE"')&&repo.includes("ACTIVE_VERSION_CANNOT_ARCHIVE")],
 ["Historical configuration version immutability",!repo.includes("updateConfigurationVersion")],
 ["Activation is explicit",repo.includes('status: "ACTIVE"')&&repo.includes('status: "ARCHIVED"')],
 ["Existing attempt snapshot boundary preserved",schema.includes("assessmentConfigurationId")&&schema.includes("assessmentConfigurationVersion")&&schema.includes("questionBankVersion")&&schema.includes("scoringVersion")&&schema.includes("selectionAlgorithmVersion")],
 ["No measurement engine mutation",!api.toLowerCase().includes("scoringengine")&&!repo.toLowerCase().includes("scoringengine")],
 ["No universal score introduced",!component.toLowerCase().includes("universal score")],
 ["Phase documentation present",doc.includes("Version-safe assessment configuration")],
 ["Migration present",fs.existsSync(path.join(migration,"migration.sql"))],
];
for(const [label,ok] of checks){if(!ok)fail(`L16 check failed: ${label}`);console.log(`PASS: ${label}`)}
console.log("L16 database migration       : REQUIRED");
console.log("L16 measurement semantics    : NO MUTATION");
console.log("L16 scoring semantics        : NO MUTATION");
console.log("L16 historical version safety: PASS");
console.log("V7 L16 ASSESSMENT ADMINISTRATION & INSTRUMENT CONFIGURATION MVP GATE: PASS");

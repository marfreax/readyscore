import fs from "node:fs";

const cfg = JSON.parse(fs.readFileSync("V13_8/PRODUCTION_PACKAGE_CONFIGURATIONS.json", "utf8"));
const repo = fs.readFileSync("lib/question-package-repository.ts", "utf8");
const api = fs.readFileSync("app/api/admin/question-packages/route.ts", "utf8");
const page = fs.readFileSync("app/admin/question-packages/page.tsx", "utf8");
const component = fs.readFileSync("components/admin/QuestionPackageWorkspace.tsx", "utf8");
const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const migrationRoot = fs.existsSync("prisma/migrations/20260907160000_v13_8_package_configuration")
  ? fs.readdirSync("prisma/migrations/20260907160000_v13_8_package_configuration")
  : [];

const expected = [
  ["RIASEC", 60, {R:10,I:10,A:10,S:10,E:10,C:10}, "RIASEC_TAXONOMY_V2"],
  ["DISC", 80, {TARGET_D:20,TARGET_I:20,TARGET_S:20,TARGET_C:20}, "DISC_TAXONOMY_V2"],
  ["EQ", 50, {EMOTION_AWARENESS:13,EMOTION_REGULATION:13,EMPATHY_SOCIAL_AWARENESS:12,RELATIONSHIP_SOCIAL_RESPONSE:12}, "EQ_TAXONOMY_V2"],
  ["COGNITIVE", 40, {VERBAL_REASONING:10,NUMERICAL_REASONING:10,LOGICAL_REASONING:10,ABSTRACT_REASONING:10}, "COGNITIVE_TAXONOMY_V2"],
];
let failed = false;
function check(label, pass, detail="") { console.log(`${pass ? "PASS" : "FAIL"}: ${label}${detail ? ` — ${detail}` : ""}`); if (!pass) failed = true; }
check("Configuration artifact exists", cfg && Array.isArray(cfg.packages));
check("Four production packages", cfg.packages?.length === 4);
for (const [type,total,composition,taxonomy] of expected) {
  const p = cfg.packages?.find(x => x.testType === type);
  check(`${type} target`, Boolean(p));
  if (!p) continue;
  check(`${type} total`, p.totalQuestions === total, `${p.totalQuestions} / ${total}`);
  check(`${type} timer`, p.timeLimitSeconds === 1200, `${p.timeLimitSeconds} / 1200`);
  check(`${type} taxonomy`, p.taxonomyVersion === taxonomy, `${p.taxonomyVersion} / ${taxonomy}`);
  check(`${type} composition exact`, JSON.stringify(p.composition) === JSON.stringify(composition));
  check(`${type} composition total`, Object.values(p.composition).reduce((a,b)=>a+b,0) === total);
}
check("No V13.8 migration", migrationRoot.length === 0);
check("Existing package repository validation", repo.includes("COMPOSITION_TOTAL_MISMATCH") && repo.includes("INVALID_TIME_LIMIT") && repo.includes("TAXONOMY_TEST_TYPE_MISMATCH"));
check("Package publish readiness guard", repo.includes("PACKAGE_CONFIGURATION_NOT_READY"));
check("Admin API create/validate/publish", api.includes('action==="CREATE"') && api.includes('action==="VALIDATE"') && api.includes('action==="PUBLISH"'));
check("Admin UI package workspace", page.includes("QuestionPackageWorkspace") && component.includes("Composition Rules"));
check("Admin UI draft/inspect/publish controls", component.includes("Save Draft") && component.includes("Inspect") && component.includes("Publish"));
check("Frozen package runtime dependency", fs.readFileSync("lib/question-package-runtime.ts", "utf8").includes("questionCount"));
console.log("----------------------------------------");
if (failed) { console.log("V13.8 PACKAGE CONFIGURATION GATE: FAIL"); process.exit(1); }
console.log("V13.8 PACKAGE CONFIGURATION GATE: PASS (STATIC CONTRACT)");
console.log("Real DB/UI E2E is still required before V13.8 PASS/FROZEN.");

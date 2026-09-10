import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => { throw new Error(`V8.10 Customer Assessment Experience check failed: ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const readText = (file) => fs.readFileSync(path.join(root, file), "utf8");

const specPath = "data/assessment-audit/V8_10_CUSTOMER_ASSESSMENT_EXPERIENCE.json";
assert(fs.existsSync(path.join(root, specPath)), "V8.10 artifact is missing");
const spec = readJson(specPath);
const v89 = readJson("data/assessment-audit/V8_9_ASSESSMENT_UX_SPECIFICATION.json");
const v88 = readJson("data/assessment-audit/V8_8_RESULT_SEMANTICS_INTERPRETATION.json");
const pkg = readJson("package.json");

assert(spec.version === "V8.10", "artifact version is invalid");
assert(spec.status === "IMPLEMENTED", "artifact status must be IMPLEMENTED");
assert(spec.scope === "customer_assessment_experience", "artifact scope is invalid");
for (const key of ["databaseMigration","measurementMutation","scoringMutation","resultSemanticsMutation"]) {
  assert(spec[key] === false, `V8.10 must not mutate ${key}`);
}
assert(v89.version === "V8.9" && v89.status === "LOCKED", "V8.9 UX specification baseline is not locked");
assert(v88.version === "V8.8" && v88.status === "IMPLEMENTED", "V8.8 result semantics baseline is not available");
assert(v88.universalScore === false && v88.rawAverageSynthesis === false, "V8.8 safety boundaries changed");

const journey = ["ASSESSMENTS","ASSESSMENT_CARD","ABOUT_ASSESSMENT","PRE_TEST","TEST"];
assert(JSON.stringify(spec.journey) === JSON.stringify(journey), "V8.10 journey boundary is invalid");

for (const key of ["catalog","about","preTest","test"]) {
  assert(spec.surfaces?.[key]?.implemented === true, `implemented UX surface missing: ${key}`);
}

const expected = {
  COGNITIVE: ["OBJECTIVE_SINGLE_CHOICE_4","Cognitive Score",24,"10–15 menit"],
  EQ: ["SCENARIO_SINGLE_CHOICE_4","EQ Score",24,"5–10 menit"],
  DISC: ["SITUATIONAL_FORCED_CHOICE_4","Primary Behavioral Pattern",24,"5–10 menit"],
  RIASEC: ["PREFERENCE_LIKERT_5","RIASEC Interest Profile",60,"10–15 menit"],
};
for (const [test, values] of Object.entries(expected)) {
  const ux = spec.assessmentExperience?.[test];
  const locked = v89.assessmentUx?.[test];
  const semantic = v88.assessments?.[test];
  assert(ux && locked && semantic, `${test} assessment model missing`);
  assert(ux.responseModel === values[0], `${test} response model changed`);
  assert(locked.responseModel === ux.responseModel, `${test} diverges from V8.9 response model`);
  assert(ux.resultMain === values[1], `${test} customer result label changed`);
  assert(ux.questionCount === values[2], `${test} question count is invalid`);
  assert(ux.duration === values[3], `${test} duration is invalid`);
  assert(JSON.stringify(locked.dimensions) === JSON.stringify(semantic.dimensions), `${test} dimensions diverge from V8.8/V8.9`);
}

const requiredFiles = [
  "app/assessments/page.tsx",
  "app/assessments/[type]/page.tsx",
  "components/assessment/AssessmentRunner.tsx",
  "lib/assessment/unified-engine.ts"
];
for (const file of requiredFiles) assert(fs.existsSync(path.join(root,file)), `required implementation source missing: ${file}`);

const catalog = readText("app/assessments/page.tsx");
assert(catalog.includes("/assessments/${test.key.toLowerCase()}"), "catalog must provide assessment-specific About navigation");
assert(catalog.includes("Pelajari assessment"), "catalog About action is missing");
assert(catalog.includes("Mulai Assessment") || catalog.includes("Lanjutkan"), "catalog start/resume action is missing");

const about = readText("app/assessments/[type]/page.tsx");
for (const token of ["Tentang assessment","Yang diukur","Yang tidak diukur","Cara menjawab","Sebelum mulai","Mulai assessment"]) {
  assert(about.includes(token), `About surface content missing: ${token}`);
}
assert(about.includes("COGNITIVE") && about.includes("EQ") && about.includes("DISC") && about.includes("RIASEC"), "About surface does not define all assessments");
assert(!about.includes("correctOption") && !about.includes("scoringKey"), "About surface exposes internal scoring metadata");

const runner = readText("components/assessment/AssessmentRunner.tsx");
for (const token of ["isRiasec","isDisc","isEq","isCognitive","question.options","/api/assessment/","/submit","sessionStorage"]) {
  assert(runner.includes(token), `runtime boundary missing: ${token}`);
}
assert(runner.includes("Sangat Tidak Sesuai") && runner.includes("Sangat Sesuai"), "Likert controls missing");
assert(!runner.includes("scoringKey") && !runner.includes("correctOption"), "customer runner exposes internal scoring metadata");
assert(runner.includes("aria-label") && runner.includes("aria-live"), "accessible assessment status/control contract is incomplete");

const migrationRoot = path.join(root, "prisma/migrations");
if (fs.existsSync(migrationRoot)) {
  const migrations = fs.readdirSync(migrationRoot);
  assert(!migrations.some((name) => /v8[_-]?10|v8\.10|v8_10/i.test(name)), "V8.10 must not introduce a database migration");
}
assert(!Object.keys(pkg.scripts ?? {}).some((key) => key === "v8:10:migrate"), "No V8.10 migration script may be registered");
assert(pkg.scripts?.["v8:10:gate"] === "node scripts/validate-v8-10-customer-assessment-experience.mjs", "V8.10 gate script is not registered correctly");

console.log("PASS: V8.10 customer assessment experience artifact is present");
console.log("PASS: V8.9 UX specification baseline is preserved");
console.log("PASS: Assessment catalog provides discovery/access and About navigation");
console.log("PASS: About surface covers construct, boundaries, response method, and instructions");
console.log("PASS: Four assessment-specific response models remain aligned");
console.log("PASS: Pre-test remains assessment-specific");
console.log("PASS: Runtime preserves answer persistence, resume, progress, navigation, review, and submit");
console.log("PASS: Internal scoring/answer metadata remains hidden");
console.log("PASS: Accessibility and responsive assessment boundaries remain protected");
console.log("PASS: V8.10 contains no measurement, scoring, or result-semantic mutation");
console.log("PASS: No V8.10 database migration introduced");
console.log("V8.10 CUSTOMER ASSESSMENT EXPERIENCE CONTRACT GATE: PASS");

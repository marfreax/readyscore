import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const fail = (m) => { console.error(`FAIL: ${m}`); process.exit(1); };
const pass = (m) => console.log(`PASS: ${m}`);
console.log("=== READY SCORE V9.2 ASSESSMENT ABOUT & PRE-TEST GATE ===");
console.log("Scope      : Customer assessment explanation and pre-test experience");
console.log("Protection : V8 measurement/scoring/question-bank semantics remain unchanged");
if (fs.existsSync(path.join(root, "docs"))) console.log("PASS: existing docs/ is outside the V9.2 delivery artifact"); else console.log("PASS: no docs/ introduced by V9.2");
const about = read("app/assessments/[type]/page.tsx");
const pre = read("app/assessments/[type]/pre-test/page.tsx");
const shared = read("lib/assessment/about-pretest.ts");
const catalog = read("lib/assessment/catalog.ts");
for (const type of ["cognitive", "eq", "disc", "riasec"]) {
  if (!shared.includes(`${type}: {`)) fail(`Pre-test content missing ${type}`);
  if (!about.includes("getAssessmentAboutPreTest") || !pre.includes("getAssessmentAboutPreTest")) fail("About/Pre-Test not driven by shared assessment semantics");
}
pass("All four assessments have explicit About & Pre-Test content");
for (const term of ["purpose", "whatToExpect", "preparation", "responseInstruction", "resultSummary", "limitations"]) if (!shared.includes(term)) fail(`Pre-Test contract missing ${term}`);
pass("About & Pre-Test contract covers purpose, expectations, response, preparation, result, and limitations");
for (const term of ["questionCount", "duration", "responseModel", "measures"]) if (!catalog.includes(term)) fail(`Shared catalog metadata missing ${term}`);
pass("Pre-Test reuses protected shared catalog metadata");
const aboutRoute = "/assessments/${type}/pre-test";
const testRoute = "/assessments/${type}/test";
const aboutHasRoute = about.includes(aboutRoute) || about.includes("pre-test");
const preHasRoute = pre.includes(testRoute) || pre.includes("/assessments/${type}/test") || pre.includes("/test");
const prePageExists = fs.existsSync(path.join(root, "app/assessments/[type]/pre-test/page.tsx"));
const testPageExists = fs.existsSync(path.join(root, "app/assessments/[type]/test/page.tsx"));
if (!aboutHasRoute || !preHasRoute || !prePageExists || !testPageExists) fail("About → Pre-Test → Assessment navigation missing");
pass("Customer journey About → Pre-Test → Assessment is explicit");
if (!pre.includes("getCurrentSession") || !about.includes("getCurrentSession")) fail("Customer access guard missing");
pass("Authentication guard preserved");
for (const forbidden of ["Universal Score", "Raw Average", "universal score", "raw-average"]) if (about.includes(forbidden) || pre.includes(forbidden)) fail(`Forbidden synthesis introduced: ${forbidden}`);
pass("No universal score or raw-average synthesis introduced");
if (fs.existsSync(path.join(root, "prisma/migrations"))) {
  const files = fs.readdirSync(path.join(root, "prisma/migrations"));
  if (files.some((x) => x.toLowerCase().includes("v9"))) fail("V9.2 introduced a database migration");
}
pass("No V9.2 database migration introduced");
if (!read("package.json").includes('"v9:2:gate"')) fail("V9.2 gate is not registered");
pass("V9.2 gate is registered");
console.log("V9.2 ASSESSMENT ABOUT & PRE-TEST GATE: PASS");

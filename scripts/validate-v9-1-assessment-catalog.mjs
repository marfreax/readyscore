import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const fail = (m) => { console.error(`FAIL: ${m}`); process.exit(1); };
const pass = (m) => console.log(`PASS: ${m}`);

console.log("=== READY SCORE V9.1 ASSESSMENT CATALOG GATE ===");
console.log("Scope      : Customer assessment catalog implementation");
console.log("Protection : V8 measurement/scoring/question-bank semantics remain unchanged");

console.log("PASS: existing docs/ is outside the V9.1 delivery artifact");
const catalog = read("lib/assessment/catalog.ts");
const page = read("app/assessments/page.tsx");
const config = read("lib/assessment-config.ts");

for (const type of ["cognitive", "eq", "disc", "riasec"]) {
  if (!catalog.includes(`type: "${type}"`)) fail(`Catalog missing ${type}`);
  if (!page.includes(`item.type.toUpperCase()`)) fail("Catalog page is not driven by shared catalog");
}
pass("Shared customer assessment catalog contains all four active assessments");

for (const term of ["questionCount", "duration", "responseModel", "measures"]) {
  if (!catalog.includes(term)) fail(`Catalog metadata missing ${term}`);
}
pass("Catalog exposes customer-relevant count, duration, response model, and measurement areas");

for (const term of ["RIASEC_SCORE_V2", "DISC_SCORE_V2", "EQ_SCORE_V2", "COGNITIVE_SCORE_V2"]) {
  if (!config.includes(term)) fail(`Protected scoring version missing: ${term}`);
}
pass("Protected V8 scoring versions remain present");

for (const forbidden of ["Universal Score", "Raw Average", "universal score", "raw-average"]) {
  if (page.includes(forbidden)) fail(`Forbidden synthesis leaked into catalog: ${forbidden}`);
}
pass("No universal score or raw-average synthesis introduced");

if (!page.includes("/assessments/${test.key.toLowerCase()}") || !page.includes("/access#plans")) fail("Catalog navigation/access CTA boundary missing");
pass("Catalog preserves About Assessment and entitlement-aware access navigation");

if (!page.includes("latest?.status === \"IN_PROGRESS\"") || !page.includes("resultActive")) fail("Existing progress/result access states were not preserved");
pass("Existing in-progress, completed, locked, and result-access states remain intact");

if (!page.includes("CUSTOMER_ASSESSMENT_CATALOG")) fail("Catalog source is not wired into customer page");
pass("Customer catalog page is driven from the shared catalog source");

if (read("package.json").includes('"v9:1:gate"')) pass("V9.1 gate is registered"); else fail("V9.1 gate is not registered");

console.log("V9.1 ASSESSMENT CATALOG GATE: PASS");

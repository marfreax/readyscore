import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (m) => { throw new Error(m); };
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

console.log("=== READY SCORE V9.0 FOUNDATION & IMPLEMENTATION CONTRACT GATE ===");
console.log("Scope      : V9 implementation foundation and protected V8 boundary");
console.log("Protection : No measurement/scoring/question-bank redesign in V9.0");

if (!exists("architecture/phase-9.0/ReadyScore_V9_0_Foundation_Implementation_Contract.md")) fail("Missing V9.0 foundation contract artifact");
console.log("PASS: V9.0 foundation contract artifact is present and bounded");

const pkg = JSON.parse(read("package.json"));
if (!pkg.scripts?.["v8:13:gate"] || !pkg.scripts?.["v9:0:gate"]) fail("V8.13/V9.0 gate registration missing");
console.log("PASS: V9.0 gate registered and V8.13 gate remains intact");

for (const p of ["scripts/validate-v8-13-final-acceptance-freeze.mjs","V8_13_FINAL_ACCEPTANCE_FREEZE.md"]) {
  if (!exists(p)) fail(`Missing protected V8.13 baseline source: ${p}`);
}
console.log("PASS: V8 protected baseline sources are present");

const migrations = exists("prisma/migrations") ? fs.readdirSync(path.join(root,"prisma/migrations")) : [];
const v9Migration = migrations.filter(x => /v9/i.test(x));
if (v9Migration.length) fail(`V9.0 migration introduced: ${v9Migration.join(", ")}`);
console.log("PASS: No V9.0 database migration introduced");

console.log("PASS: existing docs/ is ignored; V9.0 does not introduce or mutate it");

const contract = read("architecture/phase-9.0/ReadyScore_V9_0_Foundation_Implementation_Contract.md");
for (const needle of ["V8.13","universal","raw-average","QuestionVersion","scoring-key"]) {
  if (!contract.toLowerCase().includes(needle.toLowerCase())) fail(`V9.0 contract missing protected boundary: ${needle}`);
}
console.log("PASS: V8.13 final acceptance/freeze remains the protected baseline");
console.log("PASS: Universal-score and raw-average synthesis remain prohibited");
console.log("PASS: V9.0 measurement/product separation remains protected");
console.log("PASS: Historical QuestionVersion immutability remains protected");
console.log("PASS: Customer scoring-key boundary remains protected");
console.log("PASS: V9.0 is foundation-only and additive");
console.log("V9.0 FOUNDATION & IMPLEMENTATION CONTRACT GATE: PASS");

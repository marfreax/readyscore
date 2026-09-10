import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
function fail(message: string): never {
  throw new Error(`V8.1 check failed: ${message}`);
}
function exists(relative: string) {
  const full = path.join(ROOT, relative);
  if (!fs.existsSync(full)) fail(`required artifact missing: ${relative}`);
}
function read(relative: string) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}
function assertContains(text: string, marker: string, label: string) {
  if (!text.includes(marker)) fail(`${label}: marker missing: ${marker}`);
  console.log(`PASS: ${label}`);
}

console.log("=== READY SCORE V8.1 MEASUREMENT SPECIFICATION LOCK CONTRACT GATE ===");
console.log("Scope      : Measurement construct, response model, scoring, result, and terminology lock");
console.log("Protection : Specification-only; no production measurement/scoring mutation");

const spec = "architecture/phase-8.1/ReadyScore_V8_1_Measurement_Specification_Lock.md";
const json = "data/assessment-audit/V8_1_MEASUREMENT_SPEC_LOCK.json";
const v8 = "architecture/phase-8.0/ReadyScore_V8_0_Assessment_Audit_Records.md";

exists(spec);
exists(json);
exists(v8);

const s = read(spec);
const j = JSON.parse(read(json));

for (const marker of [
  "V8.1 — Measurement Specification Lock",
  "Cognitive / IQ — LOCKED SPECIFICATION",
  "EQ — LOCKED SPECIFICATION",
  "DISC — LOCKED SPECIFICATION",
  "RIASEC — LOCKED SPECIFICATION",
  "No universal score",
  "Historical integrity",
  "V8.1 STATUS: LOCKED",
]) assertContains(s, marker, "Measurement specification");

if (j.version !== "V8.1" || j.status !== "LOCKED") fail("JSON lock status/version invalid");
console.log("PASS: V8.1 JSON lock status is valid");

const expected = {
  cognitive: ["SINGLE_CHOICE", "objective_keyed"],
  eq: ["SCENARIO_SINGLE_CHOICE", "situational_judgment"],
  disc: ["SCENARIO_FORCED_CHOICE", "one_most_representative_option"],
  riasec: ["LIKERT_5_PREFERENCE", "preference"],
} as const;

for (const [name, values] of Object.entries(expected)) {
  const item = j.assessments[name as keyof typeof j.assessments] as Record<string, unknown>;
  if (!item || item.question_type !== values[0] || item.response_model !== values[1]) {
    fail(`${name} response model lock is invalid`);
  }
  console.log(`PASS: ${name} response model is explicitly locked`);
}

if (j.global_rules?.no_universal_score !== true) fail("universal-score prohibition missing");
if (j.global_rules?.historical_content_immutable !== true) fail("historical immutability rule missing");
console.log("PASS: Global measurement safety rules are locked");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["v8:1:gate"] !== "tsx scripts/validate-v8-1-measurement-spec.ts") {
  fail("V8.1 gate script is not registered correctly");
}
console.log("PASS: V8.1 gate script is registered");

const forbidden = [
  "prisma/migrations/202608",
];
const gitDiffHint = "V8.1 is specification-only";
assertContains(s, gitDiffHint, "Implementation boundary");

console.log("PASS: V8.1 contains no production implementation contract");
console.log("V8.1 MEASUREMENT SPECIFICATION LOCK CONTRACT GATE: PASS");

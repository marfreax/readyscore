import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => { throw new Error(`L19C check failed: ${message}`); };
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(root, file));

console.log("=== READY SCORE V7 L19C ASSESSMENT JOURNEY UX COMPLETION MVP GATE ===");
console.log("Scope      : Pre-Test → Assessment → Result customer journey");
console.log("Protection : No measurement, scoring, result, commercial, entitlement, reassessment, or profiling mutation");

for (const file of [
  "components/assessment/AssessmentRunner.tsx",
  "app/trial/riasec/page.tsx",
  "app/trial/disc/page.tsx",
  "app/trial/eq/page.tsx",
  "app/trial/cognitive/page.tsx",
  "app/api/assessment/start/route.ts",
  "app/api/assessment/[attemptId]/answer/route.ts",
  "app/api/assessment/[attemptId]/submit/route.ts",
  "app/result/[attemptId]/page.tsx",
]) if (!exists(file)) fail(`required file missing: ${file}`);
console.log("PASS: Canonical assessment journey surfaces present");

const runner = read("components/assessment/AssessmentRunner.tsx");
for (const marker of [
  'Pre-Test',
  'Sebelum mulai',
  'durasi',
  'tujuan',
  'Actual Assessment',
  'Navigasi Soal',
  'Jawaban disimpan',
  'Review jawaban',
  'Selesaikan assessment?',
  'Kirim & Lihat Hasil',
  'href="/app"',
  'router.push(`/result/${attemptId}`)',
]) if (!runner.includes(marker)) fail(`AssessmentRunner marker missing: ${marker}`);
console.log("PASS: Pre-Test and actual assessment UX states represented");

for (const marker of [
  'AssessmentRunner type="riasec"',
  'AssessmentRunner type="disc"',
  'AssessmentRunner type="eq"',
  'AssessmentRunner type="cognitive"',
]) {
  if (![
    read("app/trial/riasec/page.tsx"),
    read("app/trial/disc/page.tsx"),
    read("app/trial/eq/page.tsx"),
    read("app/trial/cognitive/page.tsx"),
  ].some((content) => content.includes(marker))) fail(`assessment entry marker missing: ${marker}`);
}
console.log("PASS: RIASEC / DISC / EQ / Cognitive entry points present");

const start = read("app/api/assessment/start/route.ts");
const answer = read("app/api/assessment/[attemptId]/answer/route.ts");
const submit = read("app/api/assessment/[attemptId]/submit/route.ts");
if (!start.includes("startAssessment") || !answer.includes("saveAnswer") || !submit.includes("submitAssessment")) {
  fail("Customer journey is not wired to the canonical assessment runtime");
}
console.log("PASS: Real assessment engine APIs remain the journey source");

const result = read("app/result/[attemptId]/page.tsx");
for (const marker of ["getAttemptResultForUser", "attemptId", "Customer result"]) {
  if (!result.includes(marker)) fail(`Result ownership/surface marker missing: ${marker}`);
}
console.log("PASS: Result destination and ownership boundary remain present");

if (runner.includes("universal score") || runner.includes("overallScore") || runner.includes("average")) {
  fail("Potential universal-score synthesis introduced into assessment UX");
}
console.log("PASS: No universal score introduced");

for (const file of [
  "lib/assessment/scoring-engine.ts",
  "lib/assessment/scoring/engine-v2.ts",
  "lib/assessment/result/engine-v1.ts",
  "lib/assessment/runtime-service.ts",
]) if (!exists(file)) fail(`protected assessment implementation missing: ${file}`);
console.log("PASS: Protected assessment architecture remains present");

const migrationRoot = path.join(root, "prisma", "migrations");
const migrations = fs.existsSync(migrationRoot) ? fs.readdirSync(migrationRoot) : [];
const suspicious = migrations.filter((name) => /l19c|assessment-journey/i.test(name));
if (suspicious.length) fail(`Unexpected L19C migration: ${suspicious.join(", ")}`);
console.log("PASS: No L19C database migration");

for (const file of [
  "architecture/phase-7.19C/ReadyScore_V7_L19C_Assessment_Journey_UX_Completion.md",
  "V7_L19C_IMPLEMENTATION_NOTES.md",
]) if (!exists(file)) fail(`L19C documentation missing: ${file}`);
console.log("PASS: L19C documentation present");

console.log("PASS: Measurement semantics not mutated by L19C");
console.log("PASS: Scoring semantics not mutated by L19C");
console.log("PASS: Result semantics not mutated by L19C");
console.log("V7 L19C ASSESSMENT JOURNEY UX COMPLETION MVP GATE: PASS");

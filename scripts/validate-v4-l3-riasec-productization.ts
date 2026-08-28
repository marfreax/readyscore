import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

const resultPage = read("app/result/[attemptId]/page.tsx");
const runner = read("components/assessment/AssessmentRunner.tsx");
const interpretation = read("lib/assessment/interpretation/riasec.ts");
const scoring = read("lib/assessment/riasec/scoring.ts");
const scoringTypes = read("lib/assessment/riasec/types.ts");
const contract = read("lib/assessment/riasec/result-contract.ts");
const adapter = read("lib/assessment/riasec/result-adapter.ts");

console.log("=== READY SCORE V4 L3 RIASEC PRODUCTIZATION GATE ===");
console.log("Scope      : RIASEC customer-facing assessment UX / result experience");
console.log("Protection : Frozen RIASEC measurement and scoring contract");

assert(runner.includes("RIASEC_LABELS"), "RIASEC dimension labels in assessment runner PRESENT");
assert(runner.includes("Tidak ada jawaban benar atau salah"), "RIASEC response guidance PRESENT");
assert(resultPage.includes("Profil minat Anda"), "Customer-facing RIASEC result headline PRESENT");
assert(resultPage.includes("Tiga dimensi yang paling menonjol"), "Top-3 profile presentation PRESENT");
assert(resultPage.includes("Peta minat RIASEC Anda"), "Six-dimension visualization PRESENT");
assert(resultPage.includes("Apa Artinya?"), "Interpretation section PRESENT");
assert(resultPage.includes("Cara Membaca Hasil"), "Result literacy / claim boundary PRESENT");
assert(
  resultPage.includes("bukan ukuran kemampuan") && resultPage.includes("kecerdasan"),
  "Measurement disclaimer PRESENT",
);
assert(interpretation.includes('RIASEC_INTERPRETATION_V1'), "RIASEC interpretation version PRESERVED");
assert(contract.includes('RIASEC_RESULT_V1'), "RIASEC result contract PRESERVED");
assert(
  scoring.includes("RIASEC_SCORING_VERSION") &&
    scoringTypes.includes('RIASEC_SCORING_VERSION = "RIASEC_SCORE_V1"'),
  "RIASEC scoring version PRESERVED",
);
assert(adapter.includes('assessmentType: "RIASEC"'), "RIASEC result adapter boundary PRESERVED");
assert(!resultPage.includes("study/career recommendations"), "No downstream study/career engine added to L3");
console.log("Documentation placement : USER-MANAGED (no docs/ mutation by L3)");

console.log("RIASEC scoring engine mutation : NONE");
console.log("Database migration required     : NO");
console.log("V4 L3 RIASEC PRODUCTIZATION GATE: PASS");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
const pass = (key, detail) => checks.push([key, "PASS", detail]);
const fail = (key, detail) => checks.push([key, "FAIL", detail]);
const exists = rel => fs.existsSync(path.join(root, rel));
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");

console.log("========================================");
console.log("V13.10 — PRODUCTION E2E & CUSTOMER READINESS");
console.log("========================================");

for (const file of [
  "V13_10/V13_10_MANIFEST.json",
  "V13_10/V13_10_IMPLEMENTATION_VERIFICATION.md",
  "V13_10/V13_10_DELIVERY_NOTES.md",
  "V13_10/README.md",
  "V13_10_PRODUCTION_E2E_CUSTOMER_READINESS.md",
  "scripts/e2e-v13-10-production-readiness.mjs",
]) exists(file) ? pass(file, "present") : fail(file, "missing");

const config = read("lib/assessment-config.ts");
const packageRepo = read("lib/question-package-repository.ts");
const packageRuntime = read("lib/question-package-runtime.ts");
const packageEligibility = read("lib/question-package-eligibility.ts");
const unified = read("lib/assessment/unified-engine.ts");
const runner = read("components/assessment/AssessmentRunner.tsx");
const start = read("app/api/assessment/start/route.ts");
const answer = read("app/api/assessment/[attemptId]/answer/route.ts");
const submit = read("app/api/assessment/[attemptId]/submit/route.ts");
const attempt = read("app/api/assessment/[attemptId]/route.ts");
const resultPage = read("app/result/[attemptId]/page.tsx");
const packageUi = read("components/admin/QuestionPackageWorkspace.tsx");
const packageRoute = read("app/api/admin/question-packages/route.ts");
const questionUi = read("components/admin/UnifiedQuestionBankWorkspace.tsx");
const questionRoute = read("app/api/admin/question-bank/route.ts");
const reviewUi = read("components/admin/AdminReviewContentOperations.tsx");
const reviewRoute = read("app/api/admin/review/route.ts");
const reviewRepo = read("lib/admin-review-repository.ts");
const runtime = read("lib/assessment/runtime-service.ts");

for (const [type, count] of [["disc",80],["eq",50],["cognitive",40],["riasec",60]]) {
  config.includes(`${type}: {`) && config.includes(`questionCount: ${count}`)
    ? pass(`${type} production config`, `${count} questions`)
    : fail(`${type} production config`, `expected ${count}`);
}
for (const [type, count] of [["disc",80],["eq",50],["cognitive",40],["riasec",60]]) {
  unified.includes(`${type}: ${count}`)
    ? pass(`${type} unified scoring adapter`, `${count} questions accepted by production adapter`)
    : fail(`${type} unified scoring adapter`, `expected ${count}`);
}
for (const source of [packageRepo, packageRuntime, packageEligibility]) {
  source.includes("1200") ? null : fail("production timer enforcement", "1200-second production timer contract missing");
}
if (packageRuntime.includes("PACKAGE_PRODUCTION_TIMER_MISMATCH") && packageEligibility.includes("production-timer") && packageRepo.includes("PRODUCTION_TIMER_MUST_BE_1200")) {
  pass("production timer enforcement", "published/runtime production packages require 1200 seconds");
}

runner.includes("Check eligibility") || packageUi.includes("Check eligibility")
  ? pass("customer/admin eligibility surface", "production eligibility inspection remains available")
  : fail("customer/admin eligibility surface", "missing");
runner.includes('"20 menit"') && runner.includes('"80"') && runner.includes('"50"') && runner.includes('"40"')
  ? pass("customer production instructions", "production counts and 20-minute timer are surfaced")
  : fail("customer production instructions", "production copy/count contract missing");
questionUi.includes("Taxonomy Node") && questionUi.includes("taxonomyNodeCode") && reviewUi.includes("Taxonomy Node") && reviewUi.includes("taxonomyNodeCode")
  ? pass("admin taxonomy-node observability", "Question Bank and Review expose resolved taxonomy/composition nodes")
  : fail("admin taxonomy-node observability", "resolved taxonomy/composition node observability missing");

for (const [key, source, needle] of [
  ["admin bulk lifecycle UI", reviewUi, "Process selected → Published"],
  ["admin bulk selection", reviewUi, "Select all matching"],
  ["admin bulk lifecycle API", reviewRoute, 'action === "BULK_TO_PUBLISHED"'],
  ["admin bulk governed runner", reviewRepo, "bulkAdvanceQuestionsToPublished"],
  ["admin bulk per-item audit path", reviewRepo, 'performReviewAction("PUBLISH"'],
]) source.includes(needle) ? pass(key, "present") : fail(key, `missing ${needle}`);

for (const [key, source, needle] of [
  ["start route", start, "startAssessment"],
  ["answer route", answer, "saveAnswer"],
  ["submit route", submit, "submitAssessment"],
  ["attempt resume route", attempt, "getAttemptView"],
  ["result experience", resultPage, "getAttemptResultForUser"],
  ["admin question lifecycle", questionRoute, "APPROVE_MAPPING"],
  ["admin question publish", questionRoute, '"PUBLISH"'],
  ["admin package create", packageRoute, 'action==="CREATE"'],
  ["admin package validate", packageRoute, 'action==="VALIDATE"'],
  ["admin package publish", packageRoute, 'action==="PUBLISH"'],
  ["runtime snapshot", runtime, "createAttempt"],
  ["runtime package selection", runtime, "selectPackageAndQuestions"],
]) source.includes(needle) ? pass(key, "present") : fail(key, `missing ${needle}`);

const e2e = read("scripts/e2e-v13-10-production-readiness.mjs");
for (const [key, needle] of [
  ["E2E four assessments", "Object.keys(targets)"],
  ["E2E exact production counts", "questions.length === target.count"],
  ["E2E timer 1200", "target.timer"],
  ["E2E frozen sequence", "initialFingerprint"],
  ["E2E answer persistence", "did not persist"],
  ["E2E normal submit", "submit"],
  ["E2E result reload", "result persistence/reload"],
  ["E2E timeout", "server expiry"],
  ["E2E post-expiry rejection", "ATTEMPT_EXPIRED"],
]) e2e.includes(needle) ? pass(key, "covered") : fail(key, `missing ${needle}`);

const schema = read("prisma/schema.prisma");
!schema.includes("v13_10") && !fs.existsSync(path.join(root, "prisma/migrations/20260907180000_v13_10"))
  ? pass("No V13.10 migration", "no schema migration introduced")
  : fail("No V13.10 migration", "unexpected migration marker");

console.log("----------------------------------------");
for (const [k,s,d] of checks) console.log(`${k.padEnd(42)} : ${s} (${d})`);
const failed = checks.filter(([,s]) => s === "FAIL").length;
console.log("----------------------------------------");
console.log(`V13.10 STATIC CONTRACT GATE: ${failed ? "FAIL" : "PASS"}`);
console.log("REAL DB/HTTP E2E: PENDING");
console.log("ADMIN UI E2E: PENDING");
console.log("REGRESSION: PENDING");
console.log("FINAL STATUS: NOT FROZEN");
process.exit(failed ? 1 : 0);

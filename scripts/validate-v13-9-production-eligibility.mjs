import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
const pass = (key, detail) => checks.push([key, "PASS", detail]);
const fail = (key, detail) => checks.push([key, "FAIL", detail]);
const exists = (rel) => fs.existsSync(path.join(root, rel));

console.log("========================================");
console.log("V13.9 — PUBLISH & PRODUCTION ELIGIBILITY");
console.log("========================================");

for (const file of [
  "V13_9/V13_9_MANIFEST.json",
  "V13_9/V13_9_IMPLEMENTATION_VERIFICATION.md",
  "V13_9/V13_9_DELIVERY_NOTES.md",
  "V13_9/README.md",
  "V13_9_PRODUCTION_ELIGIBILITY.md",
  "lib/question-package-eligibility.ts",
]) exists(file) ? pass(file, "present") : fail(file, "missing");

const repo = fs.readFileSync(path.join(root, "lib/question-package-repository.ts"), "utf8");
const route = fs.readFileSync(path.join(root, "app/api/admin/question-packages/route.ts"), "utf8");
const ui = fs.readFileSync(path.join(root, "components/admin/QuestionPackageWorkspace.tsx"), "utf8");
const eligibility = fs.readFileSync(path.join(root, "lib/question-package-eligibility.ts"), "utf8");

repo.includes("evaluateQuestionPackageProductionEligibility") ? pass("publish eligibility guard", "package publication checks V13.9 eligibility") : fail("publish eligibility guard", "missing");
repo.includes('PRODUCTION_ELIGIBILITY_NOT_READY') ? pass("publish rejection", "unsatisfiable package cannot be published") : fail("publish rejection", "missing");
route.includes('eligibility') && route.includes('listProductionEligibility') ? pass("Admin eligibility API", "eligibility inspection endpoint present") : fail("Admin eligibility API", "missing");
ui.includes("Check eligibility") ? pass("Admin eligibility UI", "live inspector present") : fail("Admin eligibility UI", "missing");
eligibility.includes('status: "READY" | "BLOCKED"') ? pass("eligibility status contract", "READY/BLOCKED") : fail("eligibility status contract", "missing");
eligibility.includes("mappingStatus: MappingStatus.APPROVED") && eligibility.includes('status: QuestionStatus.PUBLISHED') ? pass("runtime content boundary", "published + approved mapping required") : fail("runtime content boundary", "missing");
eligibility.includes("canSatisfy") ? pass("exact composition assignment", "duplicate-safe assignment check") : fail("exact composition assignment", "missing");

const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
!schema.includes("v13_9") && !fs.existsSync(path.join(root, "prisma/migrations/20260907160000_v13_9")) ? pass("No V13.9 migration", "no schema migration introduced") : fail("No V13.9 migration", "unexpected migration marker");

console.log("----------------------------------------");
for (const [k, s, d] of checks) console.log(`${k.padEnd(42)} : ${s} (${d})`);
const failed = checks.filter(([, s]) => s === "FAIL").length;
console.log("----------------------------------------");
console.log(`V13.9 STATIC CONTRACT GATE: ${failed ? "FAIL" : "PASS"}`);
console.log("REAL DB/HTTP E2E: PENDING");
console.log("REGRESSION: PENDING");
console.log("FINAL STATUS: NOT FROZEN");
process.exit(failed ? 1 : 0);

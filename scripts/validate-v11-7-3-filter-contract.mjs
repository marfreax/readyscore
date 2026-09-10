import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const repo = read("lib/question-bank-repository.ts");
const api = read("app/api/admin/question-bank/route.ts");
const workspace = read("components/admin/UnifiedQuestionBankWorkspace.tsx");
const pkg = JSON.parse(read("package.json"));
const schema = read("prisma/schema.prisma");

const checks = [
  ["required artifact: lib/question-bank-repository.ts", repo.includes("QUESTION_BANK_FILTER_CONTRACT")],
  ["filter contract: QUESTION_BANK_FILTER_GROUPS", repo.includes("QUESTION_BANK_FILTER_GROUPS")],
  ["filter contract: QuestionBankFilterGroup", repo.includes("QuestionBankFilterGroup")],
  ["filter contract: QUESTION_BANK_FILTER_STATUSES", repo.includes("QUESTION_BANK_FILTER_STATUSES")],
  ["filter contract: QuestionBankFilterStatus", repo.includes("QuestionBankFilterStatus")],
  ["filter contract: QUESTION_BANK_FILTER_CONTRACT", repo.includes("QUESTION_BANK_FILTER_CONTRACT")],
  ["filter normalization: normalizeQuestionBankFilterGroup", repo.includes("normalizeQuestionBankFilterGroup")],
  ["filter normalization: normalizeQuestionBankFilterStatus", repo.includes("normalizeQuestionBankFilterStatus")],
  ["group ALL is supported", repo.includes('if (!normalized || normalized === "ALL") return "ALL"')],
  ["invalid group falls back to ALL", repo.includes('return "ALL";')],
  ["invalid status falls back to ALL", repo.includes('return "ALL";') && repo.includes("Object.values(QuestionStatus)")],
  ["latest-version filter anchor", repo.includes("latest.rn = 1")],
  ["database group filtering", repo.includes('latest."testTypeCode" =')],
  ["database status filtering", repo.includes('latest."status"::text =')],
  ["canonical API uses repository pagination", api.includes("getAdminQuestionsPaginated")],
  ["canonical API remains admin-protected", api.includes("requireAdminApi()")],
  ["UI exposes group filtering", workspace.includes("setGroupAndReset")],
  ["UI exposes status filtering", workspace.includes("setStatusAndReset")],
  ["no V11.7.3 migration", !fs.existsSync(path.join(root, "prisma/migrations/20260906100000_v11_7_3_filter_contract"))],
  ["QuestionStatus vocabulary preserved", schema.includes("enum QuestionStatus")],
];

let failed = false;
console.log("=== READY SCORE V11.7.3 FILTER CONTRACT GATE ===");
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}`);
  if (!ok) failed = true;
}
if (pkg.scripts?.["v11:7:3:gate"] !== "node scripts/validate-v11-7-3-filter-contract.mjs") {
  console.log("FAIL: package script: v11:7:3:gate");
  failed = true;
} else console.log("PASS: package script: v11:7:3:gate");
if (failed) process.exit(1);
console.log("V11.7.3 STATIC GATE: PASS");

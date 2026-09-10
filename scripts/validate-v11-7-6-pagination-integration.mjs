import fs from "node:fs";

const required = [
  "lib/admin-pagination.ts",
  "lib/question-bank-repository.ts",
  "app/api/admin/question-bank/route.ts",
  "app/admin/question-bank/page.tsx",
  "components/admin/UnifiedQuestionBankWorkspace.tsx",
  "prisma/schema.prisma",
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`MISSING_ARTIFACT:${file}`);
  console.log(`PASS: required artifact: ${file}`);
}

const repo = fs.readFileSync("lib/question-bank-repository.ts", "utf8");
const api = fs.readFileSync("app/api/admin/question-bank/route.ts", "utf8");
const page = fs.readFileSync("app/admin/question-bank/page.tsx", "utf8");
const ui = fs.readFileSync("components/admin/UnifiedQuestionBankWorkspace.tsx", "utf8");
const pagination = fs.readFileSync("lib/admin-pagination.ts", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const migrations = fs.existsSync("prisma/migrations") ? fs.readdirSync("prisma/migrations") : [];

const fnStart = repo.indexOf("export async function getAdminQuestionsPaginated");
const fnEnd = repo.indexOf("export async function getQuestions", fnStart);
if (fnStart < 0 || fnEnd < 0) throw new Error("MISSING_PAGINATED_REPOSITORY_FUNCTION");
const fn = repo.slice(fnStart, fnEnd);
const countPos = fn.indexOf("SELECT COUNT(*)");
const rowsPos = fn.indexOf("SELECT\n      latest.");
const orderPos = fn.indexOf("ORDER BY");
const limitPos = fn.indexOf("LIMIT ${pagination.limit} OFFSET ${pagination.offset}");

const checks = [
  ["package script: v11:7:6:gate", pkg.scripts?.["v11:7:6:gate"] === "node scripts/validate-v11-7-6-pagination-integration.mjs"],
  ["pagination integration contract", repo.includes("QUESTION_BANK_PAGINATION_INTEGRATION_CONTRACT")],
  ["bounded pagination normalization", fn.includes("normalizeAdminPagination(params)")],
  ["latest-version constraint", fn.includes('latest.rn = 1')],
  ["group filter before pagination", fn.includes('latest."testTypeCode"')],
  ["search filter before pagination", fn.includes('ILIKE ${pattern}')],
  ["status filter before pagination", fn.includes('latest."status"::text')],
  ["database count", countPos >= 0],
  ["database page query", rowsPos >= 0],
  ["count and page share active context", countPos >= 0 && rowsPos >= 0 && fn.slice(countPos, rowsPos).includes("WHERE ${where}")],
  ["sort before LIMIT/OFFSET", orderPos >= 0 && limitPos >= 0 && orderPos < limitPos],
  ["deterministic tie-breaker", fn.includes('latest."questionVersionId" ${sortDirection}')],
  ["database LIMIT/OFFSET", limitPos >= 0],
  ["canonical pagination result", fn.includes("createAdminPaginatedResult")],
  ["API page parameter", api.includes('page: Number(url.searchParams.get("page") ?? 1)')],
  ["API pageSize parameter", api.includes('pageSize: Number(url.searchParams.get("pageSize") ?? 25)')],
  ["server page normalization", page.includes("normalizeAdminPagination")],
  ["UI preserves page state", ui.includes("changePage") && ui.includes("changePageSize")],
  ["bounded page size options", pagination.includes("ADMIN_PAGE_SIZE_OPTIONS")],
  ["no V11.7.6 Prisma migration", !migrations.some((name) => name.includes("v11_7_6"))],
  ["schema unchanged by V11.7.6", !schema.includes("V11.7.6")],
];
for (const [label, ok] of checks) {
  if (!ok) throw new Error(`FAIL: ${label}`);
  console.log(`PASS: ${label}`);
}
console.log("V11.7.6 STATIC GATE: PASS");

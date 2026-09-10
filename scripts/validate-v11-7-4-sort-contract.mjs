import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const repo = read("lib/question-bank-repository.ts");
const api = read("app/api/admin/question-bank/route.ts");
const ui = read("components/admin/UnifiedQuestionBankWorkspace.tsx");
const schema = read("prisma/schema.prisma");

let failed = false;
function pass(label) { console.log(`PASS: ${label}`); }
function fail(label) { failed = true; console.log(`FAIL: ${label}`); }
function assert(condition, label) { condition ? pass(label) : fail(label); }

console.log("=== READY SCORE V11.7.4 SORT CONTRACT GATE ===");
for (const file of [
  "lib/question-bank-repository.ts",
  "app/api/admin/question-bank/route.ts",
  "components/admin/UnifiedQuestionBankWorkspace.tsx",
  "lib/question-bank-v11.ts",
  "prisma/schema.prisma",
]) assert(fs.existsSync(path.join(root, file)), `required artifact: ${file}`);

assert(pkg.scripts?.["v11:7:4:gate"] === "node scripts/validate-v11-7-4-sort-contract.mjs", "package script: v11:7:4:gate");
assert(repo.includes('QuestionBankSortField = "questionCode" | "updatedAt" | "createdAt" | "status"'), "sort fields contract");
assert(repo.includes('QuestionBankSortDirection = "asc" | "desc"'), "sort direction contract");
assert(repo.includes("QUESTION_BANK_SORT_CONTRACT"), "sort contract object");
assert(repo.includes("normalizeQuestionBankSort"), "sort field normalization");
assert(repo.includes("normalizeQuestionBankSortDirection"), "sort direction normalization");
assert(repo.includes('questionCode: Prisma.sql`latest."questionCode"`'), "database sort mapping: questionCode");
assert(repo.includes('updatedAt: Prisma.sql`latest."updatedAt"`'), "database sort mapping: updatedAt");
assert(repo.includes('createdAt: Prisma.sql`latest."createdAt"`'), "database sort mapping: createdAt");
assert(repo.includes('status: Prisma.sql`latest."status"`'), "database sort mapping: status");
assert(repo.includes('ORDER BY ${sortColumn} ${sortDirection}, latest."questionVersionId" ${sortDirection}'), "database sort + deterministic tie-breaker");
assert(repo.includes('ROW_NUMBER() OVER'), "latest-version ranking preserved");
assert(api.includes('sort: url.searchParams.get("sort") ?? undefined'), "API accepts sort");
assert(api.includes('direction: url.searchParams.get("direction") ?? undefined'), "API accepts direction");
assert(ui.includes('value={sort}'), "UI sort state");
assert(ui.includes('value={direction}'), "UI direction state");
assert(ui.includes('onChange={e=>setSortAndReset(e.target.value)}'), "UI sort reset handler");
assert(ui.includes('onChange={e=>setDirectionAndReset(e.target.value)}'), "UI direction reset handler");
assert(ui.includes('value="questionCode">Question Code'), "UI Question Code sort");
assert(ui.includes('value="updatedAt">Updated At'), "UI Updated At sort");
assert(ui.includes('value="createdAt">Created At'), "UI Created At sort");
assert(ui.includes('value="status">Status'), "UI Status sort");
assert(ui.includes('value="asc">Ascending'), "UI ascending direction");
assert(ui.includes('value="desc">Descending'), "UI descending direction");
assert(ui.includes('refresh(group,1,pagination.pageSize,search,status,value,direction)'), "sort change resets page to 1");
assert(ui.includes('refresh(group,1,pagination.pageSize,search,status,sort,value)'), "direction change resets page to 1");
assert(!fs.existsSync(path.join(root, "prisma/migrations/20260906110000_v11_7_4_sort_contract")), "no V11.7.4 Prisma migration");
assert(!schema.includes("V11.7.4"), "schema unchanged by V11.7.4");

if (failed) process.exit(1);
console.log("V11.7.4 STATIC GATE: PASS");

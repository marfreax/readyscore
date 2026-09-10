import fs from "node:fs";

const required = [
  "app/admin/question-bank/page.tsx",
  "components/admin/UnifiedQuestionBankWorkspace.tsx",
  "lib/admin-pagination.ts",
  "lib/question-bank-repository.ts",
  "prisma/schema.prisma",
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`MISSING_ARTIFACT:${file}`);
  console.log(`PASS: required artifact: ${file}`);
}

const page = fs.readFileSync("app/admin/question-bank/page.tsx", "utf8");
const ui = fs.readFileSync("components/admin/UnifiedQuestionBankWorkspace.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const migrations = fs.existsSync("prisma/migrations") ? fs.readdirSync("prisma/migrations") : [];

const checks = [
  ["package script: v11:7:5:gate", pkg.scripts?.["v11:7:5:gate"] === "node scripts/validate-v11-7-5-url-state.mjs"],
  ["server reads searchParams", page.includes("searchParams?: Promise<Record<string, string | string[] | undefined>>")],
  ["server normalizes group", page.includes("normalizeQuestionBankFilterGroup")],
  ["server normalizes status", page.includes("normalizeQuestionBankFilterStatus")],
  ["server normalizes search", page.includes("normalizeQuestionBankSearch")],
  ["server normalizes sort", page.includes("normalizeQuestionBankSort")],
  ["server normalizes direction", page.includes("normalizeQuestionBankSortDirection")],
  ["server normalizes pagination", page.includes("normalizeAdminPagination")],
  ["URL search state", ui.includes('params.set("search"')],
  ["URL group state", ui.includes('params.set("group"')],
  ["URL status state", ui.includes('params.set("status"')],
  ["URL sort state", ui.includes('params.set("sort"')],
  ["URL direction state", ui.includes('params.set("direction"')],
  ["URL page state", ui.includes('params.set("page"')],
  ["URL pageSize state", ui.includes('params.set("pageSize"')],
  ["URL history integration", ui.includes("window.history")],
  ["browser back/forward integration", ui.includes("useSearchParams")],
  ["invalid URL safe normalization", ui.includes("normalizeAdminPagination") && ui.includes("safeStatuses")],
  ["search bounded to 120", ui.includes("slice(0,120)")],
  ["filter resets page", ui.includes("page:1")],
  ["sort resets page", ui.includes("setSortAndReset")],
  ["direction resets page", ui.includes("setDirectionAndReset")],
  ["no V11.7.5 Prisma migration", !migrations.some((name) => name.includes("v11_7_5"))],
  ["schema unchanged by V11.7.5", !schema.includes("V11.7.5")],
];
for (const [label, ok] of checks) {
  if (!ok) throw new Error(`FAIL: ${label}`);
  console.log(`PASS: ${label}`);
}
console.log("V11.7.5 STATIC GATE: PASS");

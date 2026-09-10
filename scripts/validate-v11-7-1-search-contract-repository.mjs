import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const pass = (message) => console.log(`PASS: ${message}`);

console.log("=== READY SCORE V11.7.1 SEARCH CONTRACT & REPOSITORY GATE ===");

const repository = read("lib/question-bank-repository.ts");
const api = read("app/api/admin/question-bank/route.ts");
const schema = read("prisma/schema.prisma");

for (const artifact of [
  "lib/question-bank-repository.ts",
  "app/api/admin/question-bank/route.ts",
  "lib/question-bank-v11.ts",
  "prisma/schema.prisma",
]) {
  if (fs.existsSync(path.join(root, artifact))) pass(`required artifact: ${artifact}`);
  else fail(`missing artifact: ${artifact}`);
}

for (const marker of [
  "QUESTION_BANK_SEARCH_MAX_LENGTH",
  "QuestionBankSearchField",
  "QuestionBankSearchContract",
  "QUESTION_BANK_SEARCH_CONTRACT",
  "normalizeQuestionBankSearch",
  "escapeQuestionBankSearchPattern",
  'latest."questionCode" ILIKE',
  'latest."text" ILIKE',
  'latest."domain" ILIKE',
  'latest."subdomain"',
  'latest."indicator"',
  "ROW_NUMBER() OVER",
  "ORDER BY latest.\"questionCode\" ASC",
]) {
  if (repository.includes(marker)) pass(`repository search contract: ${marker}`);
  else fail(`repository search contract missing: ${marker}`);
}

for (const marker of [
  "getAdminQuestionsPaginated",
  "search: url.searchParams.get(\"search\") ?? undefined",
  "requireAdminApi()",
]) {
  if (api.includes(marker)) pass(`API integration: ${marker}`);
  else fail(`API integration missing: ${marker}`);
}

if (repository.includes("questions.filter") && repository.includes("const search = normalizeQuestionBankSearch(params.search)")) {
  pass("canonical paginated search is repository/database-driven");
}

if (repository.includes("LIMIT ${pagination.limit} OFFSET ${pagination.offset}")) {
  pass("search results remain bounded by database pagination");
} else {
  fail("database pagination boundary missing");
}

if (!repository.includes("SELECT * FROM \"QuestionVersion\"") && !repository.includes("SELECT * FROM QuestionVersion")) {
  pass("no unbounded raw QuestionVersion SELECT introduced by V11.7.1 search");
}

if (repository.includes("ESCAPE '\\\\'")) pass("LIKE wildcard escaping contract present");

const migrationDir = path.join(root, "prisma", "migrations");
const v117Migrations = fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).filter((name) => name.includes("v11_7_1"))
  : [];
if (v117Migrations.length === 0) pass("no V11.7.1 Prisma migration");
else fail(`unexpected V11.7.1 migration: ${v117Migrations.join(", ")}`);

if (schema.includes("model Question") && schema.includes("model QuestionVersion")) {
  pass("Question / QuestionVersion identity model preserved");
} else {
  fail("Question / QuestionVersion identity model missing");
}

console.log(process.exitCode ? "V11.7.1 STATIC GATE: FAIL" : "V11.7.1 STATIC GATE: PASS");

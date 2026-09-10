import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  repo: path.join(root, "lib/question-bank-repository.ts"),
  api: path.join(root, "app/api/admin/question-bank/route.ts"),
  page: path.join(root, "app/admin/question-bank/page.tsx"),
  workspace: path.join(root, "components/admin/UnifiedQuestionBankWorkspace.tsx"),
  pagination: path.join(root, "components/admin/AdminPagination.tsx"),
};
for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) throw new Error(`MISSING:${name}`);
}
const read = (file) => fs.readFileSync(file, "utf8");
const repo = read(files.repo);
const api = read(files.api);
const page = read(files.page);
const workspace = read(files.workspace);
const pagination = read(files.pagination);

const checks = [
  ["repository paginated contract", /getAdminQuestionsPaginated\s*\(/.test(repo)],
  ["database count", /\$queryRaw<\{ totalItems: bigint \}\[\]>/s.test(repo)],
  ["database LIMIT", /LIMIT \$\{pagination\.limit\}/.test(repo)],
  ["database OFFSET", /OFFSET \$\{pagination\.offset\}/.test(repo)],
  ["latest-version partition", /PARTITION BY qv\.\\"questionId\\"/.test(repo) || /PARTITION BY qv\."questionId"/.test(repo)],
  ["deterministic ordering", /ORDER BY latest\.\\"questionCode\\" ASC, latest\.\\"createdAt\\" DESC, latest\.\\"questionVersionId\\" DESC/.test(repo) || /ORDER BY latest\."questionCode" ASC, latest\."createdAt" DESC, latest\."questionVersionId" DESC/.test(repo)],
  ["reusable pagination utility", /normalizeAdminPagination/.test(repo) && /createAdminPaginatedResult/.test(repo)],
  ["API page parameter", /page:\s*Number\(url\.searchParams\.get\("page"/.test(api)],
  ["API pageSize parameter", /pageSize:\s*Number\(url\.searchParams\.get\("pageSize"/.test(api)],
  ["API pagination response", /pagination:\s*questions\.pagination/.test(api)],
  ["server admin authorization", /requireAdminApi\(\)/.test(api)],
  ["server initial pagination", /getAdminQuestionsPaginated\(/.test(page) && /page:\s*1,\s*pageSize:\s*25/.test(page)],
  ["pagination component integration", /<AdminPagination\b/.test(workspace) && /from "\.\/AdminPagination"/.test(workspace)],
  ["page navigation", /onPageChange=\{changePage\}/.test(workspace)],
  ["page-size navigation", /onPageSizeChange=\{changePageSize\}/.test(workspace)],
  ["no client slicing of question result", !/questions\.slice\(/.test(workspace)],
  ["pagination utility options", /\[10, 25, 50, 100\]/.test(pagination)],
  ["runtime E2E harness", fs.existsSync(path.join(root, "scripts/e2e-v11-6-6-question-bank-pagination.mjs"))],
];
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
  if (!ok) process.exitCode = 1;
}
console.log(process.exitCode ? "V11.6.6 STATIC GATE: FAIL" : "V11.6.6 STATIC GATE: PASS");

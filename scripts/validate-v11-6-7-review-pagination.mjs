import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  repo: path.join(root, "lib/admin-review-repository.ts"),
  api: path.join(root, "app/api/admin/review/route.ts"),
  page: path.join(root, "app/admin/review/page.tsx"),
  workspace: path.join(root, "components/admin/AdminReviewContentOperations.tsx"),
  pagination: path.join(root, "components/admin/AdminPagination.tsx"),
  e2e: path.join(root, "scripts/e2e-v11-6-7-review-pagination.mjs"),
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
const e2e = read(files.e2e);

const checks = [
  ["repository paginated contract", /listReviewQueuePaginated\s*\(/.test(repo)],
  ["database count", /\$queryRaw<\{ totalItems: bigint \}\[\]>/.test(repo)],
  ["database LIMIT", /LIMIT \$\{pagination\.limit\}/.test(repo)],
  ["database OFFSET", /OFFSET \$\{pagination\.offset\}/.test(repo)],
  ["latest-version partition", /PARTITION BY qv\."questionId"/.test(repo) && /ORDER BY qv\."createdAt" DESC, qv\.id DESC/.test(repo)],
  ["deterministic ordering", /ORDER BY latest\."updatedAt" DESC, latest\."questionVersionId" DESC/.test(repo)],
  ["reusable pagination utility", /normalizeAdminPagination/.test(repo) && /createAdminPaginatedResult/.test(repo)],
  ["API page parameter", /page:\s*Number\(url\.searchParams\.get\("page"/.test(api)],
  ["API pageSize parameter", /pageSize:\s*Number\(url\.searchParams\.get\("pageSize"/.test(api)],
  ["API pagination response", /pagination:queue\.pagination/.test(api)],
  ["server admin authorization", /requireAdminApi\(\)/.test(api)],
  ["server initial pagination", /listReviewQueuePaginated\(\{\s*page:\s*1,\s*pageSize:\s*25/.test(page)],
  ["pagination component integration", /<AdminPagination\b/.test(workspace) && /from "\.\/AdminPagination"/.test(workspace)],
  ["server search parameter", /search: url\.searchParams\.get\("search"/.test(api)],
  ["server status parameter", /status: url\.searchParams\.get\("status"/.test(api)],
  ["page navigation", /onPageChange=\{changePage\}/.test(workspace)],
  ["page-size navigation", /onPageSizeChange=\{changePageSize\}/.test(workspace)],
  ["no client list slicing", !/items\.slice\(/.test(workspace)],
  ["no client filter of result set", !/useMemo\(.*items\.filter/s.test(workspace)],
  ["pagination utility options", /\[10, 25, 50, 100\]/.test(pagination)],
  ["runtime E2E harness", /REVIEW PAGINATION RUNTIME E2E/.test(e2e)],
];
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
  if (!ok) process.exitCode = 1;
}
console.log(process.exitCode ? "V11.6.7 STATIC GATE: FAIL" : "V11.6.7 STATIC GATE: PASS");

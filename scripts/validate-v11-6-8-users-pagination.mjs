import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const assert = (ok, message) => {
  if (!ok) throw new Error(`FAIL — ${message}`);
  console.log(`PASS — ${message}`);
};

const repo = read("lib/admin-users-repository.ts");
const api = read("app/api/admin/users/route.ts");
const ui = read("components/admin/AdminUsersOperations.tsx");
const page = read("app/admin/users/page.tsx");
const pagination = read("lib/admin-pagination.ts");

assert(repo.includes("listAdminUsersPaginated"), "repository paginated contract");
assert(repo.includes("prisma.user.count()"), "database count");
assert(repo.includes("skip: pagination.offset"), "database OFFSET");
assert(repo.includes("take: pagination.limit"), "database LIMIT");
assert(repo.includes('orderBy: [{ createdAt: "desc" }, { id: "desc" }]'), "deterministic ordering");
assert(repo.includes('userId: { in: userIds }'), "page-bounded entitlement aggregation");
assert(repo.includes("createAdminPaginatedResult"), "reusable pagination utility");
assert(api.includes('searchParams.get("page")'), "API page parameter");
assert(api.includes('searchParams.get("pageSize")'), "API pageSize parameter");
assert(api.includes("pagination: result.pagination"), "API pagination response");
assert(api.includes("requireAdminApi"), "server admin authorization");
assert(page.includes("page: 1, pageSize: 25"), "server initial pagination");
assert(ui.includes("AdminPagination"), "pagination component integration");
assert(ui.includes("onPageChange"), "page navigation");
assert(ui.includes("onPageSizeChange"), "page-size navigation");
assert(!ui.includes(".slice("), "no client slicing of user result");
assert(pagination.includes("[10, 25, 50, 100]"), "pagination utility options");
assert(fs.existsSync(path.join(root, "scripts/e2e-v11-6-8-users-pagination.mjs")), "runtime E2E harness");
assert(fs.existsSync(path.join(root, "prisma/migrations/20260905100000_v11_5_users_access_operations/migration.sql")), "V11.5 migration retained");
console.log("V11.6.8 STATIC GATE: PASS");

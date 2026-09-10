import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));

const checks = [
  ["phase specification", () => exists("architecture/phase-11.6/ReadyScore_V11_6_2_Pagination_Repository_Utility.md")],
  ["pagination utility module", () => exists("lib/admin-pagination.ts")],
  ["page size options", () => /ADMIN_PAGE_SIZE_OPTIONS\s*=\s*\[10, 25, 50, 100\]/.test(read("lib/admin-pagination.ts"))],
  ["default page size", () => /ADMIN_DEFAULT_PAGE_SIZE\s*=\s*25/.test(read("lib/admin-pagination.ts"))],
  ["maximum page size", () => /ADMIN_MAX_PAGE_SIZE\s*=\s*100/.test(read("lib/admin-pagination.ts"))],
  ["pagination input contract", () => /export type AdminPaginationInput/.test(read("lib/admin-pagination.ts"))],
  ["normalized pagination contract", () => /export type AdminPagination/.test(read("lib/admin-pagination.ts"))],
  ["pagination metadata contract", () => /export type AdminPaginationMeta/.test(read("lib/admin-pagination.ts"))],
  ["paginated result contract", () => /export type AdminPaginatedResult/.test(read("lib/admin-pagination.ts"))],
  ["normalization function", () => /export function normalizeAdminPagination/.test(read("lib/admin-pagination.ts"))],
  ["offset calculation", () => /offset:\s*\(page - 1\) \* pageSize/.test(read("lib/admin-pagination.ts"))],
  ["limit calculation", () => /limit:\s*pageSize/.test(read("lib/admin-pagination.ts"))],
  ["metadata function", () => /export function buildAdminPaginationMeta/.test(read("lib/admin-pagination.ts"))],
  ["result helper", () => /export function createAdminPaginatedResult/.test(read("lib/admin-pagination.ts"))],
  ["no database dependency", () => !/from ["']\.\/db\/|from ["']@prisma\/client/.test(read("lib/admin-pagination.ts"))],
  ["no pagination migration", () => ![...fs.readdirSync(path.join(root, "prisma/migrations"))].some((name) => /v11[_-]?6[_-]?2.*pagination/i.test(name))],
  ["no pagination API introduced", () => !exists("app/api/admin/audit/route.ts")],
];

for (const [name, fn] of checks) {
  if (!fn()) {
    console.error(`FAIL: ${name}`);
    process.exit(1);
  }
  console.log(`PASS: ${name}`);
}

console.log("V11.6.2 PAGINATION REPOSITORY UTILITY GATE: PASS");

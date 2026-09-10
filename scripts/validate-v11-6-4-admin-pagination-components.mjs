import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

const spec = read("architecture/phase-11.6/ReadyScore_V11_6_4_Admin_Pagination_Components.md");
const component = read("components/admin/AdminPagination.tsx");
const packageJson = JSON.parse(read("package.json"));

assert(spec.includes("V11.6.3 — Audit API"), "baseline specification");
assert(spec.includes("V11.6.4"), "phase specification");
assert(component.includes('export function AdminPagination'), "pagination component export");
assert(component.includes("onPageChange"), "page change callback contract");
assert(component.includes("onPageSizeChange"), "page size callback contract");
assert(component.includes("hasNextPage") && component.includes("hasPreviousPage"), "boundary contract");
assert(component.includes("aria-current"), "current page accessibility");
assert(component.includes('aria-label="Pagination"'), "pagination navigation accessibility");
assert(component.includes("ADMIN_PAGINATION_PAGE_SIZE_OPTIONS"), "page size options");
assert(component.includes("[10, 25, 50, 100]"), "supported page sizes");
assert(component.includes("clampPage"), "client boundary clamping");
assert(!component.includes("fetch("), "no data fetching");
assert(!component.includes("prisma"), "no database dependency");
assert(!component.includes("/api/admin"), "no API dependency");
assert(!component.includes("router.push"), "no URL mutation");
assert(packageJson.scripts["v11:6:4:gate"] === "node scripts/validate-v11-6-4-admin-pagination-components.mjs", "package gate script");
assert(!fs.existsSync(path.join(root, "prisma/migrations/20260905110000_v11_6_4_admin_pagination_components")), "no pagination migration");

console.log("V11.6.4 ADMIN PAGINATION COMPONENTS GATE: PASS");

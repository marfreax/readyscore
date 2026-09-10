import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
const api = read("app/api/admin/audit/route.ts");
const repo = read("lib/admin-audit-repository.ts");
const checks = [
  ["phase specification", () => exists("architecture/phase-11.6/ReadyScore_V11_6_3_Audit_API.md")],
  ["audit API route", () => exists("app/api/admin/audit/route.ts")],
  ["GET endpoint", () => /export async function GET/.test(api)],
  ["admin API authorization", () => /requireAdminApi\(\)/.test(api)],
  ["entity type filter", () => /entityType/.test(api)],
  ["entity ID filter", () => /entityId/.test(api)],
  ["actor filter", () => /actorUserId/.test(api)],
  ["action filter", () => /action/.test(api)],
  ["pagination input", () => /pageSize|page/.test(api) && /listAdminAuditEventsPaginated/.test(api)],
  ["database count", () => /adminContentAuditEvent\.count/.test(repo)],
  ["database pagination", () => /skip:\s*pagination\.offset/.test(repo) && /take:\s*pagination\.limit/.test(repo)],
  ["deterministic ordering", () => /createdAt:\s*"desc"/.test(repo) && /id:\s*"desc"/.test(repo)],
  ["pagination utility reused", () => /normalizeAdminPagination/.test(repo) && /createAdminPaginatedResult/.test(repo)],
  ["no audit mutation route", () => !/export async function (POST|PUT|PATCH|DELETE)/.test(api)],
  ["no pagination migration", () => !fs.readdirSync(path.join(root, "prisma/migrations")).some((name) => /v11[_-]?6[_-]?3.*audit/i.test(name))],
];
for (const [name, fn] of checks) {
  if (!fn()) { console.error(`FAIL: ${name}`); process.exit(1); }
  console.log(`PASS: ${name}`);
}
console.log("V11.6.3 AUDIT API GATE: PASS");

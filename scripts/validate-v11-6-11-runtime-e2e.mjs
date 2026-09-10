import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => { console.error(`FAIL — ${message}`); process.exit(1); };
const pass = (message) => console.log(`PASS — ${message}`);

const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.["v11:6:11:gate"] !== "node scripts/validate-v11-6-11-runtime-e2e.mjs") fail("phase gate script missing");
if (pkg.scripts?.["e2e:v11:6:11:runtime"] !== "node scripts/e2e-v11-6-11-runtime-e2e.mjs") fail("phase E2E script missing");
pass("package scripts");

const e2e = read("scripts/e2e-v11-6-11-runtime-e2e.mjs");
for (const marker of [
  "/admin/audit",
  "/api/admin/audit",
  "/api/admin/audit/__v11_6_11_missing__",
  "/api/admin/question-bank",
  "/api/admin/review",
  "/api/admin/users",
  "page=1&pageSize=10",
  "page=2&pageSize=10",
  "page=999999&pageSize=10",
  "audit detail retrieval",
  "audit detail not-found boundary",
  "audit read-only mutation boundary",
  "V11.6.11 RUNTIME E2E: PASS",
]) {
  if (!e2e.includes(marker)) fail(`runtime harness coverage missing: ${marker}`);
}
pass("full Phase 11.6 runtime harness coverage");

for (const file of [
  "scripts/e2e-v11-6-11-runtime-e2e.mjs",
  "scripts/validate-v11-6-11-runtime-e2e.mjs",
  "lib/admin-audit-repository.ts",
  "app/api/admin/audit/route.ts",
  "app/api/admin/audit/[eventId]/route.ts",
  "app/admin/audit/page.tsx",
  "components/admin/AdminAuditWorkspace.tsx",
  "components/admin/AdminPagination.tsx",
]) {
  if (!fs.existsSync(path.join(root, file))) fail(`required artifact missing: ${file}`);
}
pass("required runtime/admin artifacts");

const migrationDir = path.join(root, "prisma/migrations");
if (fs.existsSync(migrationDir)) {
  const migrations = fs.readdirSync(migrationDir);
  if (migrations.some(name => /11_6_11|v11_6_11/i.test(name))) fail("11.6.11 migration introduced");
}
pass("no 11.6.11 migration");

console.log("V11.6.11 STATIC GATE: PASS");

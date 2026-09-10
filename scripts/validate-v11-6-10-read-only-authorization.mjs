import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => { console.error(`FAIL: ${message}`); process.exit(1); };
const pass = (message) => console.log(`PASS — ${message}`);

const page = read("app/admin/audit/page.tsx");
if (!page.includes('import { requireAdmin } from "../../../lib/auth/admin";')) fail("audit page admin authorization import missing");
if (!page.includes("await requireAdmin();")) fail("audit page does not enforce server-side admin authorization");
pass("audit page server authorization");

const listApi = read("app/api/admin/audit/route.ts");
if (!listApi.includes("requireAdminApi")) fail("audit list API authorization missing");
pass("audit list API authorization");

const detailApi = read("app/api/admin/audit/[eventId]/route.ts");
if (!detailApi.includes("requireAdminApi")) fail("audit detail API authorization missing");
for (const method of ['method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"']) {
  if (detailApi.includes(method)) fail(`detail API mutation method: ${method}`);
}
pass("audit detail API remains GET-only");

const repo = read("lib/admin-audit-repository.ts");
for (const marker of ["findMany", "findUnique", "orderBy: [{ createdAt: \"desc\" }, { id: \"desc\" }]"]) {
  if (!repo.includes(marker)) fail(`audit repository read marker: ${marker}`);
}
if (/\.\s*(create|update|delete|upsert)\s*\(/.test(repo)) fail("audit repository mutation method");
pass("audit repository read-only boundary");

const ui = read("components/admin/AdminAuditWorkspace.tsx");
if (!ui.includes("Read-only · Immutable audit event")) fail("read-only UI marker missing");
for (const method of ['method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"']) {
  if (ui.includes(method)) fail(`audit UI mutation method: ${method}`);
}
pass("audit workspace read-only UI");

const migrations = fs.existsSync(path.join(root, "prisma/migrations"))
  ? fs.readdirSync(path.join(root, "prisma/migrations"))
  : [];
if (migrations.some((name) => /11_6_10|v11_6_10/i.test(name))) fail("11.6.10 migration introduced");
pass("no 11.6.10 migration");

const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.["v11:6:10:gate"] !== "node scripts/validate-v11-6-10-read-only-authorization.mjs") fail("package gate script missing");
if (pkg.scripts?.["e2e:v11:6:10:read-only-authorization"] !== "node scripts/e2e-v11-6-10-read-only-authorization.mjs") fail("package E2E script missing");
pass("package scripts");

if (!fs.existsSync(path.join(root, "scripts/e2e-v11-6-10-read-only-authorization.mjs"))) fail("runtime E2E harness missing");
pass("runtime E2E harness");

console.log("V11.6.10 STATIC GATE: PASS");

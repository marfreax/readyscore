import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const fail = (message) => { console.error(`FAIL: ${message}`); process.exit(1); };
const pass = (message) => console.log(`PASS — ${message}`);

if (!exists("V11_6_9_ARCHITECTURE.md") || !exists("V11_6_9_DELIVERY_NOTES.md")) fail("phase documentation missing");
pass("phase documentation");

const repo = read("lib/admin-audit-repository.ts");
for (const marker of ["getAdminAuditEventById", "findUnique", "auditEventSelect", "getById"]) {
  if (!repo.includes(marker)) fail(`repository detail marker: ${marker}`);
}
pass("repository detail read contract");
if (repo.includes("update(") || repo.includes("delete(") || repo.includes("create(")) fail("audit repository mutation path");
pass("repository remains read-only");

if (!exists("app/api/admin/audit/[eventId]/route.ts")) fail("audit detail API missing");
const api = read("app/api/admin/audit/[eventId]/route.ts");
for (const marker of ["requireAdminApi", "getAdminAuditEventById", "AUDIT_EVENT_NOT_FOUND", "status: 404"]) {
  if (!api.includes(marker)) fail(`detail API marker: ${marker}`);
}
if (api.includes('method: "POST"') || api.includes('method: "PATCH"') || api.includes('method: "PUT"') || api.includes('method: "DELETE"')) fail("detail API mutation method");
pass("detail API authorization and not-found behavior");
pass("detail API read-only method");

const ui = read("components/admin/AdminAuditWorkspace.tsx");
for (const marker of [
  "/api/admin/audit/",
  "openDetail",
  "Audit Detail",
  'role="dialog"',
  "aria-modal=\"true\"",
  "Action",
  "Actor",
  "Entity",
  "Entity ID",
  "Timestamp",
  "From State",
  "To State",
  "Metadata",
  "MetadataView",
  "Read-only · Immutable audit event",
]) {
  if (!ui.includes(marker)) fail(`workspace detail marker: ${marker}`);
}
if (ui.includes("prisma") || ui.includes("@prisma/client")) fail("database dependency in UI");
if (ui.includes('method: "POST"') || ui.includes('method: "PATCH"') || ui.includes('method: "PUT"') || ui.includes('method: "DELETE"')) fail("audit mutation method in UI");
pass("detail UI integration");
pass("structured metadata presentation");
pass("read-only UI safety");

const listApi = read("app/api/admin/audit/route.ts");
if (!listApi.includes("requireAdminApi") || !listApi.includes("listAdminAuditEventsPaginated")) fail("list API authorization boundary");
pass("list API authorization preserved");

const migrationDir = path.join(root, "prisma", "migrations");
const migrations = exists("prisma/migrations") ? fs.readdirSync(migrationDir) : [];
if (migrations.some((name) => name.toLowerCase().includes("11_6_9") || name.toLowerCase().includes("v11_6_9"))) fail("11.6.9 migration introduced");
pass("no 11.6.9 migration");

if (!exists("scripts/e2e-v11-6-9-audit-detail.mjs")) fail("runtime E2E harness missing");
pass("runtime E2E harness");

const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.["v11:6:9:gate"] !== "node scripts/validate-v11-6-9-audit-detail.mjs") fail("package gate script");
if (pkg.scripts?.["e2e:v11:6:9:audit-detail"] !== "node scripts/e2e-v11-6-9-audit-detail.mjs") fail("package E2E script");
pass("package scripts");

console.log("V11.6.9 STATIC GATE: PASS");

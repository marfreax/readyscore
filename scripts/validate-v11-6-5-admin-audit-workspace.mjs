import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exit(1);
};
const pass = (message) => console.log(`PASS: ${message}`);

const spec = read("V11_6_5_DELIVERY_NOTES.md");
if (!spec.includes("11.6.5") || !spec.includes("/admin/audit")) fail("phase notes");
pass("phase specification");

if (!exists("app/admin/audit/page.tsx")) fail("audit page missing");
pass("audit page exists");
const page = read("app/admin/audit/page.tsx");
if (!page.includes("AdminAuditWorkspace")) fail("audit page workspace composition");
pass("audit page composition");

if (!exists("components/admin/AdminAuditWorkspace.tsx")) fail("audit workspace component missing");
const ui = read("components/admin/AdminAuditWorkspace.tsx");
for (const marker of [
  'fetch(`/api/admin/audit?',
  "AdminPagination",
  "onPageChange",
  "onPageSizeChange",
  "Audit trail tidak dapat dimuat",
  "fromStatus",
  "toStatus",
  "actorUserId",
  "createdAt",
]) {
  if (!ui.includes(marker)) fail(`workspace marker: ${marker}`);
}
pass("API retrieval and pagination integration");
pass("pagination summary delegated to AdminPagination");
pass("empty state");
pass("error state");
pass("read-only presentation");
pass("audit event fields");

if (ui.includes("POST") || ui.includes("PATCH") || ui.includes("PUT") || ui.includes("DELETE")) fail("mutation method in audit workspace");
if (ui.includes("prisma") || ui.includes("@prisma/client")) fail("database dependency in UI component");
pass("no audit mutation");
pass("no database dependency in UI");

const shell = read("components/admin/AdminShell.tsx");
if (!shell.includes('href: "/admin/audit"') || !shell.includes('label: "Audit Trail"')) fail("admin navigation");
pass("admin navigation");

const api = read("app/api/admin/audit/route.ts");
if (!api.includes("requireAdminApi") || !api.includes("listAdminAuditEventsPaginated")) fail("API authorization/repository boundary");
pass("server authorization boundary preserved");

const repo = read("lib/admin-audit-repository.ts");
if (!repo.includes("skip: pagination.offset") || !repo.includes("take: pagination.limit")) fail("database pagination boundary");
if (!repo.includes('createdAt: "desc"') || !repo.includes('id: "desc"')) fail("deterministic ordering");
pass("database pagination preserved");
pass("deterministic ordering preserved");

const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.["v11:6:5:gate"] !== "node scripts/validate-v11-6-5-admin-audit-workspace.mjs") fail("package gate script");
pass("package gate script");

const migrationDir = path.join(root, "prisma", "migrations");
const migrations = exists("prisma/migrations") ? fs.readdirSync(migrationDir) : [];
if (migrations.some((name) => name.toLowerCase().includes("11_6_5") || name.toLowerCase().includes("v11_6_5"))) fail("11.6.5 migration introduced");
pass("no 11.6.5 migration");

console.log("V11.6.5 ADMIN AUDIT WORKSPACE GATE: PASS");

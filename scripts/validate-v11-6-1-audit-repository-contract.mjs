import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
const checks = [
  ["phase specification", () => exists("architecture/phase-11.6/ReadyScore_V11_6_1_Audit_Repository_Contract.md")],
  ["audit repository module", () => exists("lib/admin-audit-repository.ts")],
  ["canonical entity types", () => {
    const s = read("lib/admin-audit-repository.ts");
    return /QUESTION_VERSION/.test(s) && /ASSESSMENT_CONFIGURATION_VERSION/.test(s) && /USER/.test(s);
  }],
  ["repository input contract", () => /export type AdminAuditListInput/.test(read("lib/admin-audit-repository.ts"))],
  ["audit event record contract", () => /export type AdminAuditEventRecord/.test(read("lib/admin-audit-repository.ts"))],
  ["repository interface contract", () => /export type AdminAuditRepository/.test(read("lib/admin-audit-repository.ts"))],
  ["canonical list function", () => /export async function listAdminAuditEvents/.test(read("lib/admin-audit-repository.ts"))],
  ["existing audit model remains source", () => /prisma\.adminContentAuditEvent\.findMany/.test(read("lib/admin-audit-repository.ts"))],
  ["deterministic ordering", () => /orderBy:\s*\[\{ createdAt: "desc" \}, \{ id: "desc" \}\]/.test(read("lib/admin-audit-repository.ts"))],
  ["bounded V11.5-compatible read", () => /take:\s*200/.test(read("lib/admin-audit-repository.ts"))],
  ["review delegates to repository", () => /listAdminAuditEvents/.test(read("lib/admin-review-repository.ts"))],
  ["no V11.6 migration", () => !exists("prisma/migrations/20260905_v11_6_1_audit_repository_contract") && ![...fs.readdirSync(path.join(root, "prisma/migrations"))].some((name) => /v11[_-]?6[_-]?1.*audit.*repository/i.test(name))],
  ["no audit mutation API introduced", () => !exists("app/api/admin/audit/route.ts")],
];
for (const [name, fn] of checks) {
  if (!fn()) { console.error(`FAIL: ${name}`); process.exit(1); }
  console.log(`PASS: ${name}`);
}
console.log("V11.6.1 AUDIT REPOSITORY CONTRACT GATE: PASS");

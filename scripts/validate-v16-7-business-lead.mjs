import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const schema = read("prisma/schema.prisma");
const unlock = read("app/api/free/unlock/route.ts");
const service = read("lib/business-lead.ts");
const adminRepo = read("lib/admin-business-leads-repository.ts");
const adminApi = read("app/api/admin/leads/route.ts");
const adminPage = read("app/admin/leads/page.tsx");
const adminNav = read("components/admin/AdminShell.tsx");
const migration = read("prisma/migrations/20260917010000_v16_7_business_lead/migration.sql");

const checks = [
  ["BusinessLead model", /model BusinessLead\s*\{/.test(schema)],
  ["BusinessLead whatsapp unique", /whatsapp\s+String\s+@unique/.test(schema)],
  ["BusinessLead email unique", /email\s+String\?\s+@unique/.test(schema)],
  ["canonical source", /FREE_ASSESSMENT/.test(schema) && /FREE_ASSESSMENT/.test(service)],
  ["consent fields", /consent\s+Boolean/.test(schema) && /consentAt\s+DateTime/.test(schema)],
  ["assessment reference", /assessmentAttemptId\s+String\?\s+@unique/.test(schema)],
  ["FreeLeadCapture link", /businessLeadId\s+String\?/.test(schema) && /FreeLeadCapture_businessLeadId_idx/.test(migration)],
  ["create/update service", /createOrUpdateBusinessLead/.test(unlock) && /findIdentityMatches/.test(service)],
  ["dedupe OR identity", /OR:\s*\[/.test(service) && /whatsapp/.test(service) && /email/.test(service)],
  ["race-safe unique fallback", /P2002/.test(service) && /existingAfterRace/.test(service)],
  ["lead after FreeLeadCapture", unlock.indexOf("const lead = await prisma.freeLeadCapture.upsert") < unlock.indexOf("businessLead = await createOrUpdateBusinessLead")],
  ["lead failure does not block report", /businessLeadError/.test(unlock) && /unlocked:\s*true/.test(unlock)],
  ["funnel events", /business_lead_created/.test(unlock) && /business_lead_reused/.test(unlock)],
  ["admin server authorization", /requireAdminApi/.test(adminApi) && /requireAdmin\(\)/.test(adminPage)],
  ["admin lead repository", /listAdminBusinessLeadsPaginated/.test(adminRepo) && /businessLead\.findMany/.test(adminRepo)],
  ["admin lead visibility", /Business Leads/.test(adminPage) && /FREE_ASSESSMENT/.test(adminPage)],
  ["admin navigation", /Business Leads/.test(adminNav) && /\/admin\/leads/.test(adminNav)],
  ["migration creates table", /CREATE TABLE "BusinessLead"/.test(migration)],
  ["migration foreign keys", /BusinessLead_assessmentAttemptId_fkey/.test(migration) && /FreeLeadCapture_businessLeadId_fkey/.test(migration)],
  ["no CRM expansion", !/CRM|campaign|broadcast|lead scoring/i.test(service)],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error("V16.7 Lead Business Record static gate: FAIL");
  for (const [label] of failed) console.error(`- ${label}`);
  process.exit(1);
}
console.log("V16.7 Lead Business Record static gate: PASS");

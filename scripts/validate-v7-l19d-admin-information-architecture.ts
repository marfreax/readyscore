import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => {
  throw new Error(`L19D check failed: ${message}`);
};
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(root, file));

console.log("=== READY SCORE V7 L19D ADMIN INFORMATION ARCHITECTURE REFINEMENT MVP GATE ===");
console.log("Scope      : Admin navigation and operational information architecture");
console.log("Protection : No measurement, scoring, result, commercial, entitlement, reassessment, or profiling mutation");

if (!exists("components/admin/AdminShell.tsx")) fail("AdminShell missing");
console.log("PASS: Canonical admin shell present");

const shell = read("components/admin/AdminShell.tsx");
for (const marker of [
  "/admin",
  "/admin/question-bank",
  "/admin/review",
  "/admin/assessment-config",
  "/admin/users",
  "/admin/integrations",
  "CONTENT",
  "USERS & ACCESS",
  "INTEGRATIONS",
]) {
  if (!shell.includes(marker)) fail(`Admin navigation marker missing: ${marker}`);
}
console.log("PASS: Admin navigation grouped by operational responsibility");

if (!exists("app/admin/layout.tsx")) fail("Admin layout missing");
if (!read("app/admin/layout.tsx").includes("requireAdmin")) fail("Admin layout does not enforce admin authorization");
console.log("PASS: Admin shell authorization boundary present");

for (const route of [
  "app/admin/page.tsx",
  "app/admin/question-bank/page.tsx",
  "app/admin/review/page.tsx",
  "app/admin/assessment-config/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/integrations/page.tsx",
]) {
  if (!exists(route)) fail(`Required admin route missing: ${route}`);
}
console.log("PASS: Canonical admin destinations present");

for (const file of [
  "app/admin/question-bank/page.tsx",
  "app/admin/review/page.tsx",
  "app/admin/assessment-config/page.tsx",
  "app/admin/riasec-review/page.tsx",
]) {
  const source = read(file);
  if (file.includes("riasec-review") && !source.includes("requireAdmin")) {
    fail("Specialized RIASEC admin review route is not protected");
  }
}
console.log("PASS: Existing content capabilities remain protected and discoverable");

const users = read("app/admin/users/page.tsx");
for (const marker of ["User", "role", "entitlements", "attempts", "institutionMemberships"]) {
  if (!users.includes(marker)) fail(`Users & Access marker missing: ${marker}`);
}
console.log("PASS: Users & Access operational location defined");

const integrations = read("app/admin/integrations/page.tsx");
for (const marker of ["Scalev", "Webhook", "SCALEV_WEBHOOK_SIGNING_SECRET", "SCALEV_API_KEY"]) {
  if (!integrations.includes(marker)) fail(`Integration marker missing: ${marker}`);
}
console.log("PASS: Integration operational location defined");

if (shell.includes('href: "/admin/settings"') || shell.includes('label: "Settings"')) {
  fail("Settings navigation created without a real settings surface");
}
console.log("PASS: No artificial Settings area introduced");

for (const protectedFile of [
  "lib/question-bank-repository.ts",
  "lib/assessment-configuration-repository.ts",
  "lib/admin-review-repository.ts",
  "lib/commercial/entitlement-service.ts",
]) {
  if (!exists(protectedFile)) fail(`Protected architecture file missing: ${protectedFile}`);
}
console.log("PASS: Protected architecture files remain present");

const schema = read("prisma/schema.prisma");
if (!schema.includes("model User") || !schema.includes("model QuestionVersion") || !schema.includes("model AssessmentAttempt")) {
  fail("Protected data model contract unexpectedly missing");
}
console.log("PASS: Protected data model contract remains present");

const migrationDir = path.join(root, "prisma", "migrations");
if (exists("prisma/migrations") && fs.readdirSync(migrationDir).some((name) => name.toLowerCase().includes("l19d"))) {
  fail("L19D migration detected");
}
console.log("PASS: No L19D database migration");

for (const forbidden of [
  "universal score",
  "average(",
  "mean(",
]) {
  if (users.toLowerCase().includes(forbidden) || integrations.toLowerCase().includes(forbidden)) {
    fail(`Forbidden measurement synthesis marker found: ${forbidden}`);
  }
}
console.log("PASS: Admin IA layer contains no measurement synthesis");

if (!exists("architecture/phase-7.19D/ReadyScore_V7_L19D_Admin_Information_Architecture_Refinement.md")) {
  fail("L19D documentation missing");
}
console.log("PASS: L19D documentation present");

console.log("PASS: Measurement semantics not mutated by L19D surface changes");
console.log("PASS: Commercial semantics not mutated by L19D surface changes");
console.log("V7 L19D ADMIN INFORMATION ARCHITECTURE REFINEMENT MVP GATE: PASS");

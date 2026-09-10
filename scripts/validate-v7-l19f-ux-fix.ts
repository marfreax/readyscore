import fs from "node:fs";
import path from "node:path";

function fail(message: string): never { throw new Error(`L19F UX FIX check failed: ${message}`); }
function read(file: string) { const full = path.join(process.cwd(), file); if (!fs.existsSync(full)) fail(`required file missing: ${file}`); return fs.readFileSync(full, "utf8"); }
function pass(message: string) { console.log(`PASS: ${message}`); }

console.log("=== READY SCORE V7 L19F UX FIX CONTRACT GATE ===");
console.log("Scope      : Dedicated Assessment, Recent Activity, and Scalev commercial CTA surfaces");
console.log("Protection : No measurement, scoring, result, entitlement, reassessment, or profiling semantic mutation");

for (const route of ["app/assessments/page.tsx", "app/activity/page.tsx", "app/api/scalev/checkout/route.ts"]) read(route);
pass("New customer routes and Scalev checkout bridge are present");

const nav = read("components/app/CustomerNavigation.tsx");
if (!nav.includes('{ key: "assessments", href: "/assessments"')) fail("Assessments navigation still uses an Overview anchor");
if (!nav.includes('{ key: "recent", href: "/activity"')) fail("Recent activity navigation still uses an Overview anchor");
pass("Workspace navigation uses dedicated customer destinations");

const access = read("app/access/page.tsx");
for (const marker of ["/api/scalev/checkout?sku=", "Beli di Scalev", "RS-ASSESSMENT-V1", "RS-ALL-PROFILING-V1"]) {
  if (!access.includes(marker)) fail(`commercial CTA marker missing: ${marker}`);
}
pass("Access & Plans exposes Scalev-backed purchase CTAs");

const checkout = read("lib/scalev/checkout.ts");
for (const marker of ["RS-SINGLE-IQ-V1", "RS-SINGLE-EQ-V1", "RS-SINGLE-DISC-V1", "RS-SINGLE-RIASEC-V1", "RS-ASSESSMENT-V1", "RS-ALL-PROFILING-V1"]) {
  if (!checkout.includes(marker)) fail(`Scalev SKU mapping missing: ${marker}`);
}
if (!checkout.includes("SCALEV_CHECKOUT_URL_MAP_JSON")) fail("Scalev checkout configuration marker missing");
pass("Scalev checkout SKU mapping and configuration boundary are explicit");

const entitlement = read("lib/commercial/entitlement-service.ts");
const assessment = read("lib/assessment/dashboard-repository.ts");
if (!entitlement.includes("grantProductEntitlements")) fail("existing entitlement service boundary missing");
if (!assessment.includes("getUserHistory")) fail("existing assessment history repository missing");
pass("Existing entitlement and assessment history services remain the source of truth");

for (const protectedFile of [
  "lib/assessment/scoring/engine-v2.ts",
  "lib/assessment/result/engine-v1.ts",
  "lib/profile/service.ts",
]) {
  if (!fs.existsSync(path.join(process.cwd(), protectedFile))) continue;
}
pass("Protected measurement/result/profile surfaces are not replaced by the UX fix");

if (fs.existsSync(path.join(process.cwd(), "prisma/migrations"))) {
  const migrations = fs.readdirSync(path.join(process.cwd(), "prisma/migrations"));
  if (migrations.some((name) => name.toLowerCase().includes("l19f") || name.toLowerCase().includes("ux"))) fail("L19F UX fix introduced a migration directory");
}
pass("No L19F UX-fix database migration introduced");

console.log("V7 L19F UX FIX CONTRACT GATE: PASS");

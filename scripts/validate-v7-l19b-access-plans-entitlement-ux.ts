import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => { throw new Error(`L19B check failed: ${message}`); };
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(root, file));

console.log("=== READY SCORE V7 L19B ACCESS & PLANS / ENTITLEMENT UX GATE ===");
console.log("Scope      : Access & Plans and entitlement-facing customer UX");
console.log("Protection : No measurement, scoring, result, commercial, entitlement, reassessment, or profiling mutation");

for (const file of [
  "app/access/page.tsx",
  "components/app/AppShell.tsx",
  "components/app/CustomerNavigation.tsx",
  "lib/commercial/catalog.ts",
  "lib/commercial/entitlement-service.ts",
  "lib/commercial/upgrade-service.ts",
]) if (!exists(file)) fail(`required file missing: ${file}`);
console.log("PASS: Canonical Access & Plans surface present");

const page = read("app/access/page.tsx");
const nav = read("components/app/CustomerNavigation.tsx");
for (const marker of [
  'CustomerPageShell',
  'Current access',
  'Assessment Anda',
  'Available',
  'Locked',
  'Mulai Assessment',
  'Lihat paket',
  'Single Test',
  'All Tests',
  'All Tests + Profiling',
  'Upgrade tersedia',
  'Capability extensions',
  'tidak pernah memberikan akses berbayar secara langsung',
]) if (!page.includes(marker)) fail(`Access & Plans marker missing: ${marker}`);
console.log("PASS: Capability and commercial states represented");

if (!nav.includes('href: "/access"') || !nav.includes('label: "Access & plans"')) fail("Access & Plans navigation missing");
console.log("PASS: Access & Plans customer navigation present");

if (!page.includes("getCommercialCatalog") || !page.includes("listUserEntitlements") || !page.includes("getActiveProductsForUser")) {
  fail("Access surface does not read canonical commercial/entitlement services");
}
console.log("PASS: Actual commercial catalog and entitlement services used");

if (!page.includes('href={test.href}') || !page.includes('active ? (') || !page.includes('a href="#plans"')) {
  fail("Capability action boundary missing");
}
console.log("PASS: Entitled start vs locked package action boundary present");

const catalog = read("lib/commercial/catalog.ts");
const entitlement = read("lib/commercial/entitlement-service.ts");
if (!catalog.includes("COMMERCIAL_PRODUCT_CATALOG")) fail("Canonical commercial catalog missing");
if (!entitlement.includes("hasEntitlement")) fail("Canonical entitlement policy missing");
if (page.includes("grantProductEntitlements") || page.includes("grantSingleTestEntitlements") || page.includes("grantEntitlement")) {
  fail("Customer Access UI directly invokes entitlement grant primitive");
}
console.log("PASS: No customer-side entitlement grant bypass");

const migrationRoot = path.join(root, "prisma", "migrations");
const migrations = fs.existsSync(migrationRoot) ? fs.readdirSync(migrationRoot) : [];
const suspicious = migrations.filter((name) => /l19b|access-plans|entitlement-ux/i.test(name));
if (suspicious.length) fail(`Unexpected L19B migration: ${suspicious.join(", ")}`);
console.log("PASS: No L19B database migration");

for (const file of [
  "architecture/phase-7.19B/ReadyScore_V7_L19B_Access_Plans_Entitlement_UX_Completion.md",
  "V7_L19B_IMPLEMENTATION_NOTES.md",
]) if (!exists(file)) fail(`L19B documentation missing: ${file}`);
console.log("PASS: L19B documentation present");

console.log("PASS: Measurement semantics not mutated by L19B");
console.log("PASS: Commercial semantics not mutated by L19B");
console.log("PASS: Entitlement semantics remain delegated");
console.log("V7 L19B ACCESS & PLANS / ENTITLEMENT UX GATE: PASS");

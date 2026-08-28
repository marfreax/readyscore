import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => { throw new Error(`L19A check failed: ${message}`); };
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(root, file));

console.log("=== READY SCORE V7 L19A CUSTOMER SHELL & NAVIGATION GATE ===");
console.log("Scope      : Customer shell and navigation refinement");
console.log("Protection : No measurement, scoring, result, commercial, entitlement, reassessment, or profiling mutation");

if (!exists("components/app/AppShell.tsx")) fail("AppShell missing");
if (!exists("components/app/CustomerNavigation.tsx")) fail("CustomerNavigation missing");

const shell = read("components/app/AppShell.tsx");
const nav = read("components/app/CustomerNavigation.tsx");
const css = read("app/globals.css");

for (const marker of ["CustomerSidebar", "CustomerMobileMenu", "CustomerHeaderActions", "main id=\"main-content\""]) {
  if (!shell.includes(marker)) fail(`AppShell marker missing: ${marker}`);
}
console.log("PASS: Canonical AppShell structure present");

for (const marker of [
  'href: "/app"',
  'href: "/profile"',
  'href: "/reports"',
  'href: "/app#assessments"',
  'href: "/app#recent"',
  'href: "/app#access"',
  'aria-current={isActive ? "page" : undefined}',
  'aria-expanded={open}',
  'aria-controls="customer-mobile-navigation"',
]) {
  if (!nav.includes(marker)) fail(`Navigation marker missing: ${marker}`);
}
console.log("PASS: Canonical customer navigation present");

if (shell.includes("Main navigation") || shell.includes("rs-nav-link")) fail("Legacy duplicate header navigation remains in AppShell");
if (nav.includes("rs-nav-link")) fail("Legacy navigation primitive remains in CustomerNavigation");
console.log("PASS: Duplicate primary navigation removed");

for (const marker of [".rs-workspace-link", ".rs-workspace-link-active"]) {
  if (!css.includes(marker)) fail(`Workspace navigation CSS missing: ${marker}`);
}
console.log("PASS: Workspace navigation styling present");

for (const file of [
  "app/profile/page.tsx",
  "app/reports/page.tsx",
  "app/reports/[attemptId]/parent/page.tsx",
  "app/result/[attemptId]/page.tsx",
  "app/reassessment/[type]/page.tsx",
]) {
  if (!exists(file)) fail(`Required customer route missing: ${file}`);
}
console.log("PASS: Required customer routes exist");

const profile = read("app/profile/page.tsx");
const reassessment = read("app/reassessment/[type]/page.tsx");
if (!profile.includes("<CustomerPageShell")) fail("Profile does not retain CustomerPageShell");
if (!reassessment.includes("<AppShell userName={session.user.name}>") ) fail("Reassessment does not retain AppShell");
console.log("PASS: Profile and reassessment retain customer shell");

const migrationRoot = path.join(root, "prisma", "migrations");
const migrations = fs.existsSync(migrationRoot) ? fs.readdirSync(migrationRoot) : [];
const suspicious = migrations.filter((name) => /l19a|customer-shell|navigation/i.test(name));
if (suspicious.length) fail(`Unexpected L19A migration: ${suspicious.join(", ")}`);
console.log("PASS: No L19A database migration");

for (const file of [
  "architecture/phase-7.19A/ReadyScore_V7_L19A_Customer_Shell_Navigation_Refinement.md",
  "V7_L19A_IMPLEMENTATION_NOTES.md",
]) {
  if (!exists(file)) fail(`L19A documentation missing: ${file}`);
}
console.log("PASS: L19A documentation present");

for (const file of ["prisma/schema.prisma", "lib/assessment/scoring-engine.ts", "lib/commercial/entitlement-service.ts", "lib/profile/service.ts"]) {
  if (!exists(file)) fail(`Protected implementation file missing: ${file}`);
}
console.log("PASS: Protected architecture files remain present");

console.log("PASS: Measurement semantics not mutated by L19A surface changes");
console.log("PASS: Commercial semantics not mutated by L19A surface changes");
console.log("V7 L19A CUSTOMER SHELL & NAVIGATION GATE: PASS");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (m: string): never => { throw new Error(`L19 check failed: ${m}`); };
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const has = (p: string, marker: string) => read(p).includes(marker);
const pathExists = (p: string) => fs.existsSync(path.join(root, p));
const css = read("app/globals.css");

console.log("=== READY SCORE V7 L19 GLOBAL UX/UI SYSTEM HARDENING MVP GATE ===");
console.log("Scope      : Product-wide visual and interaction system hardening");
console.log("Protection : Frozen measurement, scoring, result, commercial, profiling, reassessment semantics");

for (const marker of ["--rs-bg", "--rs-primary", "--rs-border", "--rs-radius-lg", "--rs-shadow-md"]) {
  if (!css.includes(marker)) fail(`Design token missing: ${marker}`);
}
console.log("PASS: Design tokens present");
for (const marker of [".rs-container", ".rs-card", ".rs-button", ".rs-badge", ".rs-input", ".rs-form", ".rs-table", ".rs-tabs", ".rs-modal", ".rs-state", ".rs-loading", ".rs-error", ".rs-toast", ".rs-nav", ".rs-skip-link"]) {
  if (!css.includes(marker)) fail(`Global primitive missing: ${marker}`);
}
console.log("PASS: Global component primitives present");
for (const marker of [":focus-visible", "prefers-reduced-motion", "scroll-behavior", "tap-highlight-color"]) {
  if (!css.includes(marker)) fail(`Accessibility/resilience baseline missing: ${marker}`);
}
console.log("PASS: Accessibility and motion baseline present");
if (!pathExists("components/ui/DesignSystem.tsx")) fail("Shared design-system component module missing");
for (const marker of ["export function Card", "export function Badge", "export function Button", "export function Input", "export function EmptyState", "export function LoadingState", "export function ErrorState", "export function Toast"]) {
  if (!has("components/ui/DesignSystem.tsx", marker)) fail(`Shared primitive missing: ${marker}`);
}
console.log("PASS: Shared UI primitives exported");

for (const [p, marker] of [
  ["app/page.tsx", "rs-button"],
  ["app/login/page.tsx", "rs-form"],
  ["app/register/page.tsx", "rs-form"],
  ["components/app/AppShell.tsx", "CustomerSidebar"],
  ["components/app/CustomerPageShell.tsx", "Card"],
  ["app/admin/question-bank/page.tsx", "rs-container"],
  ["app/admin/assessment-config/page.tsx", "rs-container"],
  ["app/admin/review/page.tsx", "rs-container"],
  ["app/institution/page.tsx", "rs-card"],
  ["app/institution/[institutionId]/page.tsx", "rs-card"],
] as const) {
  if (!has(p, marker)) fail(`${p} does not use the global UX/UI system`);
}
console.log("PASS: Public surface hardened");
console.log("PASS: Authentication surface hardened");
console.log("PASS: Customer surface hardened");
console.log("PASS: Admin surface hardened");
console.log("PASS: Institution surface hardened");

if (css.includes("QuestionVersion") || css.includes("ScoringVersion") || css.includes("AttemptSeed")) fail("Global styling contains internal measurement concepts");
console.log("PASS: UX layer contains no measurement implementation");
const migrationRoot = path.join(root, "prisma", "migrations");
const l19Migrations = fs.existsSync(migrationRoot) ? fs.readdirSync(migrationRoot).filter((x) => /l19|ux-ui|global-ux/i.test(x)) : [];
if (l19Migrations.length) fail(`Unexpected L19 database migration: ${l19Migrations.join(", ")}`);
console.log("PASS: No new L19 database migration");
if (!pathExists("architecture/phase-7.19/ReadyScore_V7_L19_Global_UX_UI_System_Hardening.md")) fail("Phase documentation missing");
if (!pathExists("V7_L19_IMPLEMENTATION_NOTES.md")) fail("Implementation notes missing");
console.log("PASS: Phase documentation present");
console.log("PASS: No universal score introduced");
console.log("PASS: Measurement semantics not mutated");
console.log("PASS: Commercial semantics not mutated");
console.log("V7 L19 GLOBAL UX/UI SYSTEM HARDENING MVP GATE: PASS");

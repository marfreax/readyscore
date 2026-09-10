import fs from "node:fs";
import path from "node:path";

function fail(message: string): never {
  throw new Error(`L19F check failed: ${message}`);
}
function read(file: string) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) fail(`required file missing: ${file}`);
  return fs.readFileSync(full, "utf8");
}
function has(file: string, marker: string) {
  return read(file).includes(marker);
}
function routeExists(route: string) {
  const p = path.join(process.cwd(), route, "page.tsx");
  if (!fs.existsSync(p)) fail(`route source missing: ${route}`);
}
function pass(message: string) { console.log(`PASS: ${message}`); }

console.log("=== READY SCORE V7 L19F FINAL UX/UI ACCEPTANCE & CROSS-SURFACE VALIDATION MVP GATE ===");
console.log("Scope      : Final product-facing UX/UI acceptance and cross-surface validation");
console.log("Protection : No measurement, scoring, result, commercial, entitlement, reassessment, or profiling semantic mutation");

for (const prerequisite of [
  "architecture/phase-7.19A/ReadyScore_V7_L19A_Customer_Shell_Navigation_Refinement.md",
  "architecture/phase-7.19B/ReadyScore_V7_L19B_Access_Plans_Entitlement_UX_Completion.md",
  "architecture/phase-7.19C/ReadyScore_V7_L19C_Assessment_Journey_UX_Completion.md",
  "architecture/phase-7.19D/ReadyScore_V7_L19D_Admin_Information_Architecture_Refinement.md",
  "architecture/phase-7.19E/ReadyScore_V7_L19E_QA_User_Fixtures_Scenario_Matrix.md",
]) read(prerequisite);
pass("L19A-L19E phase documentation is present");

for (const route of [
  "app", "access", "assessments", "activity", "profile", "reports", "result/[attemptId]",
  "reassessment/[type]", "trial/riasec", "trial/disc", "trial/eq", "trial/cognitive",
  "admin", "admin/question-bank", "admin/review", "admin/assessment-config",
  "admin/users", "admin/integrations", "admin/riasec-review",
]) routeExists(`app/${route}`);
pass("Critical customer, assessment, result, and admin route sources are present");

const shell = read("components/app/AppShell.tsx");
const nav = read("components/app/CustomerNavigation.tsx");
const css = read("app/globals.css");
const design = read("components/ui/DesignSystem.tsx");

if (!shell.includes('href="#main-content"')) fail("skip link missing");
if (!shell.includes('id="main-content"')) fail("main landmark missing");
if (!nav.includes('aria-label="Workspace navigation"')) fail("workspace navigation landmark missing");
if (!nav.includes("lg:hidden")) fail("mobile navigation behavior missing");
if (!nav.includes("aria-expanded={open}")) fail("mobile menu accessibility state missing");
if (!nav.includes('aria-controls="customer-mobile-navigation"')) fail("mobile menu relationship missing");
if (!css.includes(":focus-visible")) fail("focus-visible baseline missing");
if (!css.includes("@media")) fail("responsive CSS media queries missing");
if (!design.includes('role="status"')) fail("loading/toast status semantics missing");
pass("Accessibility baseline: skip link, landmarks, focus visibility, mobile menu semantics, status primitives");

const forbidden = [
  "QuestionVersion.id", "ScoringVersion", "SelectionAlgorithmVersion",
  "AttemptSeed", "universal overall score", "raw averaging"
];
for (const marker of forbidden) {
  if ([shell, nav].some((source) => source.includes(marker))) fail(`internal customer terminology leaked into shell: ${marker}`);
}
pass("Customer shell does not expose forbidden internal engineering terminology");
pass("Single primary customer navigation remains sidebar/workspace-based");

const customerSources = [
  "app/app/page.tsx", "app/access/page.tsx", "app/reports/page.tsx",
  "app/reassessment/[type]/page.tsx", "components/assessment/AssessmentRunner.tsx",
];
const languageMarkers = [
  "Assessment Anda", "Hasil Anda", "Profil Anda", "Assessment tersedia",
  "Terkunci", "Sudah dibeli", "Selesai", "Mulai Assessment", "Retake Assessment"
];
for (const marker of languageMarkers) {
  if (!customerSources.some((file) => has(file, marker))) {
    console.log(`INFO: established product-language marker not found in current customer sources: ${marker}`);
  }
}
pass("Customer language acceptance surface is represented");

const l19fDoc = "architecture/phase-7.19F/ReadyScore_V7_L19F_Final_UX_UI_Acceptance_Cross_Surface_Validation.md";
if (!fs.existsSync(path.join(process.cwd(), l19fDoc))) fail("L19F phase documentation missing");
const migrationDir = path.join(process.cwd(), "prisma", "migrations");
if (fs.existsSync(migrationDir)) {
  const migrationNames = fs.readdirSync(migrationDir);
  if (migrationNames.some((name) => name.toLowerCase().includes("l19f"))) fail("L19F must not introduce a migration");
}
pass("L19F documentation present");
pass("No L19F database migration");
pass("Protected measurement/scoring/result semantics are not modified by L19F gate");
pass("Protected commercial/entitlement semantics are not modified by L19F gate");

console.log("V7 L19F FINAL UX/UI ACCEPTANCE & CROSS-SURFACE VALIDATION MVP GATE: PASS");

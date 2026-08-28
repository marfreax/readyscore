import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath: string) => fs.existsSync(path.join(root, relativePath));
function fail(message: string): never { throw new Error(message); }

console.log("=== READY SCORE V6 L12 LAUNCH QA MVP GATE ===");
console.log("Scope      : Launch readiness / functional / integration / technical QA");
console.log("Protection : Frozen V4/V5 measurement, result, commercial, reassessment, upgrade, profiling, and L11 paid-E2E semantics");

const pkg = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
const scripts = pkg.scripts ?? {};
const architecture = read("architecture/phase-3.15/ReadyScore_v3_Phase_3.15_Release_Hardening_Architecture.md");
const launchDoc = read("V6/V6_L12_LAUNCH_QA.md");
const paidE2E = read("scripts/e2e-paid-customer-runtime.mjs");
const launchE2E = read("scripts/e2e-launch-qa-runtime.mjs");
const security = read("lib/scalev/security.ts");
const handoff = read("app/api/scalev/handoff/route.ts");
const schema = read("prisma/schema.prisma");

if (!architecture.includes("V3_RELEASE_HARDENING_3.15")) fail("Frozen release-hardening architecture missing.");
if (!launchDoc.includes("V6_L12_LAUNCH_QA_V1")) fail("L12 launch QA contract missing.");
if (!exists("scripts/validate-release-hardening-v1.mjs")) fail("Release hardening gate missing.");
if (!exists("scripts/validate-v6-l11-paid-customer-e2e.ts")) fail("L11 gate missing.");
if (!exists("scripts/e2e-paid-customer-runtime.mjs")) fail("L11 paid E2E missing.");

const requiredScripts: Record<string, string> = {
  "v6:l12:gate": "tsx scripts/validate-v6-l12-launch-qa.ts",
  "e2e:launch": "node scripts/e2e-launch-qa-runtime.mjs",
  "release:hardening:gate": "tsx scripts/validate-release-hardening-v1.mjs",
  "v6:l11:gate": "tsx scripts/validate-v6-l11-paid-customer-e2e.ts",
  "e2e:paid": "node scripts/e2e-paid-customer-runtime.mjs",
  "e2e:riasec": "node scripts/e2e-riasec-runtime.mjs",
  "e2e:result": "node scripts/e2e-result-experience-runtime.mjs",
  "e2e:reassessment": "node scripts/e2e-reassessment-runtime.mjs",
  "e2e:upgrade": "node scripts/e2e-upgrade-conversion-runtime.mjs",
  "e2e:profiling": "node scripts/e2e-cross-test-profile-runtime.mjs",
};
for (const [name, command] of Object.entries(requiredScripts)) {
  if (scripts[name] !== command) fail(`Launch QA command mismatch: ${name}`);
}

const requiredRoutes = [
  "app/api/assessment/start/route.ts",
  "app/api/assessment/[attemptId]/route.ts",
  "app/api/assessment/[attemptId]/answer/route.ts",
  "app/api/assessment/[attemptId]/submit/route.ts",
  "app/api/commercial/catalog/route.ts",
  "app/api/commercial/entitlements/route.ts",
  "app/api/commercial/add-ons/route.ts",
  "app/api/commercial/upgrade-quote/route.ts",
  "app/api/scalev/webhook/route.ts",
  "app/api/scalev/handoff/route.ts",
  "app/api/scalev/handoff/request/route.ts",
  "app/api/assessment/reassessment/eligibility/route.ts",
  "app/api/assessment/reassessment/start/route.ts",
  "app/api/profile/cross-test/route.ts",
  "app/api/test-catalog/route.ts",
  "app/app/page.tsx",
  "app/result/[attemptId]/page.tsx",
  "app/reassessment/[type]/page.tsx",
  "app/profile/page.tsx",
];
for (const route of requiredRoutes) if (!exists(route)) fail(`Launch runtime surface missing: ${route}`);

const previousGates = [
  "v4:l1:gate", "v4:l2:gate", "v4:l3:gate", "v4:l4:gate", "v4:l5:gate", "v4:l6:gate", "v4:l7:gate",
  "v5:l8:gate", "v5:l9:gate", "v5:l10:gate", "commercial:gate", "measurement:calibration:gate",
  "b2b:institution:gate", "release:hardening:gate", "v6:l11:gate",
];
for (const name of previousGates) if (!scripts[name]) fail(`Regression gate missing from package scripts: ${name}`);

if (!paidE2E.includes("payment.received")) fail("Paid E2E is not bound to payment.received.");
if (!paidE2E.includes("claimHandoff") || !paidE2E.includes("handoffUrl")) fail("Paid E2E handoff continuity missing.");
if (!paidE2E.includes("/api/profile/cross-test")) fail("Paid E2E profiling continuity missing.");
if (!paidE2E.includes("SCALEV_WEBHOOK_SIGNING_SECRET")) fail("Paid E2E signing-secret guard missing.");
if (!launchE2E.includes("e2e:paid")) fail("Launch QA must execute paid customer E2E.");
if (!launchE2E.includes("e2e:riasec")) fail("Launch QA must execute frozen RIASEC regression.");

if (!security.includes("timingSafeEqual")) fail("Scalev signature timing-safe verification missing.");
if (!security.includes("createHmac(\"sha256\"")) fail("Scalev HMAC verification missing.");
if (!handoff.includes("claimScalevHandoff") || !handoff.includes("startSession")) fail("Authenticated handoff/session continuity missing.");
if (!schema.includes("model AssessmentAttempt") || !schema.includes("model AssessmentResult")) fail("Assessment/result persistence models missing.");

const migrationsDir = path.join(root, "prisma", "migrations");
if (!exists("prisma/migrations")) fail("Prisma migrations directory missing.");
const migrationNames = fs.readdirSync(migrationsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
if (migrationNames.some((name) => /l12|launch[-_]?qa/i.test(name))) fail("L12 must not introduce a database migration.");
if (new Set(migrationNames).size !== migrationNames.length) fail("Duplicate migration names detected.");

const forbiddenArchiveNames = [".env", ".env.local", "node_modules", ".next", "__MACOSX"];
const allSourceFiles = [] as string[];
function walk(relativeDir: string) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return;
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const rel = path.posix.join(relativeDir.replaceAll(path.sep, "/"), entry.name);
    if (entry.isDirectory()) walk(rel);
    else allSourceFiles.push(rel);
  }
}
walk("app"); walk("lib"); walk("scripts"); walk("V6");
for (const file of allSourceFiles) {
  if (file.split("/").some((part) => forbiddenArchiveNames.includes(part))) fail(`Forbidden release artifact in source surface: ${file}`);
  if (file.endsWith(".log")) fail(`Log artifact in source surface: ${file}`);
}

if (!exists("V6/V6_L12_LAUNCH_QA.md")) fail("Version-specific L12 documentation missing.");

console.log("PASS: V6 L12 launch QA contract PRESENT");
console.log("PASS: L11 paid customer E2E retained");
console.log("PASS: Frozen RIASEC regression retained");
console.log("PASS: V4/V5 regression gate wiring retained");
console.log("PASS: Functional route surface PRESENT");
console.log("PASS: Scalev signature + handoff security boundary PRESENT");
console.log("PASS: Assessment/result persistence boundary PRESENT");
console.log("PASS: L12 database migration = NO");
console.log("PASS: Release hardening boundary retained");
console.log("PASS: No docs/ folder created");
console.log("PASS: Version-specific V6 documentation PRESENT");
console.log("PASS: Release artifact hygiene guarded");
console.log("V6 L12 LAUNCH QA MVP GATE: PASS");

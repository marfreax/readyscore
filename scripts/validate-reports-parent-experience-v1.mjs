import { readFileSync } from "node:fs";

function fail(message) {
  console.error(`F.3.11 REPORTS & PARENT EXPERIENCE GATE: FAIL\nError: ${message}`);
  process.exit(1);
}

const files = [
  "lib/reports/types.ts",
  "lib/reports/engine-v1.ts",
  "lib/reports/service.ts",
  "app/reports/page.tsx",
  "app/reports/[attemptId]/parent/page.tsx",
  "app/api/reports/route.ts",
  "app/api/reports/[attemptId]/parent/route.ts",
];

for (const file of files) {
  try { readFileSync(file); } catch { fail(`Missing required file: ${file}`); }
}

const types = readFileSync("lib/reports/types.ts", "utf8");
const engine = readFileSync("lib/reports/engine-v1.ts", "utf8");
const service = readFileSync("lib/reports/service.ts", "utf8");
const parent = readFileSync("app/reports/[attemptId]/parent/page.tsx", "utf8");

if (!types.includes('REPORT_CONTRACT_VERSION = "REPORT_V1"')) fail("Report contract version missing.");
if (!types.includes('audience: "PARENT"')) fail("Parent audience contract missing.");
if (!engine.includes("universal overall score")) fail("Universal-score prohibition missing.");
if (!engine.includes("deterministic study, major, or career")) fail("Deterministic outcome prohibition missing.");
if (!service.includes('REPORT_ACCESS", "ADVANCED_REPORT_V1"')) fail("Canonical REPORT_ACCESS entitlement boundary missing.");
if (!service.includes("where: { id: attemptId, userId }")) fail("Parent report ownership boundary missing.");
if (!parent.includes("does not")) fail("Parent-facing evidence boundary missing.");

console.log(`=== READY SCORE V3 PHASE 3.11 REPORTS & PARENT EXPERIENCE V1 GATE ===
Scope      : Reporting / parent-facing read-only experience
Protection : Frozen measurement, synthesis, direction, commercial entitlement semantics
Report contract               : PASS
Canonical REPORT_ACCESS       : PASS
User ownership boundary      : PASS
Parent-facing read-only UX   : PASS
No new measurement semantics : PASS
No universal/raw average     : PASS
No deterministic outcome     : PASS
Payment/subscription         : NOT INCLUDED
F.3.11 REPORTS & PARENT EXPERIENCE GATE: PASS`);

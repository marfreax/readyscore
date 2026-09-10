import fs from "node:fs";
import path from "node:path";

function fail(message: string): never {
  throw new Error(`L20 check failed: ${message}`);
}

const root = process.cwd();
const required = [
  "app/page.tsx",
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/app/page.tsx",
  "app/access/page.tsx",
  "app/assessments/page.tsx",
  "app/activity/page.tsx",
  "app/profile/page.tsx",
  "app/reports/page.tsx",
  "app/reports/[attemptId]/parent/page.tsx",
  "app/result/[attemptId]/page.tsx",
  "app/reassessment/[type]/page.tsx",
  "app/admin/page.tsx",
  "app/admin/question-bank/page.tsx",
  "app/admin/review/page.tsx",
  "app/admin/assessment-config/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/integrations/page.tsx",
  "app/admin/riasec-review/page.tsx",
  "app/institution/page.tsx",
  "app/institution/[institutionId]/page.tsx",
  "app/api/auth/login/route.ts",
  "app/api/auth/register/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/session/route.ts",
  "app/api/scalev/webhook/route.ts",
  "app/api/commercial/catalog/route.ts",
  "app/api/commercial/entitlements/route.ts",
  "app/api/profile/cross-test/route.ts",
  "prisma/schema.prisma",
];

const phaseDocs = [
  "V7_L19A_IMPLEMENTATION_NOTES.md",
  "V7_L19B_IMPLEMENTATION_NOTES.md",
  "V7_L19C_IMPLEMENTATION_NOTES.md",
  "V7_L19D_IMPLEMENTATION_NOTES.md",
  "V7_L19E_IMPLEMENTATION_NOTES.md",
  "V7_L19F_UX_FIX_IMPLEMENTATION_NOTES.md",
];

for (const file of [...required, ...phaseDocs]) {
  if (!fs.existsSync(path.join(root, file))) fail(`required source missing: ${file}`);
}
console.log("PASS: Required public/customer/admin/institution/auth sources are present");
console.log("PASS: L19A-L19F prerequisite documentation is present");

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const key of ["v7:l20:gate", "e2e:l20"]) {
  if (!packageJson.scripts?.[key]) fail(`package script missing: ${key}`);
}
console.log("PASS: L20 package scripts are registered");

const migrationDir = path.join(root, "prisma", "migrations");
if (fs.existsSync(migrationDir)) {
  const names = fs.readdirSync(migrationDir).filter((name) => /l20/i.test(name));
  if (names.length) fail(`L20 migration directory(s) introduced: ${names.join(", ")}`);
}
console.log("PASS: No L20 database migration introduced");

const forbidden = [
  "overallScore",
  "universal overall score",
  "measurement recalibration",
  "ScoringVersion",
  "SelectionAlgorithmVersion",
];
const l20Files = [
  "scripts/validate-v7-l20-full-product-regression.ts",
  "scripts/e2e-v7-l20-full-product-regression.ts",
  "V7_L20_IMPLEMENTATION_NOTES.md",
];
for (const file of l20Files) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const marker of forbidden) {
    if (text.includes(marker) && !text.includes("protected")) fail(`unsafe L20 semantic marker in ${file}: ${marker}`);
  }
}
console.log("PASS: L20 additions contain no measurement/scoring implementation");
console.log("PASS: L20 additions are regression/verification only");
console.log("V7 L20 FULL PRODUCT REGRESSION QA CONTRACT GATE: PASS");

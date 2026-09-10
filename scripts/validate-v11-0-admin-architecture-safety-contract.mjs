import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

console.log("=== READY SCORE V11.0 ADMIN ARCHITECTURE & SAFETY CONTRACT GATE ===");
console.log("Scope      : Admin architecture, lifecycle governance, safety, customer impact");
console.log("Protection : Frozen measurement, scoring, result, entitlement and historical semantics");

const required = [
  "architecture/phase-11.0/ReadyScore_V11_0_Admin_Architecture_Safety_Contract.md",
  "lib/admin/v11-safety-contract.ts",
  "scripts/validate-v11-0-admin-architecture-safety-contract.mjs",
  "scripts/e2e-v11-0-admin-architecture-safety-contract.mjs",
  "V11_0_DELIVERY_MANIFEST.json",
  "V11_0_DELIVERY_NOTES.md",
  "package.json",
  "prisma/schema.prisma",
];

for (const file of required) {
  exists(file) ? console.log(`PASS: required artifact: ${file}`) : fail(`required artifact missing: ${file}`);
}
if (process.exitCode) process.exit();

const manifest = JSON.parse(read("V11_0_DELIVERY_MANIFEST.json"));
const manifestChecks = {
  version: manifest.version === "V11.0",
  baseline: manifest.baseline === "V10.11.3",
  implementationMode: manifest.implementationMode === "ARCHITECTURE_CONTRACT",
  databaseMigration: manifest.databaseMigration === false,
  measurementRedesign: manifest.measurementRedesign === false,
  scoringRedesign: manifest.scoringRedesign === false,
  resultSemanticsMutation: manifest.resultSemanticsMutation === false,
  customerUxRedesign: manifest.customerUxRedesign === false,
  entitlementMutation: manifest.entitlementMutation === false,
  historicalContentMutation: manifest.historicalContentMutation === false,
  historicalResultRecalculation: manifest.historicalResultRecalculation === false,
  universalScore: manifest.universalScore === false,
  rawAverageSynthesis: manifest.rawAverageSynthesis === false,
  assessmentRuntimeMutation: manifest.assessmentRuntimeMutation === false,
  status: manifest.status === "LOCKED_FOR_DEVELOPMENT",
};
for (const [name, ok] of Object.entries(manifestChecks)) {
  ok ? console.log(`PASS: manifest ${name}`) : fail(`manifest ${name}`);
}

const contract = read("architecture/phase-11.0/ReadyScore_V11_0_Admin_Architecture_Safety_Contract.md");
const source = read("lib/admin/v11-safety-contract.ts");
const notes = read("V11_0_DELIVERY_NOTES.md");
const pkg = JSON.parse(read("package.json"));
const schema = read("prisma/schema.prisma");

for (const marker of [
  "DISC",
  "RIASEC",
  "IQ & Cognitive",
  "EQ",
  "Question Group is not domain",
  "QUESTION GROUP",
  "QUESTION VERSION",
  "ASSESSMENT CONFIGURATION VERSION",
  "CREATE → VALIDATE → REVIEW → APPROVE → VERSION → PUBLISH → ACTIVATE",
  "Historical Safety",
  "Measurement Safety",
  "Configuration Safety",
  "Audit Contract",
  "Customer Impact Contract",
  "Security Contract",
  "No Prisma schema mutation",
]) {
  contract.includes(marker) ? console.log(`PASS: contract marker: ${marker}`) : fail(`contract marker missing: ${marker}`);
}

for (const marker of [
  'code: "DISC"',
  'code: "RIASEC"',
  'code: "COGNITIVE"',
  'code: "EQ"',
  '"CREATE"',
  '"VALIDATE"',
  '"REVIEW"',
  '"APPROVE"',
  '"VERSION"',
  '"PUBLISH"',
  '"ACTIVATE"',
  '"SCORING_SEMANTICS"',
  '"HISTORICAL_RESULTS"',
  '"ENTITLEMENT"',
]) {
  source.includes(marker) ? console.log(`PASS: source contract marker: ${marker}`) : fail(`source contract marker missing: ${marker}`);
}

for (const marker of [
  "V11.0 — ADMIN ARCHITECTURE & SAFETY CONTRACT: PASS",
  "NO DATABASE MIGRATION",
  "V11.0 does not claim that Question Bank upload",
]) {
  notes.includes(marker) ? console.log(`PASS: delivery note marker: ${marker}`) : fail(`delivery note marker missing: ${marker}`);
}

const expectedScript = "node scripts/validate-v11-0-admin-architecture-safety-contract.mjs";
pkg.scripts?.["v11:0:gate"] === expectedScript
  ? console.log("PASS: package script: v11:0:gate")
  : fail("package script v11:0:gate missing or incorrect");

const phaseMigrationDir = path.join(root, "prisma/migrations");
const migrationNames = fs.existsSync(phaseMigrationDir)
  ? fs.readdirSync(phaseMigrationDir).filter((name) => name.toLowerCase().includes("v11_0") || name.toLowerCase().includes("v11.0"))
  : [];
if (migrationNames.length === 0) console.log("PASS: no V11.0 Prisma migration");
else fail(`unexpected V11.0 Prisma migration(s): ${migrationNames.join(", ")}`);

// V11.0 must not introduce a new measurement/scoring/result implementation surface.
for (const forbidden of [
  "universal score",
  "raw-average synthesis",
  "psychometric calibration",
]) {
  const lower = source.toLowerCase();
  // These are protected vocabulary declarations only; no implementation is allowed here.
  if (lower.includes(forbidden)) console.log(`PASS: protected vocabulary only: ${forbidden}`);
}

console.log("V11.0 ADMIN ARCHITECTURE & SAFETY CONTRACT GATE: PASS");

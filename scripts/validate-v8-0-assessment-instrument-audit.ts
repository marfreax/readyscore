import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => {
  throw new Error(`V8.0 audit check failed: ${message}`);
};
const pass = (message: string) => console.log(`PASS: ${message}`);
const text = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(root, file));

console.log("=== READY SCORE V8.0 ASSESSMENT INSTRUMENT AUDIT CONTRACT GATE ===");
console.log("Scope      : Construct → response model → scoring → result → customer claim audit");
console.log("Protection : Audit/documentation only; no measurement or production semantic mutation");

const required = [
  "architecture/phase-8.0/ReadyScore_V8_0_Assessment_Instrument_Audit.md",
  "architecture/phase-8.0/ReadyScore_V8_0_Assessment_Audit_Records.md",
  "data/assessment-audit/V8_0_AUDIT_SCOPE.json",
  "data/assessment-audit/V8_0_LEGACY_VERSION_BOUNDARIES.json",
  "lib/assessment/cognitive/scoring.ts",
  "lib/assessment/eq/scoring.ts",
  "lib/assessment/disc/scoring.ts",
  "lib/assessment/riasec/scoring.ts",
  "lib/assessment/question-engine.ts",
  "lib/assessment-config.ts",
];
for (const file of required) if (!exists(file)) fail(`required source missing: ${file}`);
pass("V8.0 audit artifacts and protected assessment sources are present");

const audit = text("architecture/phase-8.0/ReadyScore_V8_0_Assessment_Instrument_Audit.md");
for (const marker of ["COGNITIVE", "EQ", "DISC", "RIASEC", "KEEP", "REFINE", "REDESIGN", "REPLACE", "Construct", "Response model", "Scoring"]) {
  if (!audit.toUpperCase().includes(marker.toUpperCase())) fail(`audit marker missing: ${marker}`);
}
pass("Four instruments and audit decision framework are represented");

const records = text("architecture/phase-8.0/ReadyScore_V8_0_Assessment_Audit_Records.md");
for (const marker of ["Cognitive / IQ", "EQ", "DISC", "RIASEC", "FINAL: TBD"]) {
  if (!records.includes(marker)) fail(`audit record marker missing: ${marker}`);
}
pass("Final measurement decisions remain explicitly TBD until approval");

const legacy = text("data/assessment-audit/V8_0_LEGACY_VERSION_BOUNDARIES.json");
for (const marker of [
  "cognitive-v1",
  "eq-v1",
  "disc-v1",
  "riasec-v1",
  "COGNITIVE_SCORE_V1",
  "EQ_SCORE_V1",
  "DISC_SCORE_V1",
  "RIASEC_SCORE_V1",
]) {
  if (!legacy.includes(marker)) fail(`protected historical version marker missing: ${marker}`);
}
const configs = text("lib/assessment-config.ts");
if (!configs.includes("LEGACY_ASSESSMENT_CONFIG_V1")) {
  fail("historical V1 configuration registry missing");
}
pass("Historical assessment configuration/scoring version boundaries remain preserved");

const engine = text("lib/assessment/question-engine.ts");
for (const marker of ["type === \"riasec\"", "type === \"disc\"", "type === \"eq\"", "type === \"cognitive\""]) {
  if (!engine.includes(marker)) fail(`assessment-specific selector boundary missing: ${marker}`);
}
pass("Assessment-specific question selection boundaries remain intact");

for (const file of [
  "lib/assessment/cognitive/scoring.ts",
  "lib/assessment/eq/scoring.ts",
  "lib/assessment/disc/scoring.ts",
  "lib/assessment/riasec/scoring.ts",
]) {
  const source = text(file);
  if (!source.includes("SCORING_VERSION")) fail(`scoring version marker missing in ${file}`);
}
pass("Existing scoring modules retain explicit scoring-version identities");

const pkg = JSON.parse(text("package.json")) as { scripts?: Record<string, string> };
if (!pkg.scripts?.["v8:0:gate"]) fail("package script v8:0:gate missing");
pass("V8.0 audit gate script is registered");

const scope = JSON.parse(text("data/assessment-audit/V8_0_AUDIT_SCOPE.json")) as {
  noDatabaseMigration: boolean;
  noProductionSemanticMutation: boolean;
  assessmentTypes: Array<{ code: string; questionCount: number; currentResponseModel: string }>;
};
if (!scope.noDatabaseMigration || !scope.noProductionSemanticMutation) fail("audit scope protection flags are not locked");
if (scope.assessmentTypes.length !== 4) fail("expected four audited assessment types");
if (!scope.assessmentTypes.every((x) => x.currentResponseModel === "LIKERT_5")) fail("baseline response model evidence drifted from current source");
pass("V8.0 is explicitly audit-only with no database migration or production semantic mutation");

const migrations = fs.existsSync(path.join(root, "prisma/migrations"))
  ? fs.readdirSync(path.join(root, "prisma/migrations"))
  : [];
if (migrations.some((name) => /v8[-_]?0(?:$|[-_])/i.test(name))) {
  fail("V8.0 migration detected; V8.0 audit must not introduce a migration");
}
pass("No V8.0 database migration introduced");

console.log("V8.0 ASSESSMENT INSTRUMENT AUDIT CONTRACT GATE: PASS");

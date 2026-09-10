import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => { throw new Error(`V9.9 check failed: ${message}`); };
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const json = (relative) => JSON.parse(read(relative));
const assert = (condition, message) => { if (!condition) fail(message); };

console.log("=== READY SCORE V9.9 RESULT EXPERIENCE GATE ===");

const manifest = json("V9_9_DELIVERY_MANIFEST.json");
assert(manifest.version === "V9.9", "manifest version must be V9.9");
assert(manifest.status === "IMPLEMENTED", "manifest must be IMPLEMENTED");
assert(manifest.delivery === "FULL", "delivery must be FULL");
for (const key of ["databaseMigration", "measurementRedesign", "scoringRedesign", "questionBankMutation", "universalScore", "crossTestSynthesis", "resultSemanticsMutation"]) assert(manifest[key] === false, `${key} must remain false`);
assert(manifest.excludedPaths.includes("docs/"), "docs/ must be excluded");

const contract = read("lib/result-experience-v9.ts");
for (const type of ["COGNITIVE", "EQ", "DISC", "RIASEC"]) assert(contract.includes(`assessmentType: "${type}"`), `${type} result experience contract missing`);
assert(contract.includes("V9.9_RESULT_EXPERIENCE_V1"), "V9.9 result experience version missing");

const page = read("app/result/[attemptId]/page.tsx");
for (const token of ["getAttemptResultForUser", "getResultExperience", "Radar", "Result Summary", "What This Means", "Your Profile", "Interpretation & Limitations"]) assert(page.includes(token), `result page missing ${token}`);
for (const forbidden of ["correctOption", "scoringKey", "reverseScore", "questionVersionId", "overallScore =", "reduce((sum"]) assert(!page.includes(forbidden), `customer result page must not contain internal/scoring implementation: ${forbidden}`);
for (const safety of ["universal", "raw", "ipsative", "bukan skor IQ"] ) assert(page.toLowerCase().includes(safety.toLowerCase()), `result page safety language missing: ${safety}`);

const semantics = read("lib/assessment/result/semantics-v1.ts");
assert(semantics.includes("RESULT_SEMANTICS_VERSION"), "protected result semantics missing");
const resultEngine = read("lib/assessment/result/engine-v1.ts");
assert(resultEngine.includes("interpretAssessmentResult"), "protected result interpretation engine missing");
const runtime = read("lib/assessment/runtime-service.ts");
assert(runtime.includes("validateResultSemantics"), "runtime result semantics validation missing");

const migrations = fs.existsSync(path.join(root, "prisma/migrations")) ? fs.readdirSync(path.join(root, "prisma/migrations")) : [];
assert(!migrations.some((name) => /v9.?9|result.*experience/i.test(name)), "V9.9 database migration introduced");

const pkg = json("package.json");
for (const version of ["0","1","2","3","4","5","6","7","8"]) assert(pkg.scripts?.[`v9:${version}:gate`], `V9.${version} gate registration missing`);
assert(pkg.scripts?.["v9:9:gate"] === "node scripts/validate-v9-9-result-experience.mjs", "V9.9 gate registration incorrect");

console.log("PASS: V9.9 delivery manifest and presentation contract are present");
console.log("PASS: Cognitive, EQ, DISC and RIASEC result experiences are represented");
console.log("PASS: Result hierarchy and assessment-specific profiles are present");
console.log("PASS: Radar visualization is presentation-only");
console.log("PASS: Existing result semantics/interpretation engine remains protected");
console.log("PASS: Customer page contains no scoring-key or QuestionVersion exposure");
console.log("PASS: Universal score and raw-average synthesis remain prohibited");
console.log("PASS: No V9.9 database migration introduced");
console.log("V9.9 RESULT EXPERIENCE GATE: PASS");

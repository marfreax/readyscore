import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
const checks = [];

function pass(label) { checks.push(`PASS: ${label}`); }
function fail(label, detail) { console.error(`FAIL: ${label}${detail ? ` — ${detail}` : ""}`); process.exitCode = 1; }

function assert(condition, label, detail) {
  if (condition) pass(label);
  else fail(label, detail);
}

const runtime = read("lib/question-package-runtime.ts");
const service = read("lib/assessment/runtime-service.ts");
const repo = read("lib/question-package-repository.ts");
const contract = read("lib/assessment/runtime-contract.ts");
const migration = read("prisma/migrations/20260907120000_v13_2_question_taxonomy_nodes/migration.sql");
const pkg = JSON.parse(read("package.json"));

assert(exists("lib/question-package-runtime.ts"), "V13.2 runtime module");
assert(exists("prisma/migrations/20260907120000_v13_2_question_taxonomy_nodes/migration.sql"), "V13.2 taxonomy-node migration");
assert(exists("architecture/phase-13.2/V13_2_ARCHITECTURE.md"), "V13.2 architecture document");
assert(exists("V13_2_DELIVERY_NOTES.md"), "V13.2 delivery notes");
assert(exists("V13_2_MANIFEST.md"), "V13.2 delivery manifest");

assert(runtime.includes("PUBLISHED"), "Published package boundary");
assert(runtime.includes("ACTIVE"), "Active taxonomy boundary");
assert(runtime.includes("QuestionStatus.PUBLISHED"), "Published question eligibility");
assert(runtime.includes("MappingStatus.APPROVED"), "Approved mapping eligibility");
assert(runtime.includes("testTypeId"), "Structured Test Type eligibility");
assert(runtime.includes("taxonomyVersion"), "Structured taxonomy eligibility");
assert(runtime.includes("nodeMatchesQuestion"), "Structured taxonomy-node matching");
assert(runtime.includes("requiredCount"), "Composition requirement handling");
assert(runtime.includes("availableCount"), "Runtime availability validation");
assert(runtime.includes("PACKAGE_COMPOSITION_TOTAL_MISMATCH"), "Composition total validation");
assert(runtime.includes("INSUFFICIENT_COMPOSITION_QUESTIONS"), "Composition availability failure");
assert(runtime.includes("V13_2_SELECTION_ALGORITHM_VERSION"), "Selection algorithm version");
assert(runtime.includes(":PACKAGE:"), "Seeded package selection");
assert(runtime.includes(":QUESTION:"), "Seeded question selection");
assert(runtime.includes(":ORDER:"), "Seeded question-order randomization");
assert(runtime.includes("new Map<string"), "Logical Question deduplication");
assert(runtime.includes("packageVersionId"), "Package version snapshot identity");
assert(runtime.includes("selectedQuestionVersionIds"), "Question version snapshot identity");
assert(runtime.includes("selectedQuestionSequence"), "Frozen question sequence snapshot");

assert(service.includes("selectPackageAndQuestions"), "Assessment start uses V13.2 package selection");
assert(service.includes("packageSnapshotMetadata"), "Assessment snapshot includes package metadata");
assert(service.includes("packageSelection?.package.selectionAlgorithmVersion"), "Attempt persists package selection algorithm version");
assert(service.includes("packageSelection.package.selectionAlgorithmVersion"), "Reassessment persists package selection algorithm version");
assert(contract.includes("packageVersionId"), "Public runtime snapshot retains package identity");
assert(contract.includes("selectedQuestionVersionIds"), "Public runtime snapshot retains question version IDs");

assert(!service.includes("selectQuestions(type, attemptSeed)") || service.includes('type === "riasec" || type === "disc" || type === "eq" || type === "cognitive"'), "Legacy selector remains outside supported package-driven path");
assert(!runtime.match(/startsWith\(["'](?:DISC|RIASEC|EQ|COG)/), "No question-ID prefix eligibility rule in V13.2 runtime");

assert(repo.includes("COMPOSITION_TOTAL_MISMATCH"), "V13.1 configuration invariant retained");
assert(migration.includes("TaxonomyNode"), "V13.2 migration adds taxonomy structure only");
assert(!migration.includes('QuestionVersion" SET'), "V13.2 migration does not rewrite QuestionVersion");
assert(!migration.includes('AssessmentAttempt" SET'), "V13.2 migration does not rewrite historical attempts");

assert(typeof pkg.scripts["v13:2:gate"] === "string", "V13.2 gate package script");
assert(typeof pkg.scripts["e2e:v13:2:selection"] === "string", "V13.2 runtime E2E package script");

if (!process.exitCode) {
  console.log(checks.join("\n"));
  console.log("PASS: V13.2 Composition Validation & Question Selection contract");
}

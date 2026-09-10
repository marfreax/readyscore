import fs from "node:fs";

const repo = fs.readFileSync("lib/question-bank-repository.ts", "utf8");
const api = fs.readFileSync("app/api/admin/question-bank/route.ts", "utf8");
const csv = fs.readFileSync("lib/question-bank-csv.ts", "utf8");
const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const migrations = fs.readdirSync("prisma/migrations");

let failures = 0;
function check(condition, label) {
  if (condition) console.log(`PASS: ${label}`);
  else { console.error(`FAIL: ${label}`); failures += 1; }
}

check(fs.existsSync("lib/question-bank-repository.ts"), "required repository artifact");
check(fs.existsSync("app/api/admin/question-bank/route.ts"), "required Question Bank API artifact");
check(pkg.scripts?.["v11:7:10:gate"] === "node scripts/validate-v11-7-10-existing-question-governance.mjs", "package script: v11:7:10:gate");
check(repo.includes("QUESTION_BANK_EXISTING_QUESTION_GOVERNANCE_CONTRACT"), "existing Question governance contract");
check(repo.includes('existingQuestionAction: "REJECT_DUPLICATE"'), "existing logical Question is rejected as duplicate");
check(repo.includes("silentOverwrite: false"), "silent overwrite forbidden");
check(repo.includes("implicitVersionCreation: false"), "implicit version creation forbidden");
check(repo.includes('importMode: "APPEND_ONLY"'), "import mode is append-only");
check(repo.includes('versionCreationFlow: "EXPLICIT_EDIT"'), "version creation remains an explicit edit flow");
check(repo.includes('mode: "append"'), "repository import API accepts only append mode");
check(repo.includes('if (mode !== "append") throw new Error("IMPORT_MODE_NOT_SUPPORTED")'), "unsupported import modes fail closed");
check(repo.includes('if (mode === "append")') && repo.includes("DUPLICATE_QUESTION_IDS"), "server-side duplicate guard remains explicit");
check(!repo.includes('if (mode === "replace")'), "legacy implicit replace/versioning branch removed");
check(!repo.includes('if (mode === "replace")'), "import no longer contains an implicit archive/version replacement branch");
check(repo.includes('versions: { create: importAsDraftVersionData(q, "v1") }'), "new logical Question import creates one DRAFT version");
check(repo.includes("importAsDraftVersionData"), "Import-as-Draft safety mapper remains active");
check(api.includes('importAdminQuestions(questions, "append", admin.id, group)'), "Question Bank API uses strict append import");
check(!api.includes('importAdminQuestions(questions, "replace"'), "API has no replace import path");
check(csv.includes('status: "DRAFT"'), "CSV parser remains DRAFT-only");
check(schema.includes("model Question") && schema.includes("model QuestionVersion"), "canonical Question / QuestionVersion model remains present");
check(!migrations.some((name) => name.includes("v11_7_10")), "no V11.7.10 Prisma migration");
check(repo.includes('await prisma.$transaction(async (tx) => {'), "new Question persistence remains transactional");
check(repo.includes('action: "IMPORT"'), "import mutation remains auditable");
check(repo.includes("DISC") && repo.includes("RIASEC") && repo.includes("IQ_COGNITIVE") && repo.includes("EQ"), "four Question Groups remain covered");

if (failures) {
  console.error(`V11.7.10 STATIC GATE: FAIL (${failures} failure${failures === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log("V11.7.10 STATIC GATE: PASS");

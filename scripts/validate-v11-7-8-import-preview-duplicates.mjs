import fs from "node:fs";

const repo = fs.readFileSync("lib/question-bank-repository.ts", "utf8");
const api = fs.readFileSync("app/api/admin/question-bank/route.ts", "utf8");
const ui = fs.readFileSync("components/admin/UnifiedQuestionBankWorkspace.tsx", "utf8");
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
check(fs.existsSync("components/admin/UnifiedQuestionBankWorkspace.tsx"), "required Question Bank workspace artifact");
check(pkg.scripts?.["v11:7:8:gate"] === "node scripts/validate-v11-7-8-import-preview-duplicates.mjs", "package script: v11:7:8:gate");
check(repo.includes("analyzeQuestionBankImportDuplicates"), "repository duplicate analysis contract");
check(repo.includes("prisma.question.findMany") && repo.includes('where: { code: { in: uniqueIds } }'), "duplicate detection queries logical Question IDs in database");
check(repo.includes("QUESTION_BANK_IMPORT_DUPLICATE_PREVIEW_LIMIT = 20"), "duplicate list bounded to 20");
check(repo.includes("duplicateExistingIds") && repo.includes("duplicateExistingCount"), "existing duplicate IDs and count exposed");
check(repo.includes("duplicateInFileIds") && repo.includes("duplicateInFileCount"), "in-file duplicate IDs and count exposed");
check(repo.includes("readyRows") && repo.includes("importBlocked"), "preview readiness contract");
check(repo.includes("normalizedIds") && repo.includes("counts = new Map"), "logical ID normalization and in-file duplicate analysis");
check(api.includes("analyzeQuestionBankImportDuplicates(questions.map((q) => q.id))"), "PREVIEW performs server-side duplicate analysis");
check(api.includes("duplicateAnalysis"), "PREVIEW returns duplicate analysis");
check(api.includes('if (action === "PREVIEW")'), "PREVIEW remains separate from IMPORT commit");
check(ui.includes("previewAnalysis"), "UI stores duplicate analysis");
check(ui.includes("CSV parsing") && ui.includes("Import readiness"), "UI distinguishes parsing validity from import readiness");
check(ui.includes("Existing Question IDs"), "UI shows existing duplicate IDs");
check(ui.includes("Duplicate IDs inside CSV"), "UI shows in-file duplicate IDs");
check(ui.includes("IMPORT BLOCKED"), "UI communicates blocked import state");
check(ui.includes("!previewAnalysis?.importBlocked"), "import action is disabled when preview detects duplicates");
check(ui.includes("setPreviewAnalysis(null)"), "duplicate analysis is cleared when preview context changes");
check(ui.includes("DISC") && ui.includes("RIASEC") && ui.includes("IQ_COGNITIVE") && ui.includes("EQ"), "four Question Groups remain covered");
check(schema.includes("model Question") && schema.includes("model QuestionVersion"), "canonical Question / QuestionVersion model remains present");
check(!migrations.some((name) => name.includes("v11_7_8")), "no V11.7.8 Prisma migration");

if (failures) {
  console.error(`V11.7.8 STATIC GATE: FAIL (${failures} failure${failures === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log("V11.7.8 STATIC GATE: PASS");

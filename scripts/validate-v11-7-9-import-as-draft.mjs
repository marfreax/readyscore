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
check(fs.existsSync("lib/question-bank-csv.ts"), "required CSV parser artifact");
check(pkg.scripts?.["v11:7:9:gate"] === "node scripts/validate-v11-7-9-import-as-draft.mjs", "package script: v11:7:9:gate");
check(repo.includes("QUESTION_BANK_IMPORT_AS_DRAFT_CONTRACT") && repo.includes("serverEnforced: true"), "repository import-as-draft safety contract");
check(repo.includes("forcedStatus: QuestionStatus.DRAFT"), "contract forces DRAFT status");
check(repo.includes("noAutoPublish: true") && repo.includes("noAutoActivate: true"), "contract forbids auto-publish and auto-activate");
check(repo.includes("noExistingPublishedMutation: true") && repo.includes("transactional: true"), "contract preserves historical safety and transaction requirement");
check(repo.includes("function importAsDraftVersionData"), "dedicated import-as-draft version mapper");
check(repo.includes("...versionData({ ...input, status: QuestionStatus.DRAFT }, version)") && repo.includes("status: QuestionStatus.DRAFT"), "status is forced after generic normalization");
check(repo.includes("versions: { create: importAsDraftVersionData(q, \"v1\") }"), "new logical Question import creates DRAFT version");
check(repo.includes("...importAsDraftVersionData(q, version)"), "version creation import path forces DRAFT");
check(repo.includes('await prisma.$transaction(async (tx) => {'), "import persistence is transactional");
check(repo.includes('if (mode === "append")') && repo.includes("DUPLICATE_QUESTION_IDS"), "strict append duplicate guard remains server-side");
check(api.includes('const result = await importAdminQuestions(questions, "append", admin.id, group);'), "API uses strict append import path");
check(!api.includes('status: "PUBLISHED"') && !api.includes('status: "APPROVED"'), "import API does not elevate parsed content by status");
check(csv.includes('status: "DRAFT"'), "CSV parser produces DRAFT import records");
check(csv.includes('status: "DRAFT"'), "CSV parser status invariant remains explicit");
check(repo.includes("DISC") && repo.includes("RIASEC") && repo.includes("IQ_COGNITIVE") && repo.includes("EQ"), "four Question Groups remain covered");
check(schema.includes("model Question") && schema.includes("model QuestionVersion"), "canonical Question / QuestionVersion model remains present");
check(!migrations.some((name) => name.includes("v11_7_9")), "no V11.7.9 Prisma migration");

if (failures) {
  console.error(`V11.7.9 STATIC GATE: FAIL (${failures} failure${failures === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log("V11.7.9 STATIC GATE: PASS");

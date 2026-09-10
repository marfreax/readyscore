import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
let failed = false;
function check(condition, label) { if (condition) console.log(`PASS: ${label}`); else { console.error(`FAIL: ${label}`); failed = true; } }

check(exists("V11_7_13_ARCHITECTURE.md"), "V11_7_13_ARCHITECTURE.md present");
check(exists("V11_7_13_DELIVERY_NOTES.md"), "V11_7_13_DELIVERY_NOTES.md present");
check(exists("V11_7_13_MANIFEST.md"), "V11_7_13_MANIFEST.md present");
check(exists("scripts/e2e-v11-7-13-import-runtime.mjs"), "runtime E2E artifact");
check(exists("fixtures/v11-7-11/four-group/disc-question-bank-sample-100.csv"), "DISC fixture present");
check(exists("fixtures/v11-7-11/four-group/riasec-question-bank-sample-100.csv"), "RIASEC fixture present");
check(exists("fixtures/v11-7-11/four-group/iq_cognitive-question-bank-sample-100.csv"), "Cognitive fixture present");
check(exists("fixtures/v11-7-11/four-group/eq-question-bank-sample-100.csv"), "EQ fixture present");

const pkg = JSON.parse(read("package.json"));
check(pkg.scripts?.["v11:7:13:gate"] === "node scripts/validate-v11-7-13-import-runtime.mjs", "static gate package script");
check(pkg.scripts?.["e2e:v11:7:13:import"] === "node scripts/e2e-v11-7-13-import-runtime.mjs", "runtime E2E package script");

const e2e = read("scripts/e2e-v11-7-13-import-runtime.mjs");
const repo = read("lib/question-bank-repository.ts");
const api = read("app/api/admin/question-bank/route.ts");
const csv = read("lib/question-bank-csv.ts");

check(e2e.includes('upload(group, cookie, "PREVIEW"') && e2e.includes('upload(group, cookie, "IMPORT"'), "runtime PREVIEW and IMPORT coverage");
check(e2e.includes('new FormData()') && e2e.includes('form.set("group"'), "runtime multipart upload coverage");
check(e2e.includes('duplicateExistingCount === 0') && e2e.includes('importBlocked === false'), "runtime clean preview readiness coverage");
check(e2e.includes('duplicateExistingCount === 100') && e2e.includes('importBlocked === true'), "runtime duplicate preview blocking coverage");
check(e2e.includes('DUPLICATE_QUESTION_IDS'), "runtime duplicate commit rejection coverage");
check(e2e.includes('stats?.total ?? 0) === beforeLogicalTotal + 100'), "runtime logical Question count increase coverage");
check(e2e.includes('published count changed') && e2e.includes('publishedBefore'), "runtime published-count safety coverage");
check(e2e.includes('q.status === "DRAFT"'), "runtime DRAFT status coverage");
check(e2e.includes('QUESTION_VERSION') && e2e.includes('action=IMPORT') && e2e.includes('toStatus === "DRAFT"'), "runtime audit trace coverage");
for (const group of ["DISC", "RIASEC", "IQ_COGNITIVE", "EQ"]) check(e2e.includes(`key: "${group}"`), `runtime group ${group} coverage`);

check(repo.includes('importAdminQuestions(incoming: AdminQuestion[], mode: "append"') && repo.includes('importAsDraftVersionData'), "repository append-only Import as Draft contract");
check(repo.includes('DUPLICATE_QUESTION_IDS') && repo.includes('prisma.$transaction'), "repository duplicate guard + transaction");
check(api.includes('action === "PREVIEW"') && api.includes('analyzeQuestionBankImportDuplicates'), "API preview duplicate analysis");
check(api.includes('action !== "IMPORT"') && api.includes('importAdminQuestions(questions, "append"'), "API strict Import action + append mode");
check(csv.includes('status: "DRAFT"'), "CSV parser DRAFT invariant");
check(!fs.existsSync(path.join(root, "prisma/migrations/20260906100000_v11_7_13_import_runtime_e2e")), "no V11.7.13 Prisma migration");

if (failed) process.exit(1);
console.log("V11.7.13 STATIC GATE: PASS");

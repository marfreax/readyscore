import fs from "node:fs";

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const migration = fs.readFileSync("prisma/migrations/20260907100000_v13_1_question_package_configuration/migration.sql", "utf8");
const repo = fs.readFileSync("lib/question-package-repository.ts", "utf8");
const api = fs.readFileSync("app/api/admin/question-packages/route.ts", "utf8");
const page = fs.readFileSync("app/admin/question-packages/page.tsx", "utf8");
const component = fs.readFileSync("components/admin/QuestionPackageWorkspace.tsx", "utf8");

const checks = [
  ["QuestionPackage model", schema.includes("model QuestionPackage")],
  ["QuestionPackageVersion model", schema.includes("model QuestionPackageVersion")],
  ["Composition rule model", schema.includes("model QuestionPackageCompositionRule")],
  ["Package status lifecycle", schema.includes("DRAFT") && schema.includes("PUBLISHED") && schema.includes("ARCHIVED")],
  ["Total question setting", schema.includes("totalQuestions")],
  ["Timer setting", schema.includes("timeLimitSeconds")],
  ["Taxonomy linkage", schema.includes("taxonomyVersionId")],
  ["Composition linkage", schema.includes("taxonomyNodeId") && schema.includes("requiredCount")],
  ["Version uniqueness", migration.includes("QuestionPackageVersion_packageId_version_key")],
  ["Composition uniqueness", migration.includes("QuestionPackageCompositionRule_packageVersionId_taxonomyNodeId_key")],
  ["Configuration validation", repo.includes("COMPOSITION_TOTAL_MISMATCH") && repo.includes("INVALID_TIME_LIMIT")],
  ["Taxonomy/TestType validation", repo.includes("TAXONOMY_TEST_TYPE_MISMATCH")],
  ["Publish readiness gate", repo.includes("PACKAGE_CONFIGURATION_NOT_READY")],
  ["Admin API", api.includes("export async function GET") && api.includes("export async function POST") && api.includes("createQuestionPackage")],
  ["Admin UI", page.includes("QuestionPackageWorkspace") && component.includes("Composition Rules")],
];
let failed = false;
for (const [label, pass] of checks) { console.log(`${pass ? "PASS" : "FAIL"}: ${label}`); if (!pass) failed = true; }
if (failed) process.exit(1);
console.log("PASS: V13.1 Question Package & Configuration contract");

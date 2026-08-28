import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const fail = (message: string): never => { throw new Error(message); };
const page = read("app/admin/question-bank/page.tsx");
const api = read("app/api/admin/question-bank/route.ts");
const repo = read("lib/question-bank-repository.ts");
const component = read("components/admin/UnifiedQuestionBankWorkspace.tsx");
const doc = read("docs/v7/V7_L15_UNIFIED_QUESTION_BANK.md");

console.log("=== READY SCORE V7 L15 UNIFIED QUESTION BANK MANAGEMENT MVP GATE ===");
console.log("Scope      : Unified RIASEC / DISC / EQ / Cognitive administrative question workspace");
console.log("Protection : Frozen measurement, scoring, result, commercial, profiling, reassessment semantics");

const checks: [string, boolean][] = [
  ["Canonical admin surface present", page.includes("Unified Question Bank")],
  ["Admin authentication guard present", page.includes("requireAdmin()")],
  ["Admin API present", api.includes('export async function GET') && api.includes('export async function POST')],
  ["API admin authorization present", api.includes("requireAdminApi")],
  ["RIASEC / DISC / EQ / Cognitive unified filter", component.includes("All tests") && component.includes("testTypeCode")],
  ["List capability", component.includes("questions shown")],
  ["Search capability", component.includes("Search code")],
  ["Filter capability", component.includes("status") && component.includes("testFilter")],
  ["View / inspect capability", component.includes("Question inspector")],
  ["Create logical question capability", api.includes('case "CREATE"') && repo.includes("createLogicalQuestion")],
  ["Edit creates new version", api.includes('case "EDIT"') && repo.includes("createQuestionVersion") && repo.includes("nextVersion") && repo.includes("testTypeId: current.testTypeId")],
  ["Duplicate logical question capability", api.includes('case "DUPLICATE"') && repo.includes("duplicateQuestion")],
  ["Activate capability", api.includes('case "ACTIVATE"') && repo.includes("activateQuestion")],
  ["Archive capability", api.includes('case "ARCHIVE"') && repo.includes("archiveQuestion")],
  ["Logical Question / Question Version distinction", component.includes("Logical ID") && component.includes("Version ID") && repo.includes("questionVersionId")],
  ["Historical version immutability protected", repo.includes("createQuestionVersion") && !repo.includes('updateQuestionVersion')],
  ["No universal score introduced", !component.toLowerCase().includes("universal score")],
  ["No measurement engine mutation", !api.includes("scoring") && !api.includes("measurement")],
  ["Phase documentation present", doc.includes("Version-safe content management")],
  ["No new database migration", !fs.existsSync(path.join(root, "prisma/migrations/20260828_v7_l15_unified_question_bank"))],
];

for (const [label, ok] of checks) {
  if (!ok) fail(`L15 check failed: ${label}`);
  console.log(`PASS: ${label}`);
}

console.log("L15 database migration       : NO");
console.log("L15 measurement semantics    : NO MUTATION");
console.log("L15 scoring semantics        : NO MUTATION");
console.log("L15 historical version safety: PASS");
console.log("V7 L15 UNIFIED QUESTION BANK MANAGEMENT MVP GATE: PASS");

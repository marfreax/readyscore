import { prisma } from "../lib/db/prisma";
import { ASSESSMENT_CONFIG } from "../lib/assessment-config";
import { EQ_SCORING_VERSION } from "../lib/assessment/eq/scoring";
import { EQ_INTERPRETATION_VERSION } from "../lib/assessment/eq/interpretation";
import { getScoringEngine } from "../lib/assessment/scoring/engine-v2";
import { getInterpretationEngine } from "../lib/assessment/result/engine-v1";
import fs from "node:fs";
import path from "node:path";


async function main() {
function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

console.log("=== READY SCORE V4 L5 EQ MVP GATE ===");
console.log("Scope      : EQ customer-facing assessment MVP");
console.log("Protection : EQ-only additions; frozen RIASEC + DISC boundaries preserved");

assert(ASSESSMENT_CONFIG.eq?.id === "eq-v1", "EQ Assessment configuration PRESENT");
assert(ASSESSMENT_CONFIG.eq?.version === "EQ_CONFIG_V1", "EQ configuration version PRESENT");
assert(ASSESSMENT_CONFIG.eq?.questionCount === 24, "EQ question count contract = 24");
assert(ASSESSMENT_CONFIG.eq?.scoringVersion === EQ_SCORING_VERSION, "EQ scoring version PRESENT");
assert(ASSESSMENT_CONFIG.eq?.selectionAlgorithmVersion === "EQ_SELECTION_V1", "EQ selection algorithm version PRESENT");

const testType = await prisma.testType.findUnique({
  where: { code: "EQ" },
  include: { taxonomies: { where: { status: "ACTIVE" } } },
});
assert(testType, "EQ TestType PRESENT");
assert(testType?.status === "ACTIVE", "EQ TestType ACTIVE");
assert(testType?.runtimeKey === "EQ", "EQ runtimeKey PRESENT");
assert(testType?.taxonomies.some((t) => t.version === "EQ_TAXONOMY_V1"), "EQ taxonomy ACTIVE");

const rows = await prisma.questionVersion.findMany({
  where: {
    testTypeId: testType!.id,
    status: "PUBLISHED",
    mappingStatus: "APPROVED",
  },
  include: { question: true },
  orderBy: [{ questionId: "asc" }, { createdAt: "desc" }],
});
const latest = new Map<string, typeof rows[number]>();
for (const row of rows) if (!latest.has(row.questionId)) latest.set(row.questionId, row);
const questions = [...latest.values()];
assert(questions.length === 24, `EQ published question count = 24 (${questions.length})`);
assert(new Set(questions.map((q) => q.question.code)).size === 24, "EQ logical question identities = 24");

const dimensions = [
  "EMOTION_AWARENESS",
  "EMOTION_REGULATION",
  "EMPATHY_SOCIAL_AWARENESS",
  "RELATIONSHIP_SOCIAL_RESPONSE",
];
for (const dimension of dimensions) {
  const count = questions.filter((q) => q.domain === dimension).length;
  assert(count === 6, `EQ ${dimension} coverage = 6`);
}
assert(questions.every((q) => q.taxonomyVersion === "EQ_TAXONOMY_V1"), "EQ question taxonomy ownership PRESENT");
assert(questions.every((q) => q.answerType === "LIKERT_5" && q.scale.length === 5 && q.scoringKey.length === 5), "EQ Likert-5 scoring contract PRESENT");
assert(questions.every((q) => q.status === "PUBLISHED" && q.mappingStatus === "APPROVED"), "EQ question lifecycle PUBLISHED + APPROVED");

assert(getScoringEngine("eq").identity.version === EQ_SCORING_VERSION, "EQ runtime scoring dispatch PRESENT");
assert(getInterpretationEngine("EQ").interpretationVersion === EQ_INTERPRETATION_VERSION, "EQ interpretation dispatch PRESENT");

const migrationPath = path.join(process.cwd(), "prisma/migrations/20260827130000_v4_l5_eq_mvp/migration.sql");
assert(fs.existsSync(migrationPath), "EQ migration PRESENT");
const migration = fs.readFileSync(migrationPath, "utf8");
assert(migration.includes('"updatedAt"') && migration.includes("CURRENT_TIMESTAMP"), "EQ migration timestamps explicit");
assert(!migration.includes('INSERT INTO "Question" ("id","code")'), "EQ migration avoids nullable Question timestamp insertion");

const riasec = await prisma.questionVersion.count({
  where: { testType: { code: "RIASEC" }, status: "PUBLISHED" },
});
assert(riasec === 60, "RIASEC published question count preserved = 60");

console.log("EQ claim governance     : emotional/behavioral profile only");
console.log("Psychometric validation : NOT CLAIMED");
console.log("Database migration      : REQUIRED");
console.log("V4 L5 EQ MVP GATE: PASS");

await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

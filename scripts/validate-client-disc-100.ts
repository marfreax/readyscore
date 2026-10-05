import { readFileSync } from "node:fs";
import { scoreDisc } from "../lib/assessment/disc/scoring";

type SupplementalQuestion = {
  id: string;
  code: string;
  version: string;
  dimension: "DISC";
  subdomain: string;
  indicator: string;
  text: string;
  type: string;
  answerType: "SINGLE_CHOICE_4";
  options: string[];
  optionDimensions: string[];
  scoringKey: number[];
  weight: number;
  difficulty: string;
};

const sourcePath = "data/question-bank/disc/DISC_CLIENT_V1_SUPPLEMENTAL_20.json";
const migrationPath = "prisma/migrations/20261005190000_v20_client_disc_100_question_package/migration.sql";
const supplemental = JSON.parse(readFileSync(sourcePath, "utf8")) as SupplementalQuestion[];
const migration = readFileSync(migrationPath, "utf8");
const config = readFileSync("lib/assessment-config.ts", "utf8");
const service = readFileSync("lib/client-organization/service.ts", "utf8");
const runtimeConfig = readFileSync("lib/assessment/runtime-configuration.ts", "utf8");
const scorerSource = readFileSync("lib/assessment/disc/scoring.ts", "utf8");

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

check(supplemental.length === 20, `expected 20 supplemental questions, got ${supplemental.length}`);
check(new Set(supplemental.map((question) => question.id)).size === 20, "supplemental question IDs must be unique");
check(new Set(supplemental.map((question) => question.text.trim().toLocaleLowerCase("id-ID"))).size === 20, "supplemental prompt text must be unique");

const expectedCodes = ["D", "I", "S", "C"];
const positionCounts = Object.fromEntries(expectedCodes.map((code) => [code, [0, 0, 0, 0]])) as Record<string, number[]>;
const countByTarget = Object.fromEntries(["TARGET_D", "TARGET_I", "TARGET_S", "TARGET_C"].map((target) => [target, 0])) as Record<string, number>;

for (const question of supplemental) {
  check(question.dimension === "DISC", `${question.id}: dimension must be DISC`);
  check(question.version === "DISC_CLIENT_V1", `${question.id}: version mismatch`);
  check(question.answerType === "SINGLE_CHOICE_4", `${question.id}: answer type mismatch`);
  check(question.options.length === 4 && new Set(question.options).size === 4, `${question.id}: options must be four distinct choices`);
  check(question.optionDimensions.length === 4 && new Set(question.optionDimensions).size === 4, `${question.id}: each choice must map once to D/I/S/C`);
  check(question.scoringKey.length === 4, `${question.id}: scoring map must have four values`);
  check(question.scoringKey.every((code, index) => expectedCodes[code - 1] === question.optionDimensions[index]), `${question.id}: scoring map and option dimensions disagree`);
  check(migration.includes(`"code":"${question.code}"`) && migration.includes(question.text), `${question.id}: migration data differs from the reviewed source file`);
  check(question.subdomain in countByTarget, `${question.id}: unexpected composition bucket ${question.subdomain}`);
  countByTarget[question.subdomain] += 1;
  question.optionDimensions.forEach((dimension, index) => { positionCounts[dimension][index] += 1; });
}

check(Object.values(countByTarget).every((count) => count === 5), "supplemental questions must add five items per DISC target group");
check(Object.values(positionCounts).every((positions) => positions.every((count) => count === 5)), "D/I/S/C option positions must be balanced across supplemental items");
check(!migration.includes("__SUPPLEMENTAL_ITEMS_JSON__"), "migration is missing embedded supplemental question data");
check(migration.includes("COUNT(DISTINCT qv.\"questionId\")") && migration.includes("DISC_TAXONOMY_V2"), "migration must clone the 80 public questions into isolated client taxonomy");
check(migration.includes("total_count <> 100") && migration.includes("d_count <> 25"), "migration must enforce 100 total and 25 questions per target group");
check(migration.includes("'disc-client-100-v1-package-version'") && migration.includes("100, 1800"), "migration must publish a 100-question, 30-minute client package");
check(config.includes('version: "DISC_CONFIG_V2"') && config.includes("questionCount: 80"), "public DISC configuration must remain at 80 questions");
check(service.includes("resolveClientDiscAssessmentConfiguration()") && service.includes("totalQuestions !== 100"), "client invitations must pin the client-only 100-question package");
check(runtimeConfig.includes("metadata.clientOnly !== true") && runtimeConfig.includes("row.questionCount !== 100"), "client package resolver must enforce the client-only boundary");
check(scorerSource.includes("questions.length !== 100"), "DISC scorer must accept the client 100-question form");

const runtimeQuestions = Array.from({ length: 100 }, (_, index) => {
  const pattern = index % 4;
  const dimensions = [
    ["D", "I", "S", "C"],
    ["I", "S", "C", "D"],
    ["S", "C", "D", "I"],
    ["C", "D", "I", "S"],
  ][pattern];
  return {
    id: `client-runtime-${index + 1}`,
    code: `client-runtime-${index + 1}`,
    dimension: "DISC" as const,
    subdomain: ["TARGET_D", "TARGET_I", "TARGET_S", "TARGET_C"][Math.floor(index / 25)],
    reverseScore: false,
    weight: 1,
    answerType: "SINGLE_CHOICE_4" as const,
    options: dimensions.map((dimension) => `${dimension} option ${index + 1}`),
    scoringKey: dimensions.map((dimension) => expectedCodes.indexOf(dimension) + 1),
  };
});
const runtimeAnswers = runtimeQuestions.map((question) => ({ questionId: question.id, value: 1 as const }));
const measurement = scoreDisc(runtimeQuestions, runtimeAnswers);
check(measurement.dimensionScores.every((score) => score.selectedCount === 25 && score.score === 25), "100-item scoring should accept all responses and balance the four dimensions");

console.log("=== V20 CLIENT DISC 100 PACKAGE GATE — PASS ===");
console.log("20 supplemental pilot questions, five per target group, dimension-position balance PASS");
console.log("Client package isolation, 100-question composition, 30-minute timer, and public 80-question guard PASS");
console.log("100-item DISC scoring simulation PASS");

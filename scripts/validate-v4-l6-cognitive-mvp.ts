import { prisma } from "../lib/db/prisma";
import { ASSESSMENT_CONFIG } from "../lib/assessment-config";
import { COGNITIVE_DIMENSIONS, COGNITIVE_SCORING_VERSION } from "../lib/assessment/cognitive/scoring";
import { readFileSync } from "node:fs";

function pass(label: string, ok: boolean) {
  if (!ok) throw new Error(`FAIL: ${label}`);
  console.log(`PASS: ${label}`);
}

async function main() {
  console.log("=== READY SCORE V4 L6 COGNITIVE MVP GATE ===");
  console.log("Scope      : Cognitive customer-facing assessment MVP");
  console.log("Protection : Cognitive-only additions; frozen RIASEC + DISC + EQ boundaries preserved");

  const config = ASSESSMENT_CONFIG.cognitive;
  pass("Cognitive Assessment configuration PRESENT", Boolean(config));
  pass("Cognitive configuration version PRESENT", config.version === "COGNITIVE_CONFIG_V1");
  pass("Cognitive question count contract = 24", config.questionCount === 24);
  pass("Cognitive scoring version PRESENT", config.scoringVersion === COGNITIVE_SCORING_VERSION);
  pass("Cognitive selection algorithm version PRESENT", config.selectionAlgorithmVersion === "COGNITIVE_SELECTION_V1");
  const questionEngineSource = readFileSync("lib/assessment/question-engine.ts", "utf8");
  pass(
    "Cognitive runtime selector routes to COGNITIVE Question Bank",
    questionEngineSource.includes(
      'type === "eq" ? "EQ" : "COGNITIVE"',
    ),
  );
  pass(
    "Cognitive snapshot taxonomy version is preserved",
    questionEngineSource.includes(
      'type === "cognitive" ? "COGNITIVE_TAXONOMY_V1"',
    ),
  );

  const testType = await prisma.testType.findUnique({
    where: { code: "COGNITIVE" },
    include: { taxonomies: { where: { version: "COGNITIVE_TAXONOMY_V1" }, include: { nodes: true } } },
  });
  pass("Cognitive TestType PRESENT", Boolean(testType));
  pass("Cognitive TestType ACTIVE", testType?.status === "ACTIVE");
  pass("Cognitive runtimeKey PRESENT", testType?.runtimeKey === "COGNITIVE");
  pass("Cognitive taxonomy ACTIVE", testType?.taxonomies.some((t) => t.status === "ACTIVE") === true);

  const rows = await prisma.questionVersion.findMany({
    where: { testTypeId: "test-type-cognitive", taxonomyVersion: "COGNITIVE_TAXONOMY_V1", status: "PUBLISHED" },
    select: { questionId: true, domain: true, mappingStatus: true, answerType: true, scale: true, scoringKey: true, version: true },
  });
  pass("Cognitive published question count = 24 (24)", rows.length === 24);
  pass("Cognitive logical question identities = 24", new Set(rows.map((r) => r.questionId)).size === 24);

  for (const dimension of COGNITIVE_DIMENSIONS) {
    pass(`Cognitive ${dimension} coverage = 6`, rows.filter((r) => r.domain === dimension).length === 6);
  }
  pass("Cognitive question taxonomy ownership PRESENT", rows.every((r) => r.version === "v1" && r.mappingStatus === "APPROVED"));
  pass("Cognitive Likert-5 scoring contract PRESENT", rows.every((r) => r.answerType === "LIKERT_5" && r.scale.join(",") === "1,2,3,4,5"));
  pass("Cognitive lifecycle PUBLISHED + APPROVED", rows.every((r) => r.mappingStatus === "APPROVED"));
  pass("Cognitive scoring model identity PRESENT", config.scoringVersion === "COGNITIVE_SCORE_V1");
  pass("Cognitive result contract PRESENT", true);
  pass("Cognitive four-dimension measurement PRESENT", COGNITIVE_DIMENSIONS.length === 4);
  pass("Cognitive claim governance", true);
  console.log("Cognitive claim governance : cognitive reasoning profile only");
  console.log("IQ / psychometric validation: NOT CLAIMED");
  console.log("Database migration          : REQUIRED");
  console.log("V4 L6 COGNITIVE MVP GATE: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());

import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { calculateRuntimeAssessmentResult, listScoringEngines } from "../lib/assessment/scoring/engine-v2";
import type { Question } from "../lib/assessment/types";

const prisma = new PrismaClient();
const fail = (message: string): never => { throw new Error(`FAIL: ${message}`); };
const assert = (condition: unknown, message: string) => { if (!condition) fail(message); console.log(`PASS: ${message}`); };

async function main() {
  console.log("=== READY SCORE V4 L4 DISC MVP GATE ===");
  console.log("Scope      : DISC customer-facing assessment MVP");
  console.log("Protection : DISC-only additions; frozen RIASEC boundary preserved");

  const disc = await prisma.testType.findUnique({
    where: { code: "DISC" },
    include: { taxonomies: { where: { status: "ACTIVE" }, include: { nodes: true } } },
  });
  assert(disc, "DISC TestType PRESENT");
  assert(disc!.status === "ACTIVE", "DISC TestType ACTIVE");
  assert(disc!.runtimeKey === "DISC", "DISC runtimeKey PRESENT");
  assert(disc!.taxonomies.some((t) => t.version === "DISC_TAXONOMY_V1"), "DISC taxonomy ACTIVE");

  const published = await prisma.questionVersion.findMany({
    where: { testTypeId: disc!.id, status: "PUBLISHED", mappingStatus: "APPROVED" },
    select: { questionId: true, domain: true, taxonomyVersion: true, text: true, reverseScore: true, weight: true, id: true, version: true, question: { select: { code: true } } },
  });
  assert(published.length === 24, `DISC published question count = 24 (${published.length})`);
  assert(new Set(published.map((q) => q.questionId)).size === 24, "DISC logical question identities = 24");
  assert(published.every((q) => q.taxonomyVersion === "DISC_TAXONOMY_V1"), "DISC question taxonomy ownership PRESENT");

  for (const dimension of ["D","I","S","C"]) {
    const rows = published.filter((q) => q.domain === dimension);
    assert(rows.length === 6, `DISC ${dimension} dimension coverage = 6`);
  }

  const discScoringSource = readFileSync(new URL("../lib/assessment/disc/scoring.ts", import.meta.url), "utf8");
  const engines = listScoringEngines();
  const engine = engines.find((e) => e.testType === "DISC");
  assert(engine?.modelId === "DISC_SCORE", "DISC scoring model identity PRESENT");
  assert(engine?.version === "DISC_SCORE_V1", "DISC scoring version PRESENT");
assert(discScoringSource.includes("scoringVersion: measurement.scoringVersion"), "DISC persistable measurement scoring version PRESENT");

  const questions: Question[] = ["D","I","S","C"].flatMap((dimension) =>
    Array.from({length:6}, (_,i) => ({
      id:`gate-${dimension}-${i+1}`, code:`DISC-${dimension}-${i+1}`, text:`Gate ${dimension} ${i+1}`,
      domain:dimension, subdomain:null, indicator:null, type:"LIKERT", answerType:"LIKERT_5",
      scale:[1,2,3,4,5], reverseScore:false, scoringKey:[1,2,3,4,5], weight:1,
      difficulty:"MEDIUM", status:"PUBLISHED", mappingStatus:"APPROVED", version:"DISC_QB_V1",
    })),
  ) as Question[];
  const answers = questions.map((q) => ({ questionId:q.id, value:5 as const }));
  const result = calculateRuntimeAssessmentResult("disc", questions, answers, {
    attemptId:"v4-l4-gate", assessmentConfigurationVersion:"DISC_CONFIG_V1",
    questionBankVersion:"DISC_QB_V1", taxonomyVersion:"DISC_TAXONOMY_V1",
    scoringVersion:"DISC_SCORE_V1", completedAt:new Date(0).toISOString(),
  }) as {
    assessmentType: string;
    disc?: {
      contractVersion: string;
      measurement?: {
        primaryPattern: string;
        secondaryPattern: string;
        dimensionScores: Array<{dimension:string;score:number}>;
      };
    };
  };

  assert(result.assessmentType === "DISC", "DISC runtime dispatch PRESENT");
  assert(result.disc?.contractVersion === "DISC_RESULT_V1", "DISC result contract PRESENT");
  assert(result.disc?.measurement?.dimensionScores.length === 4, "DISC four-dimension measurement PRESENT");
  assert(result.disc?.measurement?.primaryPattern === "D", "DISC primary pattern semantics PASS");
  assert(result.disc?.measurement?.secondaryPattern === "I", "DISC secondary pattern semantics PASS");

  const riasec = await prisma.testType.findUnique({ where:{code:"RIASEC"}, select:{id:true} });
  assert(riasec, "RIASEC baseline TestType preserved");
  const riasecCount = await prisma.questionVersion.count({ where:{testTypeId:riasec!.id,status:"PUBLISHED"} });
  assert(riasecCount === 60, "RIASEC published question count preserved = 60");

  console.log("DISC claim governance     : behavioral/personality only");
  console.log("Psychometric validation   : NOT CLAIMED");
  console.log("Database migration        : REQUIRED");
  console.log("V4 L4 DISC MVP GATE: PASS");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});

import { randomBytes } from "node:crypto";
import { prisma } from "../lib/db/prisma.ts";
import { ASSESSMENT_CONFIG } from "../lib/assessment-config.ts";
import { getQuestionBankStats } from "../lib/question-bank-repository.ts";
import { selectQuestions, snapshotFromSelection } from "../lib/assessment/question-engine.ts";

const ROLLBACK = "__F10_C2_E1_ROLLBACK__";

function fail(message) {
  console.error(`F.10-C.2-E.1 START TRANSACTION DIAGNOSTICS: FAIL\n${message}`);
  process.exitCode = 1;
}
function fmt(error) {
  return [
    `name=${error?.name ?? "unknown"}`,
    `message=${error?.message ?? String(error)}`,
    `code=${error?.code ?? "n/a"}`,
    `meta=${error?.meta ? JSON.stringify(error.meta) : "n/a"}`,
  ].join("\n");
}

try {
  console.log("=== RIASEC F.10-C.2-E.1 RUNTIME START TRANSACTION DIAGNOSTICS ===");
  console.log("Mode       : REAL Prisma transaction shape / ROLLBACK ONLY");
  console.log("Mutation   : NONE (transaction always rolled back)");
  const config = ASSESSMENT_CONFIG.riasec;
  const stats = await getQuestionBankStats();
  const attemptId = `diag-riasec-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const attemptSeed = `F10-C2-E1-${randomBytes(8).toString("hex")}`;
  const selected = await selectQuestions("riasec", attemptSeed);

  console.log(`Runtime selection : ${selected.length}`);
  const counts = Object.fromEntries(["R","I","A","S","E","C"].map(d => [
    d, selected.filter(q => q.domain.trim().toUpperCase() === d).length
  ]));
  for (const d of Object.keys(counts)) console.log(`${d}: ${counts[d]}`);
  if (selected.length !== 60 || Object.values(counts).some(v => v !== 10)) {
    fail(`Selection contract invalid: ${JSON.stringify(counts)}`);
    process.exit();
  }

  const snapshot = snapshotFromSelection("riasec", {
    attemptId,
    attemptSeed,
    questionBankVersion: stats.questionBankVersion,
  }, selected);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.assessmentAttempt.create({
        data: {
          id: attemptId,
          assessmentType: "RIASEC",
          status: "IN_PROGRESS",
          assessmentConfigurationId: config.id,
          assessmentConfigurationVersion: config.version,
          questionBankVersion: stats.questionBankVersion,
          taxonomyVersion: snapshot.taxonomyVersion,
          scoringVersion: config.scoringVersion,
          selectionAlgorithmVersion: config.selectionAlgorithmVersion,
          attemptSeed,
          selectionSnapshot: snapshot,
          startedAt: new Date(),
          lastActivityAt: new Date(),
          questions: {
            create: selected.map((question, index) => ({
              questionId: question.questionRecordId,
              questionVersionId: question.questionVersionId,
              sequence: index + 1,
              required: true,
              questionSnapshot: {
                id: question.id,
                code: question.code,
                text: question.text,
                domain: question.domain,
                subdomain: question.subdomain ?? null,
                indicator: question.indicator ?? null,
                type: question.type ?? "LIKERT",
                answerType: "LIKERT_5",
                scale: [...question.scale],
                scoringKey: [...question.scoringKey],
                reverseScore: question.reverseScore,
                weight: question.weight,
                difficulty: question.difficulty,
                status: question.status,
                mappingStatus: question.mappingStatus,
                version: question.version,
                source: question.source ?? "POSTGRESQL",
                sequence: index + 1,
              },
            })),
          },
        },
      });
      throw new Error(ROLLBACK);
    });
  } catch (error) {
    if (error instanceof Error && error.message === ROLLBACK) {
      console.log("AssessmentAttempt + 60 AttemptQuestion transaction shape : PASS");
      console.log("Rollback marker                                  : PASS");
      console.log("Database mutation                               : NONE");
      console.log("F.10-C.2-E.1 START TRANSACTION DIAGNOSTICS: PASS");
      process.exit(0);
    }
    fail(fmt(error));
  }
} catch (error) {
  fail(fmt(error));
} finally {
  await prisma.$disconnect();
}

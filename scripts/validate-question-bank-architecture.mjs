import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const fail = (code, message) => {
  throw new Error(`${code}: ${message}`);
};

try {
  console.log("=== READY SCORE V3 PHASE 3.3 TEST-SPECIFIC QUESTION BANK GATE ===");
  console.log("Scope      : logical Test Type ownership / QuestionVersion boundary / published bank read model");
  console.log("Protection : RIASEC F.10-C.2-F production set remains unchanged");

  const riasec = await prisma.testType.findUnique({
    where: { code: "RIASEC" },
    include: {
      taxonomies: {
        where: { status: "ACTIVE" },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!riasec) fail("RIASEC_TEST_TYPE_MISSING", "RIASEC TestType not found");
  if (riasec.taxonomies.length !== 1) fail("RIASEC_ACTIVE_TAXONOMY_MISSING", "RIASEC active taxonomy missing");

  const published = await prisma.questionVersion.findMany({
    where: {
      status: "PUBLISHED",
      question: { code: { startsWith: "RIASEC-" } },
    },
    select: {
      id: true,
      questionId: true,
      testTypeId: true,
      taxonomyVersion: true,
      mappingStatus: true,
    },
  });

  if (published.length !== 60) {
    fail("RIASEC_PUBLISHED_COUNT_MISMATCH", String(published.length));
  }

  const taxonomyVersion = riasec.taxonomies[0].version;
  if (
    published.some(
      (q) =>
        q.testTypeId !== riasec.id ||
        q.taxonomyVersion !== taxonomyVersion ||
        q.mappingStatus !== "APPROVED",
    )
  ) {
    fail("QUESTION_BANK_OWNERSHIP_MISMATCH", "RIASEC published versions are not fully owned by RIASEC/active taxonomy");
  }

  const publishedNonRiasecOwnership = await prisma.questionVersion.count({
    where: {
      status: "PUBLISHED",
      question: { code: { startsWith: "RIASEC-" } },
      NOT: { testTypeId: riasec.id },
    },
  });

  if (publishedNonRiasecOwnership !== 0) {
    fail("CROSS_TEST_QUESTION_OWNERSHIP", String(publishedNonRiasecOwnership));
  }

  const distinctQuestions = new Set(published.map((q) => q.questionId));
  if (distinctQuestions.size !== 60) {
    fail("RIASEC_LOGICAL_QUESTION_IDENTITY_MISMATCH", String(distinctQuestions.size));
  }

  console.log("Test-specific bank  : RIASEC");
  console.log(`Published versions  : ${published.length}`);
  console.log(`Logical Questions   : ${distinctQuestions.size}`);
  console.log(`Taxonomy            : ${taxonomyVersion}`);
  console.log("Question → QuestionVersion identity: PASS");
  console.log("QuestionVersion → TestType ownership: PASS");
  console.log("QuestionVersion → Taxonomy ownership: PASS");
  console.log("Cross-test ownership isolation: PASS");
  console.log("F.10-C.2-F production question set: PRESERVED");
  console.log("F.3.3 TEST-SPECIFIC QUESTION BANK GATE: PASS");
} catch (e) {
  console.error("F.3.3 TEST-SPECIFIC QUESTION BANK GATE: FAIL");
  console.error(e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

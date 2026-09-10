import { QuestionStatus, MappingStatus } from "@prisma/client";
import { prisma } from "../db/prisma";

export type QuestionBankIdentity = {
  testTypeCode: string;
  testTypeId: string;
  taxonomyVersion: string | null;
  questionBankVersion: string;
};

export type TestSpecificQuestionVersion = {
  questionRecordId: string;
  questionVersionId: string;
  questionCode: string;
  testTypeCode: string;
  taxonomyVersion: string | null;
  version: string;
  text: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  type: string;
  answerType: string;
  reverseScore: boolean;
  weight: number;
  scale: number[];
  scoringKey: number[];
  options: string[] | null;
  correctOption: number | null;
  difficulty: string;
  status: string;
  mappingStatus: string;
};

function deriveQuestionBankVersion(
  testTypeCode: string,
  latestUpdatedAt: Date | null,
  count: number,
) {
  const stamp = latestUpdatedAt
    ? latestUpdatedAt.toISOString().replace(/\D/g, "").slice(0, 14)
    : "EMPTY";
  return `QB_${testTypeCode}_${stamp}_${count}`;
}

/**
 * Resolves the logical Question Bank boundary for one instrument.
 *
 * The physical repository remains shared; TestType + taxonomy ownership
 * define the logical bank boundary.
 */
export async function getQuestionBankIdentity(
  testTypeCode: string,
): Promise<QuestionBankIdentity> {
  const code = testTypeCode.trim().toUpperCase();
  const testType = await prisma.testType.findUnique({
    where: { code },
    include: {
      taxonomies: {
        where: { status: "ACTIVE" },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!testType) throw new Error(`TEST_TYPE_NOT_FOUND:${code}`);

  const activeTaxonomyVersion = testType.taxonomies[0]?.version ?? null;
  const latest = await prisma.questionVersion.findFirst({
    where: {
      testTypeId: testType.id,
      status: QuestionStatus.PUBLISHED,
      ...(activeTaxonomyVersion ? { taxonomyVersion: activeTaxonomyVersion } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { updatedAt: true },
  });

  const count = await prisma.questionVersion.count({
    where: {
      testTypeId: testType.id,
      status: QuestionStatus.PUBLISHED,
      ...(activeTaxonomyVersion ? { taxonomyVersion: activeTaxonomyVersion } : {}),
    },
  });

  return {
    testTypeCode: testType.code,
    testTypeId: testType.id,
    taxonomyVersion: activeTaxonomyVersion,
    questionBankVersion: deriveQuestionBankVersion(
      testType.code,
      latest?.updatedAt ?? null,
      count,
    ),
  };
}

/**
 * Returns only assessment-facing versions owned by the requested Test Type.
 * This is the canonical test-specific Question Bank read boundary.
 */
export async function getPublishedQuestionBank(
  testTypeCode: string,
): Promise<TestSpecificQuestionVersion[]> {
  const identity = await getQuestionBankIdentity(testTypeCode);

  const rows = await prisma.questionVersion.findMany({
    where: {
      testTypeId: identity.testTypeId,
      status: QuestionStatus.PUBLISHED,
      ...(identity.taxonomyVersion ? { taxonomyVersion: identity.taxonomyVersion } : {}),
      mappingStatus: MappingStatus.APPROVED,
      text: { not: "" },
    },
    include: {
      question: true,
    },
    orderBy: [{ questionId: "asc" }, { createdAt: "desc" }, { id: "desc" }],
  });

  // One immutable assessment-facing version per logical Question identity.
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latest.has(row.questionId)) latest.set(row.questionId, row);
  }

  return [...latest.values()].map((row) => ({
    questionRecordId: row.question.id,
    questionVersionId: row.id,
    questionCode: row.question.code,
    testTypeCode: identity.testTypeCode,
    taxonomyVersion: row.taxonomyVersion,
    version: row.version,
    text: row.text,
    domain: row.domain,
    subdomain: row.subdomain,
    indicator: row.indicator,
    type: row.type,
    answerType: row.answerType,
    reverseScore: row.reverseScore,
    weight: row.weight,
    scale: row.scale,
    scoringKey: row.scoringKey,
    options: Array.isArray(row.options) ? row.options.map(String) : null,
    correctOption: typeof row.correctOption === "number" ? row.correctOption : null,
    difficulty: row.difficulty,
    status: row.status,
    mappingStatus: row.mappingStatus,
  }));
}

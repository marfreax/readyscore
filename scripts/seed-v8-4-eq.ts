import { PrismaClient, QuestionStatus, MappingStatus, QuestionDifficulty, TaxonomyStatus } from "@prisma/client";
import bank from "../data/question-bank/eq/EQ_V2_SJT_PRODUCTION_BANK.json";

const prisma = new PrismaClient();

const DIMENSIONS = [
  "EMOTION_AWARENESS",
  "EMOTION_REGULATION",
  "EMPATHY_SOCIAL_AWARENESS",
  "RELATIONSHIP_SOCIAL_RESPONSE",
] as const;

async function main() {
  if (bank.length !== 24) throw new Error(`EQ_V2_BANK_COUNT:${bank.length}`);

  for (const dimension of DIMENSIONS) {
    const rows = bank.filter((item) => item.dimension === dimension);
    if (rows.length !== 6) throw new Error(`EQ_V2_BANK_DIMENSION:${dimension}:${rows.length}`);
  }

  for (const item of bank) {
    if (item.answerType !== "SINGLE_CHOICE_4" || item.options.length !== 4) {
      throw new Error(`EQ_V2_ITEM_FORMAT:${item.code}`);
    }
    if (item.scoringKey.length !== 4 || item.scoringKey.some((value) => !Number.isInteger(value) || value < 1 || value > 4) ||
        new Set(item.scoringKey).size !== 4) {
      throw new Error(`EQ_V2_ITEM_KEY:${item.code}`);
    }
  }

  const testType = await prisma.testType.findUnique({ where: { code: "EQ" } });
  if (!testType) throw new Error("TEST_TYPE_NOT_FOUND:EQ");

  const taxonomy = await prisma.taxonomyVersion.findUnique({
    where: { testTypeId_version: { testTypeId: testType.id, version: "EQ_TAXONOMY_V2" } },
  });
  if (!taxonomy) throw new Error("EQ_V2_TAXONOMY_NOT_FOUND");
  if (taxonomy.status !== TaxonomyStatus.ACTIVE) throw new Error("EQ_V2_TAXONOMY_NOT_ACTIVE");

  const codes = bank.map((item) => item.code);
  const existing = await prisma.question.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  if (existing.length) {
    throw new Error(`EQ_V2_SEED_DUPLICATE:${existing.map((row) => row.code).join(",")}`);
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const item of bank) {
      await tx.question.create({
        data: {
          id: item.id,
          code: item.code,
          versions: {
            create: {
              version: item.version,
              testTypeId: testType.id,
              taxonomyVersion: "EQ_TAXONOMY_V2",
              text: item.text,
              domain: item.dimension,
              subdomain: item.dimension,
              indicator: item.indicator,
              type: item.type,
              answerType: item.answerType,
              reverseScore: false,
              weight: item.weight,
              scale: [1, 2, 3, 4],
              scoringKey: item.scoringKey,
              options: item.options,
              correctOption: null,
              difficulty: QuestionDifficulty.MEDIUM,
              status: QuestionStatus.PUBLISHED,
              mappingStatus: MappingStatus.APPROVED,
              sourceFile: "EQ_V2_SJT_PRODUCTION_BANK.json",
              createdAt: now,
              updatedAt: now,
            },
          },
        },
      });
    }
  });

  console.log(`Seeded ${bank.length} EQ V2 questions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

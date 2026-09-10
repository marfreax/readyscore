import { PrismaClient, QuestionStatus, MappingStatus, QuestionDifficulty } from "@prisma/client";
import bank from "../data/question-bank/cognitive/COGNITIVE_V2_PRODUCTION_BANK.json";

const prisma = new PrismaClient();

const DIMENSIONS = [
  "VERBAL_REASONING",
  "NUMERICAL_REASONING",
  "LOGICAL_REASONING",
  "ABSTRACT_REASONING",
] as const;

async function main() {
  if (bank.length !== 24) throw new Error(`COGNITIVE_V2_BANK_COUNT:${bank.length}`);

  for (const dimension of DIMENSIONS) {
    const rows = bank.filter((item) => item.dimension === dimension);
    if (rows.length !== 6) throw new Error(`COGNITIVE_V2_BANK_DIMENSION:${dimension}:${rows.length}`);
  }

  const testType = await prisma.testType.findUnique({ where: { code: "COGNITIVE" } });
  if (!testType) throw new Error("TEST_TYPE_NOT_FOUND:COGNITIVE");

  const taxonomyVersion = "COGNITIVE_TAXONOMY_V2";
  const codes = bank.map((item) => item.code);
  const existing = await prisma.question.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  if (existing.length) {
    throw new Error(`COGNITIVE_V2_SEED_DUPLICATE:${existing.map((row) => row.code).join(",")}`);
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
              taxonomyVersion,
              text: item.text,
              domain: item.dimension,
              subdomain: item.dimension,
              indicator: item.indicator,
              type: item.type,
              answerType: item.answerType,
              reverseScore: false,
              weight: item.weight,
              scale: [1, 2, 3, 4],
              // Objective key is retained as internal scoring metadata.
              scoringKey: [item.correctOption],
              options: item.options,
              correctOption: item.correctOption,
              difficulty: QuestionDifficulty.MEDIUM,
              status: QuestionStatus.PUBLISHED,
              mappingStatus: MappingStatus.APPROVED,
              sourceFile: "COGNITIVE_V2_PRODUCTION_BANK.json",
              createdAt: now,
              updatedAt: now,
            },
          },
        },
      });
    }
  });

  console.log(`Seeded ${bank.length} Cognitive V2 questions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

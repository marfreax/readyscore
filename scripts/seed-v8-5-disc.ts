import { PrismaClient, MappingStatus, QuestionDifficulty, QuestionStatus, TaxonomyStatus } from "@prisma/client";
import bank from "../data/question-bank/disc/DISC_V2_SITUATIONAL_FORCED_CHOICE_PRODUCTION_BANK.json";

const prisma = new PrismaClient();

const DIMENSIONS = ["D", "I", "S", "C"] as const;
const dimensionToOrdinal: Record<string, number> = { D: 1, I: 2, S: 3, C: 4 };
const isDimension = (value: string): value is typeof DIMENSIONS[number] =>
  DIMENSIONS.includes(value as typeof DIMENSIONS[number]);

async function main() {
  if (bank.length !== 24) throw new Error(`DISC_V2_BANK_COUNT:${bank.length}`);

  const targetCounts = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<typeof DIMENSIONS[number], number>;

  for (const item of bank) {
    if (item.dimension !== "DISC") throw new Error(`DISC_V2_DOMAIN:${item.code}`);
    const target = item.subdomain.replace("TARGET_", "");
    if (!isDimension(target)) {
      throw new Error(`DISC_V2_TARGET:${item.code}`);
    }
    targetCounts[target]++;

    if (item.answerType !== "SINGLE_CHOICE_4" || item.type !== "SCENARIO" || item.options.length !== 4) {
      throw new Error(`DISC_V2_ITEM_FORMAT:${item.code}`);
    }
    if (new Set(item.options).size !== 4) throw new Error(`DISC_V2_OPTIONS:${item.code}`);
    if (item.optionDimensions.length !== 4 || new Set(item.optionDimensions).size !== 4 ||
        item.optionDimensions.some((d) => !isDimension(d))) {
      throw new Error(`DISC_V2_OPTION_DIMENSIONS:${item.code}`);
    }
    const expectedKey = item.optionDimensions.map((d) => dimensionToOrdinal[d]);
    if (JSON.stringify(expectedKey) !== JSON.stringify(item.scoringKey)) {
      throw new Error(`DISC_V2_KEY_MISMATCH:${item.code}`);
    }
    if (new Set(item.scoringKey).size !== 4 || item.scoringKey.some((v) => v < 1 || v > 4)) {
      throw new Error(`DISC_V2_KEY_INVALID:${item.code}`);
    }
    if (item.weight !== 1) throw new Error(`DISC_V2_WEIGHT:${item.code}`);
  }

  for (const dimension of DIMENSIONS) {
    if (targetCounts[dimension] !== 6) throw new Error(`DISC_V2_TARGET_COUNT:${dimension}:${targetCounts[dimension]}`);
  }

  const testType = await prisma.testType.findUnique({ where: { code: "DISC" } });
  if (!testType) throw new Error("TEST_TYPE_NOT_FOUND:DISC");

  const taxonomy = await prisma.taxonomyVersion.findUnique({
    where: { testTypeId_version: { testTypeId: testType.id, version: "DISC_TAXONOMY_V2" } },
  });
  if (!taxonomy) throw new Error("DISC_V2_TAXONOMY_NOT_FOUND");
  if (taxonomy.status !== TaxonomyStatus.ACTIVE) throw new Error("DISC_V2_TAXONOMY_NOT_ACTIVE");

  const codes = bank.map((item) => item.code);
  const existing = await prisma.question.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  if (existing.length) throw new Error(`DISC_V2_SEED_DUPLICATE:${existing.map((row) => row.code).join(",")}`);

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
              taxonomyVersion: "DISC_TAXONOMY_V2",
              text: item.text,
              domain: item.dimension,
              subdomain: item.subdomain,
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
              sourceFile: "DISC_V2_SITUATIONAL_FORCED_CHOICE_PRODUCTION_BANK.json",
              createdAt: now,
              updatedAt: now,
            },
          },
        },
      });
    }
  });

  console.log(`Seeded ${bank.length} DISC V2 questions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

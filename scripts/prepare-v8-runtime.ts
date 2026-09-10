import { spawnSync } from "node:child_process";
import { PrismaClient, QuestionStatus, MappingStatus, TaxonomyStatus } from "@prisma/client";

type Instrument = {
  code: "COGNITIVE" | "EQ" | "DISC" | "RIASEC";
  taxonomy: string;
  expectedCount: number;
  seedScript: string;
  bankFile: string;
};

const instruments: Instrument[] = [
  {
    code: "COGNITIVE",
    taxonomy: "COGNITIVE_TAXONOMY_V2",
    expectedCount: 24,
    seedScript: "scripts/seed-v8-3-cognitive.ts",
    bankFile: "data/question-bank/cognitive/COGNITIVE_V2_PRODUCTION_BANK.json",
  },
  {
    code: "EQ",
    taxonomy: "EQ_TAXONOMY_V2",
    expectedCount: 24,
    seedScript: "scripts/seed-v8-4-eq.ts",
    bankFile: "data/question-bank/eq/EQ_V2_SJT_PRODUCTION_BANK.json",
  },
  {
    code: "DISC",
    taxonomy: "DISC_TAXONOMY_V2",
    expectedCount: 24,
    seedScript: "scripts/seed-v8-5-disc.ts",
    bankFile: "data/question-bank/disc/DISC_V2_SITUATIONAL_FORCED_CHOICE_PRODUCTION_BANK.json",
  },
  {
    code: "RIASEC",
    taxonomy: "RIASEC_TAXONOMY_V2",
    expectedCount: 60,
    seedScript: "scripts/seed-v8-6-riasec.ts",
    bankFile: "data/question-bank/riasec/RIASEC_V2_PREFERENCE_PRODUCTION_BANK.json",
  },
];

const prisma = new PrismaClient();

function fail(message: string): never {
  throw new Error(`V8_RUNTIME_PREP_FAILED:${message}`);
}

function run(command: string, args: string[]) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} exited with ${result.status ?? "unknown status"}`);
  }
}

async function getState(instrument: Instrument) {
  const testType = await prisma.testType.findUnique({
    where: { code: instrument.code },
    select: { id: true, code: true },
  });
  if (!testType) fail(`TEST_TYPE_NOT_FOUND:${instrument.code}`);

  const taxonomy = await prisma.taxonomyVersion.findUnique({
    where: {
      testTypeId_version: {
        testTypeId: testType.id,
        version: instrument.taxonomy,
      },
    },
    select: { id: true, status: true },
  });
  if (!taxonomy) fail(`TAXONOMY_NOT_FOUND:${instrument.taxonomy}`);
  if (taxonomy.status !== TaxonomyStatus.ACTIVE) {
    fail(`TAXONOMY_NOT_ACTIVE:${instrument.taxonomy}:${taxonomy.status}`);
  }

  const rows = await prisma.questionVersion.findMany({
    where: {
      testTypeId: testType.id,
      taxonomyVersion: instrument.taxonomy,
      status: QuestionStatus.PUBLISHED,
      mappingStatus: MappingStatus.APPROVED,
      text: { not: "" },
    },
    select: {
      questionId: true,
      question: { select: { code: true } },
    },
  });

  const codes = new Set(rows.map((row) => row.question.code));
  return { count: codes.size, codes };
}

async function main() {
  console.log("=== READY SCORE V8 RUNTIME PREPARATION ===");
  console.log("Purpose : Prepare V8.3–V8.6 PostgreSQL question banks for actual runtime E2E.");
  console.log("Safety  : migrations are deployed; seeds run only when an entire V2 bank is absent.");
  console.log("Safety  : partial banks are NEVER silently repaired or overwritten.");
  console.log("Safety  : no historical V1 question/version is deleted or rewritten.");

  // The V8 instrument migrations create/activate the taxonomy boundaries.
  run("pnpm", ["prisma", "migrate", "deploy"]);

  for (const instrument of instruments) {
    const before = await getState(instrument);
    console.log(
      `${instrument.code}: ${before.count}/${instrument.expectedCount} published + approved V2 questions`,
    );

    if (before.count === instrument.expectedCount) {
      console.log(`${instrument.code}: COMPLETE — seed skipped.`);
      continue;
    }

    if (before.count !== 0) {
      fail(
        `${instrument.code}:PARTIAL_BANK:${before.count}/${instrument.expectedCount}. ` +
        `Refusing automatic mutation. Inspect the database before proceeding.`,
      );
    }

    run("pnpm", ["exec", "tsx", instrument.seedScript]);

    const after = await getState(instrument);
    if (after.count !== instrument.expectedCount) {
      fail(
        `${instrument.code}:SEED_VERIFICATION:${after.count}/${instrument.expectedCount} ` +
        `(expected ${instrument.expectedCount})`,
      );
    }
    console.log(`${instrument.code}: SEEDED + VERIFIED.`);
  }

  console.log("\n=== V8 RUNTIME PREPARATION: PASS ===");
  console.log("All V8.3–V8.6 instrument banks are present, published, approved, and taxonomy-scoped.");
  console.log("Next: run the normal typecheck/build and V8.0–V8.12 regression chain.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

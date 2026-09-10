import { prisma } from "../lib/db/prisma.ts";

function fail(code, message) {
  console.error("RIASEC ACTIVE V2 RESULT PAYLOAD RECONCILIATION: FAIL");
  console.error(`${code}: ${message}`);
  process.exitCode = 1;
}

try {
  console.log("=== RIASEC RIASEC ACTIVE V2 RESULT PAYLOAD RECONCILIATION ===");
  console.log("Mode     : READ-ONLY");
  console.log("Mutation : NONE");

  const rows = await prisma.assessmentResult.findMany({
    where: {
      attempt: {
        assessmentType: "RIASEC",
        status: "COMPLETED",
      },
    },
    include: { attempt: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  if (!rows.length) {
    fail("NO_COMPLETED_RIASEC_RESULT", "No completed RIASEC result snapshot exists.");
    process.exit();
  }

  const row = rows[0];
  const payload = row.result;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    fail("RESULT_SNAPSHOT_INVALID", "AssessmentResult.result is not a JSON object.");
    process.exit();
  }

  const result = payload;
  const riasec = result.riasec;
  const measurement = riasec?.measurement;

  console.log(`Completed RIASEC attempts : ${rows.length}`);
  console.log(`Result snapshot keys      : ${Object.keys(result).join(", ")}`);

  if (!riasec || riasec.contractVersion !== "RIASEC_RESULT_V2") {
    fail(
      "RIASEC_CONTRACT_MISSING",
      "Persisted result snapshot does not contain riasec.contractVersion=RIASEC_RESULT_V2.",
    );
    process.exit();
  }

  if (!measurement || measurement.testType !== "RIASEC") {
    fail("RIASEC_MEASUREMENT_MISSING", "Persisted result does not contain the RIASEC measurement payload.");
    process.exit();
  }

  const dimensions = Array.isArray(measurement.dimensionScores)
    ? measurement.dimensionScores
    : [];

  if (dimensions.length !== 6) {
    fail("RIASEC_DIMENSION_COUNT_MISMATCH", `Expected 6 dimensions, found ${dimensions.length}.`);
    process.exit();
  }

  const byDimension = Object.fromEntries(
    dimensions.map((item) => [String(item.dimension).toUpperCase(), item]),
  );

  for (const d of ["R", "I", "A", "S", "E", "C"]) {
    const item = byDimension[d];
    if (!item) {
      fail("RIASEC_DIMENSION_MISSING", `Missing dimension ${d}.`);
      process.exit();
    }
    if (typeof item.score !== "number") {
      fail("RIASEC_DIMENSION_SCORE_MISSING", `Dimension ${d} has no numeric score.`);
      process.exit();
    }
  }

  if (measurement.scoringVersion !== "RIASEC_SCORE_V2") {
    fail("RIASEC_SCORING_VERSION_MISMATCH", `Expected RIASEC_SCORE_V2, found ${measurement.scoringVersion}.`);
    process.exit();
  }

  if (typeof measurement.topCode !== "string" || measurement.topCode.length !== 3) {
    fail("RIASEC_TOP_CODE_INVALID", `Invalid topCode: ${JSON.stringify(measurement.topCode)}`);
    process.exit();
  }

  console.log("RIASEC_RESULT_V2 contract  : PASS");
  console.log("Six dimensions             : PASS");
  console.log("Numeric dimension scores   : PASS");
  console.log("Scoring version            : PASS");
  console.log(`Top code                   : ${measurement.topCode}`);
  console.log("Database mutation          : NONE");
  console.log("RIASEC ACTIVE V2 RESULT PAYLOAD RECONCILIATION: PASS");
} catch (error) {
  fail(
    "RESULT_PAYLOAD_QUERY_FAILED",
    [
      `name=${error?.name ?? "unknown"}`,
      `message=${error?.message ?? String(error)}`,
      `code=${error?.code ?? "n/a"}`,
      `meta=${error?.meta ? JSON.stringify(error.meta) : "n/a"}`,
    ].join("\n"),
  );
} finally {
  await prisma.$disconnect();
}

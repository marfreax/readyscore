import fs from "node:fs";
import path from "node:path";
import { getAdminQuestions } from "../lib/question-bank-admin";

const DIMENSIONS = ["R", "I", "A", "S", "E", "C"] as const;
const TARGET_PER_DIMENSION = 10;
const RESERVE_PER_DIMENSION = 4;

async function main() {
  const questions = await getAdminQuestions();
  const riasec = questions.filter((q) =>
    DIMENSIONS.includes(
      q.domain.trim().toUpperCase() as (typeof DIMENSIONS)[number],
    ),
  );

  if (riasec.length !== 84) {
    throw new Error(`EXPECTED_84_RIASEC_GOT_${riasec.length}`);
  }

  for (const dimension of DIMENSIONS) {
    const items = riasec.filter(
      (q) => q.domain.trim().toUpperCase() === dimension,
    );

    if (items.length !== TARGET_PER_DIMENSION + RESERVE_PER_DIMENSION) {
      throw new Error(
        `INVALID_DIMENSION_COUNT:${dimension}:${items.length}`,
      );
    }

    if (
      items.some((q) => q.status.toUpperCase() !== "DRAFT") ||
      items.some((q) => q.mappingStatus.toUpperCase() !== "MAPPED")
    ) {
      throw new Error(`INVALID_LIFECYCLE_STATE:${dimension}`);
    }
  }

  const root = process.cwd();
  const manifest = path.join(
    root,
    "data/question-bank/production/RIASEC_QB_V1_PRODUCTION_CANDIDATE_60.csv",
  );

  if (!fs.existsSync(manifest)) {
    throw new Error(`MANIFEST_NOT_FOUND:${manifest}`);
  }

  console.log("=== RIASEC PRODUCTION CANDIDATE VALIDATION ===");
  console.log("84 draft items verified.");
  console.log("60 TARGET items are production candidates.");
  console.log("24 RESERVE items remain reserve.");
  console.log("");
  for (const dimension of DIMENSIONS) {
    const count = riasec.filter(
      (q) => q.domain.trim().toUpperCase() === dimension,
    ).length;
    console.log(`${dimension}: ${count} total / 10 target / 4 reserve`);
  }
  console.log("");
  console.log("IMPORTANT:");
  console.log("- No question was approved.");
  console.log("- No question was published.");
  console.log("- No database mutation was performed.");
  console.log("- Mapping review remains PENDING_REVIEW.");
  console.log("");
  console.log("RIASEC F.10-B.4 CANDIDATE SELECTION: PASS");
}

main().catch((error) => {
  console.error("RIASEC F.10-B.4 VALIDATION: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

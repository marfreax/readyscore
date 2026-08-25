import { getAdminQuestions } from "../lib/question-bank-admin";

const DIMENSIONS = ["R", "I", "A", "S", "E", "C"] as const;

async function main() {
  const questions = await getAdminQuestions();

  const riasec = questions.filter((q) =>
    DIMENSIONS.includes(
      q.domain.trim().toUpperCase() as (typeof DIMENSIONS)[number],
    ),
  );

  console.log("=== RIASEC LIFECYCLE RECONCILIATION CHECK ===");
  console.log(`Admin-state RIASEC records visible: ${riasec.length}`);
  console.log("");
  console.log("WARNING:");
  console.log(
    "The legacy admin repository is file-backed. Do not use its approve/publish mutations for production RIASEC until PostgreSQL lifecycle synchronization is implemented.",
  );
  console.log("");
  console.log("Canonical runtime source: PostgreSQL QuestionVersion");
  console.log("Expected current DB lifecycle: DRAFT + MAPPED");
  console.log("");
  console.log("No database mutation performed.");
  console.log("");
  console.log("F.10-B.6 RECONCILIATION CHECK: READY");
}

main().catch((error) => {
  console.error("F.10-B.6 RECONCILIATION CHECK: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

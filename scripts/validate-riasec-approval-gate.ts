import fs from "node:fs";
import path from "node:path";
import { getAdminQuestions } from "../lib/question-bank-admin";

const DIMENSIONS = ["R", "I", "A", "S", "E", "C"] as const;
const EXPECTED_TOTAL = 84;

async function main() {
  const questions = await getAdminQuestions();

  const riasec = questions.filter((q) =>
    DIMENSIONS.includes(
      q.domain.trim().toUpperCase() as (typeof DIMENSIONS)[number],
    ),
  );

  if (riasec.length !== EXPECTED_TOTAL) {
    throw new Error(`EXPECTED_84_RIASEC_GOT_${riasec.length}`);
  }

  const invalidLifecycle = riasec.filter(
    (q) =>
      q.status.toUpperCase() !== "DRAFT" ||
      q.mappingStatus.toUpperCase() !== "MAPPED",
  );

  if (invalidLifecycle.length) {
    throw new Error(
      `INVALID_RIASEC_REVIEW_LIFECYCLE:${invalidLifecycle
        .map((q) => `${q.id}:${q.status}:${q.mappingStatus}`)
        .join(",")}`,
    );
  }

  const missingFields = riasec.filter(
    (q) =>
      !q.domain?.trim() ||
      !q.subdomain?.trim() ||
      !q.indicator?.trim() ||
      !q.text?.trim(),
  );

  if (missingFields.length) {
    throw new Error(
      `MISSING_RIASEC_REVIEW_FIELDS:${missingFields
        .map((q) => q.id)
        .join(",")}`,
    );
  }

  const root = process.cwd();
  const queue = path.join(
    root,
    "data/question-bank/review/RIASEC_QB_V1_REVIEW_QUEUE_84.csv",
  );

  if (!fs.existsSync(queue)) {
    throw new Error(`REVIEW_QUEUE_NOT_FOUND:${queue}`);
  }

  console.log("=== RIASEC CONTENT & MAPPING APPROVAL GATE ===");
  console.log(`Review population: ${riasec.length}`);
  console.log("Lifecycle: DRAFT");
  console.log("Mapping lifecycle: MAPPED");
  console.log("Approval state: NOT APPROVED");
  console.log("Publication state: NOT PUBLISHED");
  console.log("");
  for (const dimension of DIMENSIONS) {
    const items = riasec.filter(
      (q) => q.domain.trim().toUpperCase() === dimension,
    );
    console.log(`${dimension}: ${items.length} items`);
  }
  console.log("");
  console.log("No database mutation performed.");
  console.log("Human review required before APPROVED/PUBLISHED.");
  console.log("");
  console.log("RIASEC F.10-B.5 REVIEW GATE: READY");
}

main().catch((error) => {
  console.error("RIASEC F.10-B.5 REVIEW GATE: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

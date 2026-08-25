import { getAdminQuestions } from "../lib/question-bank-admin";

const DIMENSIONS = ["R", "I", "A", "S", "E", "C"] as const;

async function main() {
  const questions = await getAdminQuestions();

  const riasec = questions.filter((q) =>
    DIMENSIONS.includes(q.domain.trim().toUpperCase() as (typeof DIMENSIONS)[number]),
  );

  console.log("=== RIASEC DRAFT BANK AUDIT ===");
  console.log(`RIASEC questions found: ${riasec.length}`);

  for (const dimension of DIMENSIONS) {
    const items = riasec.filter(
      (q) => q.domain.trim().toUpperCase() === dimension,
    );

    const draft = items.filter(
      (q) => q.status.trim().toUpperCase() === "DRAFT",
    );

    const mapped = items.filter(
      (q) => q.mappingStatus.trim().toUpperCase() === "MAPPED",
    );

    const approved = items.filter(
      (q) => q.mappingStatus.trim().toUpperCase() === "APPROVED",
    );

    console.log(
      JSON.stringify({
        dimension,
        total: items.length,
        draft: draft.length,
        mapped: mapped.length,
        approved: approved.length,
      }),
    );
  }

  const nonDraft = riasec.filter(
    (q) => q.status.trim().toUpperCase() !== "DRAFT",
  );

  const missingMapping = riasec.filter(
    (q) =>
      !q.subdomain?.trim() ||
      !q.indicator?.trim() ||
      !q.mappingStatus?.trim(),
  );

  console.log("");
  console.log(`Non-draft RIASEC items: ${nonDraft.length}`);
  console.log(`Missing mapping fields: ${missingMapping.length}`);

  if (riasec.length !== 84) {
    throw new Error(
      `RIASEC_DRAFT_BANK_EXPECTED_84_GOT_${riasec.length}`,
    );
  }

  if (nonDraft.length !== 0) {
    throw new Error("RIASEC_DRAFT_BANK_CONTAINS_NON_DRAFT_ITEM");
  }

  for (const dimension of DIMENSIONS) {
    const count = riasec.filter(
      (q) => q.domain.trim().toUpperCase() === dimension,
    ).length;

    if (count !== 14) {
      throw new Error(
        `RIASEC_DIMENSION_EXPECTED_14:${dimension}:got=${count}`,
      );
    }
  }

  console.log("");
  console.log("RIASEC DRAFT BANK AUDIT: PASS");
}

main()
  .catch((error) => {
    console.error("RIASEC DRAFT BANK AUDIT: FAIL");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });

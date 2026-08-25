import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const manifestPath = path.join(
  root,
  "data/question-bank/production/RIASEC_QB_V1_APPROVED_PRODUCTION_MANIFEST.json",
);

const candidatePath = path.join(
  root,
  "data/question-bank/production/RIASEC_QB_V1_PRODUCTION_CANDIDATE_60.csv",
);

const reviewPath = path.join(
  root,
  "data/question-bank/review/RIASEC_QB_V1_HUMAN_REVIEW_DECISIONS_84.csv",
);

const DIMENSIONS = ["R", "I", "A", "S", "E", "C"];
const TARGET = 10;
const REQUIRED = 60;

function fail(code, message) {
  throw new Error(`${code}: ${message}`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];

    if (c === '"' && quoted && n === '"') {
      field += '"';
      i++;
      continue;
    }

    if (c === '"') {
      quoted = !quoted;
      continue;
    }

    if ((c === "," || c === "\t") && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && n === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }

    field += c;
  }

  if (quoted) fail("CSV_QUOTE_ERROR", "Unclosed quoted field.");
  if (field.length || row.length) {
    row.push(field);
    if (row.some((x) => x.trim() !== "")) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows.shift().map((x) =>
    x.trim().replace(/^\uFEFF/, "").toLowerCase(),
  );

  return rows.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, (values[index] ?? "").trim()]),
    ),
  );
}

function norm(value) {
  return String(value ?? "").trim().toUpperCase();
}

function readJson(file) {
  if (!fs.existsSync(file)) fail("MANIFEST_NOT_FOUND", file);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail("MANIFEST_INVALID_JSON", error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log("=== RIASEC F.10-C.2-A PRODUCTION LIFECYCLE SYNCHRONIZATION ===");
  console.log("Canonical source : PostgreSQL QuestionVersion");
  console.log("Mutation gate     : manifest + human review only");

  const manifest = readJson(manifestPath);

  if (norm(manifest.status) !== "APPROVED_FOR_PUBLICATION") {
    console.log("");
    console.log("Manifest is not approved for publication.");
    console.log(`Current manifest status: ${manifest.status ?? "MISSING"}`);
    console.log("Database mutation      : NONE");
    console.log("F.10-C.2-A LIFECYCLE SYNCHRONIZATION: BLOCKED");
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(manifest.questionIds)) {
    fail("INVALID_MANIFEST_IDS", "questionIds must be an array.");
  }

  if (manifest.questionIds.length !== REQUIRED) {
    fail(
      "INVALID_PRODUCTION_COUNT",
      `Manifest requires exactly ${REQUIRED} IDs; found ${manifest.questionIds.length}.`,
    );
  }

  const ids = manifest.questionIds.map((id) => String(id).trim());
  if (ids.some((id) => !id)) fail("EMPTY_PRODUCTION_ID", "Manifest contains an empty ID.");
  if (new Set(ids).size !== ids.length) fail("DUPLICATE_PRODUCTION_ID", "Manifest contains duplicate IDs.");

  if (
    manifest.humanReview?.mappingApproved !== true ||
    manifest.humanReview?.contentApproved !== true ||
    manifest.humanReview?.reviewerApproved !== true
  ) {
    fail(
      "HUMAN_REVIEW_NOT_EXPLICITLY_APPROVED",
      "mappingApproved, contentApproved and reviewerApproved must all be true.",
    );
  }

  if (!fs.existsSync(candidatePath)) fail("CANDIDATE_FILE_NOT_FOUND", candidatePath);
  if (!fs.existsSync(reviewPath)) fail("REVIEW_FILE_NOT_FOUND", reviewPath);

  const candidateRows = parseCsv(fs.readFileSync(candidatePath, "utf8"));
  const reviewRows = parseCsv(fs.readFileSync(reviewPath, "utf8"));

  if (candidateRows.length !== REQUIRED) {
    fail("INVALID_CANDIDATE_POPULATION", `Expected ${REQUIRED}, found ${candidateRows.length}.`);
  }

  if (reviewRows.length !== 84) {
    fail("INVALID_REVIEW_POPULATION", `Expected 84, found ${reviewRows.length}.`);
  }

  const candidateIds = new Set(candidateRows.map((row) => row.id));
  for (const id of ids) {
    if (!candidateIds.has(id)) {
      fail("MANIFEST_ID_NOT_CANDIDATE", `${id} is not present in the 60 production candidates.`);
    }
  }

  const reviewById = new Map(reviewRows.map((row) => [row.id, row]));
  for (const id of ids) {
    const row = reviewById.get(id);
    if (!row) fail("MANIFEST_ID_NOT_REVIEWED", `${id} has no review row.`);

    if (
      norm(row.mapping_review_status) !== "APPROVED" ||
      norm(row.content_review_status) !== "APPROVED" ||
      norm(row.decision) !== "APPROVE"
    ) {
      fail(
        "MANIFEST_ID_REVIEW_NOT_APPROVED",
        `${id} is not explicitly approved in the review package.`,
      );
    }
  }

  const counts = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, 0]));
  for (const id of ids) {
    const dimension = norm(reviewById.get(id).domain);
    if (!DIMENSIONS.includes(dimension)) {
      fail("INVALID_RIASEC_DIMENSION", `${id} has invalid dimension ${dimension}.`);
    }
    counts[dimension]++;
  }

  for (const dimension of DIMENSIONS) {
    if (counts[dimension] !== TARGET) {
      fail(
        "RIASEC_DIMENSION_QUOTA_MISMATCH",
        `${dimension}: expected ${TARGET}, found ${counts[dimension]}.`,
      );
    }
  }

  // Load the application's canonical Prisma singleton only after every
  // non-mutating gate has passed. This script is executed through tsx so the
  // real TypeScript singleton is loaded rather than guessing a generated .js file.
  let prismaModule;
  try {
    prismaModule = await import("../lib/db/prisma.ts");
  } catch (error) {
    fail(
      "PRISMA_SINGLETON_NOT_FOUND",
      `Cannot load the application's canonical Prisma singleton at lib/db/prisma: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const prisma = prismaModule.prisma ?? prismaModule.default;
  if (!prisma) fail("PRISMA_SINGLETON_INVALID", "Canonical Prisma singleton does not export prisma.");

  const result = await prisma.$transaction(async (tx) => {
    // Discover actual Prisma model fields at runtime rather than assuming a schema
    // contract. We only proceed if the QuestionVersion model exists.
    const questionDelegate = tx.question;
    const versionDelegate = tx.questionVersion;
    if (!questionDelegate) fail("QUESTION_MODEL_NOT_FOUND", "Prisma Question model is unavailable.");
    if (!versionDelegate) fail("QUESTION_VERSION_MODEL_NOT_FOUND", "Prisma QuestionVersion model is unavailable.");

    // Manifest IDs are the stable Question.code values (e.g. RIASEC-R-001),
    // not Prisma QuestionVersion.cuid values. Resolve codes to Questions first,
    // then promote the latest QuestionVersion for each Question.
    const questions = await questionDelegate.findMany({
      where: { code: { in: ids } },
      select: { id: true, code: true },
    });

    if (questions.length !== REQUIRED) {
      fail(
        "QUESTION_CODE_RECONCILIATION_FAILED",
        `Manifest contains ${REQUIRED} question codes but PostgreSQL returned ${questions.length}.`,
      );
    }

    const questionByCode = new Map(questions.map((row) => [row.code, row]));
    for (const code of ids) {
      if (!questionByCode.has(code)) fail("QUESTION_NOT_FOUND", `Question code ${code} not found.`);
    }

    const questionIds = questions.map((row) => row.id);
    const versions = await versionDelegate.findMany({
      where: { questionId: { in: questionIds } },
      select: {
        id: true,
        questionId: true,
        version: true,
        status: true,
        mappingStatus: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const latestByQuestionId = new Map();
    for (const row of versions) {
      if (!latestByQuestionId.has(row.questionId)) latestByQuestionId.set(row.questionId, row);
    }

    const targets = ids.map((code) => {
      const question = questionByCode.get(code);
      const version = latestByQuestionId.get(question.id);
      if (!version) fail("QUESTION_VERSION_NOT_FOUND", `No QuestionVersion found for ${code}.`);
      return { code, questionId: question.id, versionId: version.id, status: version.status, mappingStatus: version.mappingStatus };
    });

    for (const target of targets) {
      if (norm(target.mappingStatus) !== "MAPPED") {
        fail("QUESTION_MAPPING_NOT_READY", `${target.code} mappingStatus is ${target.mappingStatus}.`);
      }
    }

    // Only the 60 explicitly approved QuestionVersion rows are mutated.
    for (const target of targets) {
      await versionDelegate.update({
        where: { id: target.versionId },
        data: {
          mappingStatus: "APPROVED",
          status: "APPROVED",
        },
      });
    }

    for (const target of targets) {
      await versionDelegate.update({
        where: { id: target.versionId },
        data: {
          status: "PUBLISHED",
        },
      });
    }

    return {
      updated: REQUIRED,
      dimensions: counts,
    };
  });

  console.log("");
  console.log(`Production IDs validated : ${ids.length}`);
  console.log(`PostgreSQL rows updated  : ${result.updated}`);
  for (const dimension of DIMENSIONS) {
    console.log(`${dimension}: ${result.dimensions[dimension]} published`);
  }
  console.log("Mapping transition       : MAPPED → APPROVED");
  console.log("Lifecycle transition     : APPROVED → PUBLISHED");
  console.log("F.10-C.2-A LIFECYCLE SYNCHRONIZATION: PASS");
  console.log("");
  console.log("Next: rerun pnpm e2e:riasec");
}

main().catch((error) => {
  console.error("");
  console.error("F.10-C.2-A LIFECYCLE SYNCHRONIZATION: FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

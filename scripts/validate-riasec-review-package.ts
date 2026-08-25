import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const reviewPath = path.join(
  root,
  "data/question-bank/review/RIASEC_QB_V1_HUMAN_REVIEW_DECISIONS_84.csv",
);
const manifestPath = path.join(
  root,
  "data/question-bank/production/RIASEC_QB_V1_APPROVED_PRODUCTION_MANIFEST.json",
);
const candidatePath = path.join(
  root,
  "data/question-bank/source/RIASEC_QB_V1_FULL_84_CANDIDATE.csv",
);

const DIMENSIONS = ["R", "I", "A", "S", "E", "C"] as const;

function fail(code: string, message: string): never {
  throw new Error(`${code}: ${message}`);
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];

    if (c === '"' && quoted && n === '"') {
      field += '"';
      i += 1;
      continue;
    }
    if (c === '"') {
      quoted = !quoted;
      continue;
    }
    if (c === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }
    if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && n === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }

  if (quoted) fail("CSV_QUOTE_ERROR", "Unclosed CSV quote.");
  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }
  if (!rows.length) return [];

  const headers = rows.shift()!.map((value) =>
    value.trim().replace(/^\uFEFF/, "").toLowerCase(),
  );

  return rows.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, (values[index] ?? "").trim()]),
    ),
  );
}

function readCsv(file: string) {
  if (!fs.existsSync(file)) fail("FILE_NOT_FOUND", path.relative(root, file));
  return parseCsv(fs.readFileSync(file, "utf8"));
}

function requiredColumns(rows: Record<string, string>[], required: string[], label: string) {
  if (!rows.length) fail("EMPTY_FILE", `${label} contains no rows.`);
  for (const column of required) {
    if (!(column in rows[0])) fail("MISSING_COLUMN", `${label}: ${column}`);
  }
}

function norm(value: string | undefined) {
  return (value ?? "").trim();
}

async function main() {
  console.log("=== RIASEC F.10-B.8-A.1 REVIEW PACKAGE INTEGRITY ===");

  const candidateRows = readCsv(candidatePath);
  const reviewRows = readCsv(reviewPath);

  requiredColumns(candidateRows, ["id","domain","subdomain","indicator","text","role"], "candidate bank");
  requiredColumns(
    reviewRows,
    ["id","domain","subdomain","indicator","text","role",
     "mapping_review_status","content_review_status","decision",
     "review_flags","reviewer_note"],
    "review decision file",
  );

  if (candidateRows.length !== 84) {
    fail("INVALID_CANDIDATE_COUNT", `Expected 84, found ${candidateRows.length}.`);
  }
  if (reviewRows.length !== 84) {
    fail("INVALID_REVIEW_COUNT", `Expected 84, found ${reviewRows.length}.`);
  }

  const candidateIds = candidateRows.map((r) => norm(r.id));
  const reviewIds = reviewRows.map((r) => norm(r.id));

  if (candidateIds.some((id) => !id)) fail("EMPTY_CANDIDATE_ID", "Candidate ID empty.");
  if (reviewIds.some((id) => !id)) fail("EMPTY_REVIEW_ID", "Review ID empty.");

  if (new Set(candidateIds).size !== candidateIds.length) {
    fail("DUPLICATE_CANDIDATE_ID", "Candidate IDs are not unique.");
  }
  if (new Set(reviewIds).size !== reviewIds.length) {
    fail("DUPLICATE_REVIEW_ID", "Review IDs are not unique.");
  }

  const candidateSet = new Set(candidateIds);
  const missing = candidateIds.filter((id) => !reviewIds.includes(id));
  const extra = reviewIds.filter((id) => !candidateSet.has(id));

  if (missing.length) fail("CANDIDATE_MISSING_FROM_REVIEW", missing.join(", "));
  if (extra.length) fail("REVIEW_ID_NOT_IN_CANDIDATE_BANK", extra.join(", "));

  const candidateById = new Map(candidateRows.map((r) => [norm(r.id), r]));
  const counts = new Map<string, number>();

  for (const r of candidateRows) {
    const d = norm(r.domain).toUpperCase();
    if (!DIMENSIONS.includes(d as (typeof DIMENSIONS)[number])) {
      fail("INVALID_RIASEC_DIMENSION", `${r.id}: ${r.domain}`);
    }
    counts.set(d, (counts.get(d) ?? 0) + 1);

    for (const field of ["subdomain","indicator","text"]) {
      if (!norm(r[field])) fail("INCOMPLETE_CANDIDATE_MAPPING", `${r.id}: ${field}`);
    }
  }

  for (const d of DIMENSIONS) {
    if ((counts.get(d) ?? 0) !== 14) {
      fail("DIMENSION_POPULATION_MISMATCH", `${d}: expected 14, found ${counts.get(d) ?? 0}`);
    }
  }

  const allowed = new Set(["PENDING_REVIEW","APPROVED","REVIEW_REQUIRED","REVISE","REJECT"]);
  const decisions = new Set(["","APPROVE","REVISE","REJECT"]);

  for (const r of reviewRows) {
    const source = candidateById.get(norm(r.id))!;
    for (const field of ["domain","subdomain","indicator","text","role"]) {
      if (norm(r[field]) !== norm(source[field])) {
        fail("REVIEW_SOURCE_DRIFT", `${r.id}: ${field}`);
      }
    }

    const mapping = norm(r.mapping_review_status).toUpperCase();
    const content = norm(r.content_review_status).toUpperCase();
    const decision = norm(r.decision).toUpperCase();

    if (!allowed.has(mapping)) fail("INVALID_MAPPING_REVIEW_STATUS", `${r.id}: ${mapping}`);
    if (!allowed.has(content)) fail("INVALID_CONTENT_REVIEW_STATUS", `${r.id}: ${content}`);
    if (!decisions.has(decision)) fail("INVALID_REVIEW_DECISION", `${r.id}: ${decision}`);
  }

  if (!fs.existsSync(manifestPath)) fail("MANIFEST_NOT_FOUND", path.relative(root, manifestPath));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  if (manifest.assessmentType !== "riasec") fail("MANIFEST_ASSESSMENT_TYPE", "not riasec");
  if (manifest.requiredCount !== 60) fail("MANIFEST_REQUIRED_COUNT", "must be 60");
  if (manifest.requiredPerDimension !== 10) fail("MANIFEST_REQUIRED_DIMENSION_COUNT", "must be 10");
  if (!Array.isArray(manifest.questionIds)) fail("MANIFEST_IDS_INVALID", "questionIds must be array");

  if (manifest.questionIds.length !== 0) {
    fail("UNEXPECTED_PRODUCTION_MANIFEST_MUTATION", "Manifest must be empty at A.1.");
  }
  if (manifest.status !== "PENDING_HUMAN_REVIEW") {
    fail("UNEXPECTED_MANIFEST_STATUS", `found ${manifest.status}`);
  }

  if (
    manifest.humanReview?.mappingApproved !== false ||
    manifest.humanReview?.contentApproved !== false ||
    manifest.humanReview?.reviewerApproved !== false
  ) {
    fail("UNEXPECTED_MANIFEST_APPROVAL", "Approval flags must remain false.");
  }

  console.log(`Candidate population : ${candidateRows.length}`);
  console.log(`Review population    : ${reviewRows.length}`);
  for (const d of DIMENSIONS) console.log(`${d}: ${counts.get(d)} candidate`);
  console.log("ID uniqueness        : PASS");
  console.log("Source reconciliation: PASS");
  console.log("Review schema        : PASS");
  console.log("Manifest state       : EMPTY / PENDING_HUMAN_REVIEW");
  console.log("Database mutation    : NONE");
  console.log("");
  console.log("F.10-B.8-A.1 REVIEW PACKAGE INTEGRITY: PASS");
}

main().catch((error) => {
  console.error("F.10-B.8-A.1 REVIEW PACKAGE INTEGRITY: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

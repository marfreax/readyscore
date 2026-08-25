import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reviewPath = path.join(root, "data/question-bank/review/RIASEC_QB_V1_CONTENT_REVIEW_84.csv");
const manifestPath = path.join(root, "data/question-bank/production/RIASEC_QB_V1_APPROVED_PRODUCTION_MANIFEST.json");

const DIMENSIONS = ["R", "I", "A", "S", "E", "C"] as const;
const TARGET = 10;
const TOTAL = 60;

function fail(code: string, message: string): never {
  throw new Error(`${code}: ${message}`);
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && quoted && n === '"') { field += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === "," && !quoted) { row.push(field); field = ""; continue; }
    if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && n === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  if (quoted) fail("CSV_QUOTE_ERROR", "Unclosed quote.");
  if (field.length || row.length) { row.push(field); if (row.some((x) => x.trim() !== "")) rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift()!.map((x) => x.trim().replace(/^\uFEFF/, "").toLowerCase());
  return rows.map((values) => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()])));
}

function norm(v: string | undefined) { return (v ?? "").trim().toUpperCase(); }

async function main() {
  if (!fs.existsSync(reviewPath)) fail("REVIEW_FILE_NOT_FOUND", reviewPath);
  const rows = parseCsv(fs.readFileSync(reviewPath, "utf8"));

  if (rows.length !== 84) fail("INVALID_REVIEW_COUNT", `Expected 84, found ${rows.length}.`);

  const ids = rows.map((r) => r.id);
  if (ids.some((id) => !id)) fail("EMPTY_ID", "Review contains an empty ID.");
  if (new Set(ids).size !== ids.length) fail("DUPLICATE_ID", "Review contains duplicate IDs.");

  const approved = rows.filter((r) =>
    norm(r.mapping_review_status) === "APPROVED" &&
    norm(r.content_review_status) === "APPROVED" &&
    norm(r.decision) === "APPROVE"
  );

  const counts = new Map<string, number>();
  for (const r of approved) {
    const d = norm(r.domain);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }

  console.log("=== RIASEC F.10-B.8-B CONTENT REVIEW & PRODUCTION SELECTION ===");
  console.log(`Review population : ${rows.length}`);
  console.log(`Fully approved    : ${approved.length}`);
  for (const d of DIMENSIONS) console.log(`${d}: ${counts.get(d) ?? 0} approved / ${TARGET} required`);

  if (approved.length !== TOTAL) {
    console.log("");
    console.log("CONTENT REVIEW INCOMPLETE");
    console.log("No production manifest generated.");
    console.log("No database mutation performed.");
    console.log("");
    console.log(`Need exactly ${TOTAL} fully approved items.`);
    return;
  }

  for (const d of DIMENSIONS) {
    if ((counts.get(d) ?? 0) !== TARGET) {
      fail("DIMENSION_QUOTA_MISMATCH", `${d}: expected ${TARGET}, got ${counts.get(d) ?? 0}`);
    }
  }

  const manifest = {
    manifestVersion: "RIASEC_PRODUCTION_MANIFEST_V1",
    assessmentType: "riasec",
    requiredCount: TOTAL,
    requiredPerDimension: TARGET,
    questionIds: approved.map((r) => r.id),
    humanReview: {
      mappingApproved: true,
      contentApproved: true,
      reviewerApproved: true
    },
    status: "APPROVED_FOR_PUBLICATION"
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log("");
  console.log("60-item production manifest generated.");
  console.log("PostgreSQL mutation: NONE");
  console.log("F.10-B.8-B CONTENT REVIEW & PRODUCTION SELECTION: PASS");
}

main().catch((error) => {
  console.error("F.10-B.8-B CONTENT REVIEW & PRODUCTION SELECTION: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

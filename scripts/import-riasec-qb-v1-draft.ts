#!/usr/bin/env npx tsx

import fs from "node:fs";
import path from "node:path";
import { Prisma, QuestionDifficulty, QuestionStatus, MappingStatus } from "@prisma/client";
import { prisma } from "../lib/db/prisma";

type Row = {
  id: string;
  domain: string;
  subdomain: string;
  indicator: string;
  text: string;
  type: string;
  reverseScore: string;
  weight: string;
  scale: string;
  scoringKey: string;
  difficulty: string;
  status: string;
  mappingStatus: string;
  sourceFile: string;
  role: "TARGET" | "RESERVE";
};

const ROOT = process.cwd();
const CSV = path.join(
  ROOT,
  "data",
  "question-bank",
  "source",
  "RIASEC_QB_V1_FULL_84_CANDIDATE.csv",
);
const REPORT = path.join(
  ROOT,
  "data",
  "question-bank",
  "riasec-qb-v1-draft-import-report.json",
);

function parseCsv(text: string): Row[] {
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
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }

  if (quoted) throw new Error("CSV_QUOTE_ERROR");
  if (field.length || row.length) {
    row.push(field);
    if (row.some((x) => x.trim() !== "")) rows.push(row);
  }
  if (!rows.length) return [];

  const headers = rows.shift()!.map((x) =>
    x.trim().replace(/^\uFEFF/, "").toLowerCase(),
  );

  return rows.map((values) => {
    const record = Object.fromEntries(
      headers.map((header, i) => [header, (values[i] ?? "").trim()]),
    ) as Record<string, string>;

    return {
      id: record.id,
      domain: record.domain,
      subdomain: record.subdomain,
      indicator: record.indicator,
      text: record.text,
      type: record.type || "LIKERT",
      reverseScore: record.reversescore,
      weight: record.weight,
      scale: record.scale,
      scoringKey: record.scoringkey,
      difficulty: record.difficulty,
      status: record.status,
      mappingStatus: record.mappingstatus,
      sourceFile: record.sourcefile,
      role: record.role as Row["role"],
    };
  });
}

function bool(value: string) {
  return ["true", "1", "yes", "ya"].includes(value.toLowerCase());
}

function ints(value: string, expected: number) {
  const result = value.split(/[|,]/).map((v) => Number(v.trim()));
  if (
    result.length !== expected ||
    result.some((v) => !Number.isInteger(v))
  ) {
    throw new Error(`INVALID_INT_ARRAY:${value}`);
  }
  return result;
}

function difficulty(value: string): QuestionDifficulty {
  const normalized = value.toUpperCase();
  if (normalized === "EASY") return QuestionDifficulty.EASY;
  if (normalized === "MEDIUM") return QuestionDifficulty.MEDIUM;
  if (normalized === "HARD") return QuestionDifficulty.HARD;
  return QuestionDifficulty.UNSPECIFIED;
}

function validate(rows: Row[]) {
  if (rows.length !== 84) {
    throw new Error(`RIASEC_QB_EXPECTED_84_GOT_${rows.length}`);
  }

  const ids = new Set<string>();
  for (const row of rows) {
    if (!/^RIASEC-[RIASEC]-\d{3}$|^RIASEC-[RIASEC]-R\d{3}$/.test(row.id)) {
      // Accept the generated reserve naming convention as well; the
      // dimension-specific checks below are authoritative.
      if (!/^RIASEC-[RIASEC]-/.test(row.id)) {
        throw new Error(`INVALID_RIASEC_ID:${row.id}`);
      }
    }
    if (ids.has(row.id)) throw new Error(`DUPLICATE_CSV_ID:${row.id}`);
    ids.add(row.id);

    if (!"RIASEC".includes(row.domain)) {
      throw new Error(`INVALID_RIASEC_DOMAIN:${row.id}:${row.domain}`);
    }
    if (!row.text) throw new Error(`EMPTY_TEXT:${row.id}`);
    if (!row.subdomain || !row.indicator) {
      throw new Error(`MISSING_MAPPING:${row.id}`);
    }
    if (row.status.toUpperCase() !== "DRAFT") {
      throw new Error(`NON_DRAFT_INPUT:${row.id}:${row.status}`);
    }
    if (row.role !== "TARGET" && row.role !== "RESERVE") {
      throw new Error(`INVALID_ROLE:${row.id}:${row.role}`);
    }

    const weight = Number(row.weight);
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new Error(`INVALID_WEIGHT:${row.id}`);
    }

    const scale = ints(row.scale, 5);
    const scoringKey = ints(row.scoringKey, 5);
    const reverse = bool(row.reverseScore);
    const expected = reverse ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5];

    if (JSON.stringify(scale) !== JSON.stringify([1, 2, 3, 4, 5])) {
      throw new Error(`INVALID_SCALE:${row.id}`);
    }
    if (JSON.stringify(scoringKey) !== JSON.stringify(expected)) {
      throw new Error(`INVALID_SCORING_KEY:${row.id}`);
    }
  }

  for (const dimension of "RIASEC") {
    const t = rows.filter(
      (r) => r.domain === dimension && r.role === "TARGET",
    ).length;
    const r = rows.filter(
      (r) => r.domain === dimension && r.role === "RESERVE",
    ).length;

    if (t !== 10 || r !== 4) {
      throw new Error(
        `DIMENSION_QUOTA_INVALID:${dimension}:target=${t}:reserve=${r}`,
      );
    }
  }
}

async function main() {
  if (!fs.existsSync(CSV)) {
    throw new Error(`CSV_NOT_FOUND:${CSV}`);
  }

  const rows = parseCsv(fs.readFileSync(CSV, "utf8"));
  validate(rows);

  const codes = rows.map((row) => row.id);
  const existing = await prisma.question.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });

  if (existing.length) {
    throw new Error(
      `DUPLICATE_EXISTING_QUESTION_CODES:${existing.map((x) => x.code).join(",")}`,
    );
  }

  const importedAt = new Date();
  const sourcePrefix = "RIASEC_QB_V1_DRAFT";

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      await tx.question.create({
        data: {
          id: row.id,
          code: row.id,
          versions: {
            create: {
              version: "v1",
              text: row.text,
              domain: row.domain,
              subdomain: row.subdomain,
              indicator: row.indicator,
              type: row.type || "LIKERT",
              answerType: "LIKERT_5",
              reverseScore: bool(row.reverseScore),
              weight: Number(row.weight),
              scale: ints(row.scale, 5),
              scoringKey: ints(row.scoringKey, 5),
              difficulty: difficulty(row.difficulty),
              status: QuestionStatus.DRAFT,
              // MAPPED means the candidate has a mapping supplied in the
              // candidate CSV. It is NOT assessment-eligible because the
              // lifecycle status remains DRAFT and publication requires
              // APPROVED + PUBLISHED.
              mappingStatus: MappingStatus.MAPPED,
              sourceFile: `${sourcePrefix}:${row.role}`,
            },
          },
        },
      });
    }
  });

  const report = {
    importedAt: importedAt.toISOString(),
    total: rows.length,
    target: rows.filter((r) => r.role === "TARGET").length,
    reserve: rows.filter((r) => r.role === "RESERVE").length,
    dimensions: Object.fromEntries(
      [..."RIASEC"].map((dimension) => [
        dimension,
        {
          target: rows.filter(
            (r) => r.domain === dimension && r.role === "TARGET",
          ).length,
          reserve: rows.filter(
            (r) => r.domain === dimension && r.role === "RESERVE",
          ).length,
        },
      ]),
    ),
    status: "DRAFT",
    mappingStatus: "MAPPED",
    sourceFile: "RIASEC_QB_V1_FULL_84_CANDIDATE.csv",
  };

  const reportPath = path.join(
    ROOT,
    "data",
    "question-bank",
    "riasec-qb-v1-draft-import-report.json",
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

  console.log("");
  console.log("RIASEC QB V1 — DRAFT IMPORT");
  console.log("----------------------------");
  console.log(`Imported          : ${report.total}`);
  console.log(`Target            : ${report.target}`);
  console.log(`Reserve           : ${report.reserve}`);
  console.log(`Lifecycle status  : ${report.status}`);
  console.log(`Mapping status    : ${report.mappingStatus}`);
  console.log("");
  for (const dimension of "RIASEC") {
    const item = report.dimensions[dimension] as {
      target: number;
      reserve: number;
    };
    console.log(
      `${dimension}: target=${item.target} reserve=${item.reserve}`,
    );
  }
  console.log("");
  console.log(`Report: ${path.relative(ROOT, reportPath)}`);
  console.log("");
}

main()
  .catch((error) => {
    console.error("RIASEC DRAFT IMPORT FAILED");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

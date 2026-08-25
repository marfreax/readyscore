import type { ScoringKey } from "./question-bank-types";
import { findDomain, findSubdomain, validateMapping } from "./question-bank-taxonomy";

export type ImportedQuestion = {
  id: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  text: string;
  type: string;
  reverseScore: boolean;
  weight: number;
  scale: readonly [1, 2, 3, 4, 5];
  scoringKey: ScoringKey;
  difficulty: string;
  status: string;
  mappingStatus: string;
  sourceFile: string;
};

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

  const headers = rows.shift()!.map((x) => x.trim().replace(/^\uFEFF/, "").toLowerCase());
  return rows.map((values) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] ?? "").trim();
    });
    return record;
  });
}

function value(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const found = row[key.toLowerCase()];
    if (found !== undefined) return found;
  }
  return "";
}

function boolValue(valueInput: string | undefined): boolean {
  return ["ya", "yes", "true", "1", "y"].includes(String(valueInput ?? "").toLowerCase());
}

function numberValue(valueInput: string | undefined): number {
  const parsed = Number(valueInput);
  return Number.isFinite(parsed) ? parsed : 1;
}

function intArray(valueInput: string, fallback: number[]) {
  if (!valueInput.trim()) return fallback;
  const parsed = valueInput
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(/[|,]/)
    .map((item) => Number(item.trim()));
  if (parsed.length !== 5 || parsed.some((item) => !Number.isInteger(item))) {
    throw new Error("INVALID_SCORING_ARRAY");
  }
  return parsed;
}

function normalizeMapping(
  domainInput: string,
  subdomainInput: string | null,
  indicatorInput: string | null,
) {
  // CSV import is intentionally tolerant. Only taxonomy values that can be
  // resolved exactly are converted to stable codes. Everything else is kept
  // as raw import data and marked PARTIAL, so test/question-bank uploads are
  // persistent without becoming assessment-eligible accidentally.
  const domain = findDomain(domainInput);
  if (!domain) {
    return {
      domain: domainInput,
      subdomain: subdomainInput,
      indicator: indicatorInput,
      mappingStatus: "PARTIAL",
    };
  }

  if (!subdomainInput) {
    return {
      domain: domain.code,
      subdomain: null,
      indicator: null,
      mappingStatus: "PARTIAL",
    };
  }

  const subdomain = findSubdomain(domain.code, subdomainInput);
  if (!subdomain) {
    return {
      domain: domain.code,
      subdomain: subdomainInput,
      indicator: indicatorInput,
      mappingStatus: "PARTIAL",
    };
  }

  if (!indicatorInput) {
    return {
      domain: domain.code,
      subdomain: subdomain.code,
      indicator: null,
      mappingStatus: "PARTIAL",
    };
  }

  const indicator = subdomain.indicators.find((item) => item.code === indicatorInput);
  if (!indicator) {
    return {
      domain: domain.code,
      subdomain: subdomain.code,
      indicator: indicatorInput,
      mappingStatus: "PARTIAL",
    };
  }

  return {
    domain: domain.code,
    subdomain: subdomain.code,
    indicator: indicator.code,
    mappingStatus: "MAPPED",
  };
}

export function parseQuestionCsv(text: string, sourceFile: string): ImportedQuestion[] {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("CSV_EMPTY");

  return rows.map((row, index) => {
    const id = value(row, "id");
    const domainInput = value(row, "domain");
    const textInput = value(row, "pertanyaan", "text");

    if (!id || !domainInput || !textInput) {
      throw new Error(`INVALID_ROW:${index + 2}:ID, Domain, dan Pertanyaan wajib diisi.`);
    }

    const subdomainInput = value(row, "subdomain") || null;
    const indicatorInput = value(row, "indikator", "indicator") || null;
    const mapping = normalizeMapping(domainInput, subdomainInput, indicatorInput);
    const reverseScore = boolValue(value(row, "reverse score", "reversescore", "reverse"));
    const weight = numberValue(value(row, "bobot", "weight"));
    if (weight <= 0) throw new Error(`INVALID_WEIGHT:${id}`);

    const scoringKeyValues = intArray(
      value(row, "scoringkey", "scoring key"),
      reverseScore ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5],
    );

    return {
      id,
      domain: mapping.domain,
      subdomain: mapping.subdomain,
      indicator: mapping.indicator,
      text: textInput,
      type: value(row, "tipe", "type") || "LIKERT",
      reverseScore,
      weight,
      scale: [1, 2, 3, 4, 5] as const,
      scoringKey: (scoringKeyValues[0] === 5
        ? [5, 4, 3, 2, 1]
        : [1, 2, 3, 4, 5]) as ScoringKey,
      difficulty: value(row, "difficulty") || "UNSPECIFIED",
      status: "DRAFT",
      mappingStatus: mapping.mappingStatus,
      sourceFile,
    };
  });
}

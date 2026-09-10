import { normalizeQuestionGroup, questionContractForGroup, type QuestionGroup } from "./question-bank-v11";

export type ImportedQuestion = {
  id: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  text: string;
  type: string;
  answerType: "LIKERT_5" | "SINGLE_CHOICE_4";
  reverseScore: boolean;
  weight: number;
  scale: readonly number[];
  scoringKey: readonly number[];
  options: string[] | null;
  correctOption: number | null;
  difficulty: string;
  status: "DRAFT";
  mappingStatus: "MAPPED" | "PARTIAL";
  sourceFile: string;
};

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && quoted && n === '"') { field += '"'; i += 1; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === "," && !quoted) { row.push(field); field = ""; continue; }
    if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && n === "\n") i += 1;
      row.push(field); field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = []; continue;
    }
    field += c;
  }
  if (quoted) throw new Error("CSV_QUOTE_ERROR");
  if (field.length || row.length) { row.push(field); if (row.some((x) => x.trim() !== "")) rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift()!.map((x) => x.trim().replace(/^\uFEFF/, "").toLowerCase());
  return rows.map((values) => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()])));
}

function value(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) { const v = row[key.toLowerCase()]; if (v !== undefined) return v; }
  return "";
}
function boolValue(v: string) { return ["true", "1", "yes", "ya", "y"].includes(v.toLowerCase()); }
function numberValue(v: string, fallback = 1) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function intArray(v: string, fallback: number[]) {
  if (!v.trim()) return fallback;
  const parsed = v.replace(/^\[/, "").replace(/\]$/, "").split(/[|,]/).map((x) => Number(x.trim()));
  if (!parsed.length || parsed.some((x) => !Number.isInteger(x))) throw new Error("INVALID_INTEGER_ARRAY");
  return parsed;
}
function options(row: Record<string, string>) {
  const raw = value(row, "options", "option", "pilihan", "choices");
  if (!raw) return null;
  const parsed = raw.split("||").map((x) => x.trim()).filter(Boolean);
  return parsed.length ? parsed : null;
}
function normalizeMapping(domainInput: string, subdomainInput: string | null, indicatorInput: string | null) {
  const domain = domainInput.trim();
  const subdomain = subdomainInput?.trim() || null;
  const indicator = indicatorInput?.trim() || null;
  return {
    domain,
    subdomain,
    indicator,
    mappingStatus: domain && subdomain && indicator ? "MAPPED" as const : "PARTIAL" as const,
  };
}

export function parseQuestionCsvForGroup(text: string, sourceFile: string, groupInput: string): ImportedQuestion[] {
  const group = normalizeQuestionGroup(groupInput);
  const contract = questionContractForGroup(group);
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("CSV_EMPTY");
  return rows.map((row, index) => {
    const id = value(row, "id", "code");
    const domainInput = value(row, "domain", "dimension");
    const textInput = value(row, "text", "pertanyaan", "question");
    if (!id || !domainInput || !textInput) throw new Error(`INVALID_ROW:${index + 2}:id, domain/dimension, text wajib diisi`);
    const subdomain = value(row, "subdomain") || null;
    const indicator = value(row, "indicator", "indikator") || null;
    const mapping = normalizeMapping(domainInput, subdomain, indicator);
    const weight = numberValue(value(row, "weight", "bobot"), 1);
    if (!(weight > 0)) throw new Error(`INVALID_WEIGHT:${id}`);
    const reverseScore = boolValue(value(row, "reverseScore", "reverse score", "reverse"));
    const parsedOptions = options(row);
    const scale = intArray(value(row, "scale"), [...contract.scale]);
    const defaultKey = group === "RIASEC" ? [1,2,3,4,5] : group === "DISC" ? [1,2,3,4] : [1];
    const scoringKey = intArray(value(row, "scoringKey", "scoring key"), defaultKey);
    const correctRaw = value(row, "correctOption", "correct option", "jawaban benar");
    const correctOption = correctRaw ? Number(correctRaw) : null;
    if (group !== "RIASEC" && (!parsedOptions || parsedOptions.length !== 4)) throw new Error(`OPTIONS_REQUIRED_4:${id}`);
    // V2 EQ uses an ordinal scoring permutation (option position -> 1..4)
    // and intentionally has no single correct answer. Cognitive remains
    // objective: correctOption + single-value scoringKey.
    if (group === "EQ") {
      const validV2Key =
        correctOption === null &&
        scoringKey.length === 4 &&
        new Set(scoringKey).size === 4 &&
        scoringKey.every((value) => Number.isInteger(value) && value >= 1 && value <= 4);
      const validLegacyObjective =
        correctOption !== null &&
        Number.isInteger(correctOption) && correctOption >= 1 && correctOption <= 4 &&
        scoringKey.length === 1;
      if (!validV2Key && !validLegacyObjective) throw new Error(`EQ_SCORING_CONTRACT_INVALID:${id}`);
    }
    if (group === "IQ_COGNITIVE" &&
        (!Number.isInteger(correctOption) || correctOption! < 1 || correctOption! > 4)) {
      throw new Error(`CORRECT_OPTION_REQUIRED:${id}`);
    }
    if (group === "DISC" && correctOption !== null) throw new Error(`DISC_MUST_NOT_HAVE_CORRECT_OPTION:${id}`);
    if (scale.length !== contract.scale.length) throw new Error(`SCALE_INVALID:${id}`);
    if (group === "DISC" && (scoringKey.length !== 4 || new Set(scoringKey).size !== 4)) throw new Error(`DISC_FORCED_CHOICE_KEY_INVALID:${id}`);
    if (group === "RIASEC" && scoringKey.length !== 5) throw new Error(`RIASEC_SCORING_KEY_INVALID:${id}`);
    if (group === "IQ_COGNITIVE" && scoringKey.length !== 1) throw new Error(`OBJECTIVE_SCORING_KEY_INVALID:${id}`);
    return { id, domain: mapping.domain, subdomain: mapping.subdomain, indicator: mapping.indicator, text: textInput,
      type: value(row, "type", "tipe") || contract.type, answerType: contract.answerType as ImportedQuestion["answerType"], reverseScore,
      weight, scale, scoringKey, options: parsedOptions, correctOption, difficulty: value(row, "difficulty") || "UNSPECIFIED",
      status: "DRAFT", mappingStatus: mapping.mappingStatus, sourceFile };
  });
}

export const QUESTION_BANK_TEMPLATE_HEADERS: Record<QuestionGroup, string[]> = {
  DISC: ["id","domain","subdomain","indicator","text","type","answerType","options","scoringKey","weight","difficulty"],
  RIASEC: ["id","domain","subdomain","indicator","text","type","answerType","scale","scoringKey","reverseScore","weight","difficulty"],
  IQ_COGNITIVE: ["id","domain","subdomain","indicator","text","type","answerType","options","correctOption","scoringKey","weight","difficulty"],
  EQ: ["id","domain","subdomain","indicator","text","type","answerType","options","correctOption","scoringKey","weight","difficulty"],
};

export function questionBankTemplate(groupInput: string) {
  const group = normalizeQuestionGroup(groupInput);
  const headers = QUESTION_BANK_TEMPLATE_HEADERS[group];
  const example = headers.map((h) => {
    const values: Record<string,string> = { id: "EXAMPLE-001", domain: "REPLACE_DOMAIN", subdomain: "REPLACE_SUBDOMAIN", indicator: "REPLACE_INDICATOR", text: "Tulis pertanyaan di sini", type: questionContractForGroup(group).type, answerType: questionContractForGroup(group).answerType, options: "Pilihan 1||Pilihan 2||Pilihan 3||Pilihan 4", correctOption: group === "DISC" || group === "RIASEC" || group === "EQ" ? "" : "1", scoringKey: group === "DISC" ? "1,2,3,4" : group === "RIASEC" ? "1,2,3,4,5" : group === "EQ" ? "1,2,3,4" : "1", scale: "1,2,3,4,5", reverseScore: "false", weight: "1", difficulty: "MEDIUM" };
    return values[h] ?? "";
  });
  const csv = (r: string[]) => r.map((x) => /[,"\n]/.test(x) ? `"${x.replaceAll('"','""')}"` : x).join(",");
  return `${csv(headers)}\n${csv(example)}\n`;
}

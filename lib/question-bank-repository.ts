import crypto from "node:crypto";
import {
  MappingStatus,
  Prisma,
  QuestionDifficulty,
  QuestionStatus,
} from "@prisma/client";
import { prisma } from "./db/prisma";
import { QUESTION_GROUPS, questionGroupFromTestTypeCode, normalizeQuestionGroup, questionContractForGroup, testTypeCodeForGroup, type QuestionGroup } from "./question-bank-v11";
import { createAdminPaginatedResult, normalizeAdminPagination, type AdminPaginationInput, type AdminPaginatedResult } from "./admin-pagination";
import { auditContentOperation, validateQuestionMetadata, findQuestionDuplicate } from "./admin-content-operations";

export type AdminQuestion = {
  id: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  text: string;
  type: string;
  answerType: "LIKERT_5" | "SINGLE_CHOICE_4";
  reverseScore: boolean;
  weight: number;
  scale: number[];
  scoringKey: number[];
  options?: string[] | null;
  correctOption?: number | null;
  difficulty: string;
  status: string;
  mappingStatus: string;
  sourceFile?: string;
  uploadedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  mappingApprovedAt?: string;
  questionId: string;
  questionVersionId: string;
  version: string;
  taxonomyVersion?: string | null;
  testTypeCode: string | null;
  testTypeName: string | null;
  questionGroup: QuestionGroup | null;
  taxonomyNodeCode: string | null;
  taxonomyNodeName: string | null;
  taxonomyNodeType: string | null;
};

type DbQuestionVersion = Prisma.QuestionVersionGetPayload<{
  include: { question: true; testType: true };
}>;

export type QuestionBankListParams = {
  search?: string;
  group?: string;
  status?: string;
  sort?: string;
  direction?: string;
  limit?: number;
  offset?: number;
};

export type QuestionBankSortField = "questionCode" | "updatedAt" | "createdAt" | "status";
export type QuestionBankSortDirection = "asc" | "desc";

/**
 * V11.7.6 Context-Correct Pagination Contract.
 *
 * Pagination is applied only after the canonical latest-version dataset has
 * received all active search/filter constraints and deterministic ordering.
 * The count query uses the exact same context so totalItems/totalPages describe
 * the same result set as the requested page.
 */
export type QuestionBankPaginationIntegrationContract = {
  serverSide: true;
  bounded: true;
  filtersBeforePagination: true;
  searchBeforePagination: true;
  sortBeforePagination: true;
  countUsesSameContext: true;
  deterministicOrdering: true;
  latestVersionOnly: true;
};

export const QUESTION_BANK_PAGINATION_INTEGRATION_CONTRACT: QuestionBankPaginationIntegrationContract = {
  serverSide: true,
  bounded: true,
  filtersBeforePagination: true,
  searchBeforePagination: true,
  sortBeforePagination: true,
  countUsesSameContext: true,
  deterministicOrdering: true,
  latestVersionOnly: true,
};

export type AdminQuestionBankPaginatedParams = Omit<QuestionBankListParams, "limit" | "offset"> & AdminPaginationInput & {
  sort?: string;
  direction?: string;
};

export const QUESTION_BANK_FILTER_GROUPS = ["ALL", ...QUESTION_GROUPS] as const;
export type QuestionBankFilterGroup = typeof QUESTION_BANK_FILTER_GROUPS[number];

export const QUESTION_BANK_FILTER_STATUSES = [
  "ALL",
  ...Object.values(QuestionStatus),
] as const;
export type QuestionBankFilterStatus = typeof QUESTION_BANK_FILTER_STATUSES[number];

export type QuestionBankFilterContract = {
  group: QuestionBankFilterGroup;
  status: QuestionBankFilterStatus;
  serverSide: true;
  latestVersionOnly: true;
  invalidValuesUseDefaults: true;
};

export const QUESTION_BANK_FILTER_CONTRACT: QuestionBankFilterContract = {
  group: "ALL",
  status: "ALL",
  serverSide: true,
  latestVersionOnly: true,
  invalidValuesUseDefaults: true,
};

export function normalizeQuestionBankFilterGroup(value: string | null | undefined): QuestionBankFilterGroup {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized || normalized === "ALL") return "ALL";
  try {
    return normalizeQuestionGroup(normalized);
  } catch {
    return "ALL";
  }
}

export function normalizeQuestionBankFilterStatus(value: string | null | undefined): QuestionBankFilterStatus {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized || normalized === "ALL") return "ALL";
  return (Object.values(QuestionStatus) as string[]).includes(normalized)
    ? normalized as QuestionBankFilterStatus
    : "ALL";
}


export const QUESTION_BANK_SORT_FIELDS = ["questionCode", "updatedAt", "createdAt", "status"] as const;
export const QUESTION_BANK_SORT_DIRECTIONS = ["asc", "desc"] as const;

export type QuestionBankSortContract = {
  field: QuestionBankSortField;
  direction: QuestionBankSortDirection;
  serverSide: true;
  deterministic: true;
  tieBreaker: "questionVersionId";
};

export const QUESTION_BANK_SORT_CONTRACT: QuestionBankSortContract = {
  field: "questionCode",
  direction: "asc",
  serverSide: true,
  deterministic: true,
  tieBreaker: "questionVersionId",
};

export function normalizeQuestionBankSort(value: string | null | undefined): QuestionBankSortField {
  const normalized = String(value ?? "").trim();
  return (QUESTION_BANK_SORT_FIELDS as readonly string[]).includes(normalized)
    ? normalized as QuestionBankSortField
    : "questionCode";
}

export function normalizeQuestionBankSortDirection(value: string | null | undefined): QuestionBankSortDirection {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "desc" ? "desc" : "asc";
}

/**
 * V11.7.1 Search Contract
 *
 * Search is repository/database-owned. The UI may provide a raw query, but the
 * repository is responsible for normalization and bounded matching.
 */
export const QUESTION_BANK_SEARCH_MAX_LENGTH = 120;

export type QuestionBankSearchField =
  | "questionCode"
  | "questionText"
  | "domain"
  | "subdomain"
  | "indicator";

export type QuestionBankSearchContract = {
  query: string | null;
  fields: readonly QuestionBankSearchField[];
  caseInsensitive: true;
  matchMode: "substring";
  maxLength: number;
  serverSide: true;
};

export const QUESTION_BANK_SEARCH_CONTRACT: QuestionBankSearchContract = {
  query: null,
  fields: ["questionCode", "questionText", "domain", "subdomain", "indicator"],
  caseInsensitive: true,
  matchMode: "substring",
  maxLength: QUESTION_BANK_SEARCH_MAX_LENGTH,
  serverSide: true,
};

export function normalizeQuestionBankSearch(value: string | null | undefined): string | null {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  return normalized.slice(0, QUESTION_BANK_SEARCH_MAX_LENGTH);
}

function escapeQuestionBankSearchPattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}


function normalizeDifficulty(value: string): QuestionDifficulty {
  const normalized = value.trim().toUpperCase();
  if (["EASY", "MEDIUM", "HARD", "UNSPECIFIED"].includes(normalized)) {
    return normalized as QuestionDifficulty;
  }
  return QuestionDifficulty.UNSPECIFIED;
}

function normalizeStatus(value: string): QuestionStatus {
  const normalized = value.trim().toUpperCase();
  if (
    [
      "DRAFT",
      "VALIDATED",
      "MAPPED",
      "REVIEW_REQUIRED",
      "APPROVED",
      "PUBLISHED",
      "ARCHIVED",
      "REJECTED",
    ].includes(normalized)
  ) {
    return normalized as QuestionStatus;
  }
  return QuestionStatus.DRAFT;
}

function normalizeMappingStatus(value: string): MappingStatus {
  const normalized = value.trim().toUpperCase();
  if (
    [
      "UNMAPPED",
      "PARTIAL",
      "MAPPED",
      "REVIEW_REQUIRED",
      "APPROVED",
      "REJECTED",
    ].includes(normalized)
  ) {
    return normalized as MappingStatus;
  }
  return MappingStatus.UNMAPPED;
}


function latestVersionMap(rows: DbQuestionVersion[]) {
  const latest = new Map<string, DbQuestionVersion>();
  for (const row of rows) {
    if (!latest.has(row.questionId)) latest.set(row.questionId, row);
  }
  return latest;
}

function toAdminQuestion(row: DbQuestionVersion): AdminQuestion {
  const v = row;
  return {
    id: row.question.code,
    domain: v.domain,
    subdomain: v.subdomain,
    indicator: v.indicator,
    text: v.text,
    type: v.type,
    answerType: v.answerType as AdminQuestion["answerType"],
    reverseScore: v.reverseScore,
    weight: v.weight,
    scale: v.scale.map(Number),
    scoringKey: v.scoringKey.map(Number),
    options: Array.isArray(v.options) ? v.options.map(String) : null,
    correctOption: typeof v.correctOption === "number" ? v.correctOption : null,
    difficulty: v.difficulty,
    status: v.status,
    mappingStatus: v.mappingStatus,
    sourceFile: v.sourceFile ?? undefined,
    questionId: row.question.id,
    questionVersionId: v.id,
    version: v.version,
    taxonomyVersion: v.taxonomyVersion,
    testTypeCode: v.testType?.code ?? null,
    testTypeName: v.testType?.name ?? null,
    questionGroup: questionGroupFromTestTypeCode(v.testType?.code),
    taxonomyNodeCode: null,
    taxonomyNodeName: null,
    taxonomyNodeType: null,
    uploadedAt: v.createdAt.toISOString(),
    approvedAt: v.status === QuestionStatus.APPROVED || v.status === QuestionStatus.PUBLISHED
      ? v.updatedAt.toISOString()
      : undefined,
    publishedAt: v.status === QuestionStatus.PUBLISHED ? v.updatedAt.toISOString() : undefined,
    mappingApprovedAt: v.mappingStatus === MappingStatus.APPROVED ? v.updatedAt.toISOString() : undefined,
  };
}

async function loadLatestVersions() {
  const rows = await prisma.questionVersion.findMany({
    include: { question: true, testType: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return latestVersionMap(rows);
}

async function loadLatestPublishedVersions() {
  const rows = await prisma.questionVersion.findMany({
    where: { status: QuestionStatus.PUBLISHED },
    include: { question: true, testType: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return latestVersionMap(rows);
}

async function loadLatestVersionById(questionId: string) {
  const row = await prisma.questionVersion.findFirst({
    where: { questionId },
    include: { question: true, testType: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  if (!row) throw new Error("QUESTION_NOT_FOUND");
  return row;
}

async function nextVersion(tx: Prisma.TransactionClient, questionId: string) {
  const versions = await tx.questionVersion.findMany({
    where: { questionId },
    select: { version: true },
  });
  const max = versions.reduce((highest, item) => {
    const match = /^v(\d+)$/i.exec(item.version);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `v${max + 1}`;
}

function versionData(input: AdminQuestion, version: string) {
  return {
    version,
    text: input.text.trim(),
    domain: input.domain.trim(),
    subdomain: input.subdomain?.trim() || null,
    indicator: input.indicator?.trim() || null,
    type: input.type?.trim() || "LIKERT",
    answerType: input.answerType ?? "LIKERT_5",
    reverseScore: Boolean(input.reverseScore),
    weight: Number(input.weight) > 0 ? Number(input.weight) : 1,
    scale: [...input.scale],
    scoringKey: [...input.scoringKey],
    difficulty: normalizeDifficulty(input.difficulty),
    status: normalizeStatus(input.status),
    mappingStatus: normalizeMappingStatus(input.mappingStatus),
    sourceFile: input.sourceFile ?? null,
    options: input.options ? [...input.options] : undefined,
    correctOption: input.correctOption ?? undefined,
  };
}


type AdminQuestionBankRawRow = {
  questionId: string;
  questionCode: string;
  questionVersionId: string;
  version: string;
  taxonomyVersion: string | null;
  testTypeCode: string | null;
  testTypeName: string | null;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  text: string;
  type: string;
  answerType: string;
  reverseScore: boolean;
  weight: number;
  scale: number[];
  scoringKey: number[];
  options: unknown;
  correctOption: number | null;
  difficulty: string;
  status: string;
  mappingStatus: string;
  sourceFile: string | null;
  createdAt: Date;
  updatedAt: Date;
  taxonomyNodeCode?: string | null;
  taxonomyNodeName?: string | null;
  taxonomyNodeType?: string | null;
};

function toAdminQuestionFromRaw(row: AdminQuestionBankRawRow): AdminQuestion {
  return {
    id: row.questionCode,
    domain: row.domain,
    subdomain: row.subdomain,
    indicator: row.indicator,
    text: row.text,
    type: row.type,
    answerType: row.answerType as AdminQuestion["answerType"],
    reverseScore: row.reverseScore,
    weight: Number(row.weight),
    scale: Array.isArray(row.scale) ? row.scale.map(Number) : [],
    scoringKey: Array.isArray(row.scoringKey) ? row.scoringKey.map(Number) : [],
    options: Array.isArray(row.options) ? row.options.map(String) : null,
    correctOption: typeof row.correctOption === "number" ? row.correctOption : null,
    difficulty: row.difficulty,
    status: row.status,
    mappingStatus: row.mappingStatus,
    sourceFile: row.sourceFile ?? undefined,
    questionId: row.questionId,
    questionVersionId: row.questionVersionId,
    version: row.version,
    taxonomyVersion: row.taxonomyVersion,
    testTypeCode: row.testTypeCode,
    testTypeName: row.testTypeName,
    questionGroup: questionGroupFromTestTypeCode(row.testTypeCode),
    taxonomyNodeCode: row.taxonomyNodeCode ?? null,
    taxonomyNodeName: null,
    taxonomyNodeType: null,
    uploadedAt: row.createdAt.toISOString(),
    approvedAt: row.status === QuestionStatus.APPROVED || row.status === QuestionStatus.PUBLISHED
      ? row.updatedAt.toISOString()
      : undefined,
    publishedAt: row.status === QuestionStatus.PUBLISHED ? row.updatedAt.toISOString() : undefined,
    mappingApprovedAt: row.mappingStatus === MappingStatus.APPROVED ? row.updatedAt.toISOString() : undefined,
  };
}

async function attachTaxonomyNodeDisplay<T extends { taxonomyVersion?: string | null; testTypeCode: string | null; domain: string; subdomain: string | null; indicator: string | null }>(rows: T[]): Promise<Array<T & { taxonomyNodeCode: string | null; taxonomyNodeName: string | null; taxonomyNodeType: string | null }>> {
  const versions = [...new Set(rows.map(r => r.taxonomyVersion).filter((v): v is string => Boolean(v)))];
  const testTypes = [...new Set(rows.map(r => r.testTypeCode).filter((v): v is string => Boolean(v)))];
  if (!versions.length || !testTypes.length) return rows.map(row => ({ ...row, taxonomyNodeCode: null, taxonomyNodeName: null, taxonomyNodeType: null }));
  const taxonomies = await prisma.taxonomyVersion.findMany({
    where: { version: { in: versions }, testType: { code: { in: testTypes } } },
    include: { nodes: true },
  });
  const byKey = new Map<string, typeof taxonomies[number]>();
  for (const taxonomy of taxonomies) byKey.set(`${taxonomy.testTypeId}::${taxonomy.version}`, taxonomy);
  const testTypeIds = await prisma.testType.findMany({ where: { code: { in: testTypes } }, select: { id: true, code: true } });
  const idByCode = new Map(testTypeIds.map(t => [t.code, t.id]));
  return rows.map(row => {
    const taxonomy = row.taxonomyVersion && row.testTypeCode ? byKey.get(`${idByCode.get(row.testTypeCode) ?? ''}::${row.taxonomyVersion}`) : undefined;
    if (!taxonomy) return { ...row, taxonomyNodeCode: null, taxonomyNodeName: null, taxonomyNodeType: null };
    const candidates = [row.domain, row.subdomain, row.indicator].filter(Boolean).map(v => v!.trim().toUpperCase());
    const node = taxonomy.nodes.find(n => candidates.includes(n.code.trim().toUpperCase()));
    return { ...row, taxonomyNodeCode: node?.code ?? null, taxonomyNodeName: node?.name ?? null, taxonomyNodeType: node?.nodeType ?? null };
  });
}

export async function getAdminQuestionsPaginated(
  params: AdminQuestionBankPaginatedParams = {},
): Promise<AdminPaginatedResult<AdminQuestion>> {
  const pagination = normalizeAdminPagination(params);
  const conditions: Prisma.Sql[] = [Prisma.sql`latest.rn = 1`];

  const group = normalizeQuestionBankFilterGroup(params.group);
  if (group !== "ALL") {
    conditions.push(Prisma.sql`latest."testTypeCode" = ${testTypeCodeForGroup(group)}`);
  }

  const search = normalizeQuestionBankSearch(params.search);
  if (search) {
    const pattern = `%${escapeQuestionBankSearchPattern(search)}%`;
    conditions.push(Prisma.sql`(
      latest."questionCode" ILIKE ${pattern} ESCAPE '\\'
      OR latest."text" ILIKE ${pattern} ESCAPE '\\'
      OR latest."domain" ILIKE ${pattern} ESCAPE '\\'
      OR COALESCE(latest."subdomain", '') ILIKE ${pattern} ESCAPE '\\'
      OR COALESCE(latest."indicator", '') ILIKE ${pattern} ESCAPE '\\'
    )`);
  }

  const status = normalizeQuestionBankFilterStatus(params.status);
  if (status !== "ALL") {
    conditions.push(Prisma.sql`(latest."status"::text = ${status} OR latest."mappingStatus"::text = ${status})`);
  }

  const where = Prisma.join(conditions, " AND ");
  const sort = normalizeQuestionBankSort(params.sort);
  const direction = normalizeQuestionBankSortDirection(params.direction);
  const sortColumn = {
    questionCode: Prisma.sql`latest."questionCode"`,
    updatedAt: Prisma.sql`latest."updatedAt"`,
    createdAt: Prisma.sql`latest."createdAt"`,
    status: Prisma.sql`latest."status"`,
  }[sort];
  const sortDirection = direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const ranked = Prisma.sql`
    WITH ranked AS (
      SELECT
        q.id AS "questionId",
        q.code AS "questionCode",
        qv.id AS "questionVersionId",
        qv.version AS "version",
        qv."taxonomyVersion" AS "taxonomyVersion",
        tt.code AS "testTypeCode",
        tt.name AS "testTypeName",
        qv.domain AS "domain",
        qv.subdomain AS "subdomain",
        qv.indicator AS "indicator",
        qv.text AS "text",
        qv.type AS "type",
        qv."answerType" AS "answerType",
        qv."reverseScore" AS "reverseScore",
        qv.weight AS "weight",
        qv.scale AS "scale",
        qv."scoringKey" AS "scoringKey",
        qv.options AS "options",
        qv."correctOption" AS "correctOption",
        qv.difficulty AS "difficulty",
        qv.status AS "status",
        qv."mappingStatus" AS "mappingStatus",
        qv."sourceFile" AS "sourceFile",
        qv."createdAt" AS "createdAt",
        qv."updatedAt" AS "updatedAt",
        ROW_NUMBER() OVER (
          PARTITION BY qv."questionId"
          ORDER BY qv."createdAt" DESC, qv.id DESC
        ) AS rn
      FROM "QuestionVersion" qv
      INNER JOIN "Question" q ON q.id = qv."questionId"
      LEFT JOIN "TestType" tt ON tt.id = qv."testTypeId"
    )
  `;

  const [countRows, rows] = await prisma.$transaction([
    prisma.$queryRaw<{ totalItems: bigint }[]>(Prisma.sql`${ranked}, latest AS (SELECT * FROM ranked) SELECT COUNT(*)::bigint AS "totalItems" FROM latest WHERE ${where}`),
    prisma.$queryRaw<AdminQuestionBankRawRow[]>(Prisma.sql`${ranked}, latest AS (SELECT * FROM ranked) SELECT
      latest."questionId", latest."questionCode", latest."questionVersionId", latest."version",
      latest."taxonomyVersion", latest."testTypeCode", latest."testTypeName", latest."domain",
      latest."subdomain", latest."indicator", latest."text", latest."type", latest."answerType",
      latest."reverseScore", latest."weight", latest."scale", latest."scoringKey", latest."options",
      latest."correctOption", latest."difficulty"::text AS "difficulty", latest."status"::text AS "status",
      latest."mappingStatus"::text AS "mappingStatus", latest."sourceFile", latest."createdAt", latest."updatedAt"
      FROM latest WHERE ${where}
      ORDER BY ${sortColumn} ${sortDirection}, latest."questionVersionId" ${sortDirection}
      LIMIT ${pagination.limit} OFFSET ${pagination.offset}`),
  ]);

  const totalItems = Number(countRows[0]?.totalItems ?? 0);
  const enrichedRows = await attachTaxonomyNodeDisplay(rows);
  return createAdminPaginatedResult(enrichedRows.map(row => ({ ...toAdminQuestionFromRaw(row), taxonomyNodeCode: row.taxonomyNodeCode, taxonomyNodeName: row.taxonomyNodeName, taxonomyNodeType: row.taxonomyNodeType })), { page: pagination.page, pageSize: pagination.pageSize }, totalItems);
}

export async function getQuestions(params: QuestionBankListParams = {}): Promise<AdminQuestion[]> {
  const latest = await loadLatestVersions();
  let result = [...latest.values()].map(toAdminQuestion);

  const group = params.group ? normalizeQuestionGroup(params.group) : null;
  if (group) result = result.filter((q) => q.questionGroup === group);

  const search = params.search?.trim().toLowerCase();
  if (search) {
    result = result.filter((q) =>
      `${q.id} ${q.text} ${q.domain} ${q.subdomain ?? ""} ${q.indicator ?? ""}`
        .toLowerCase()
        .includes(search),
    );
  }

  const status = params.status?.trim().toUpperCase();
  if (status && status !== "ALL") {
    result = result.filter(
      (q) => q.status.toUpperCase() === status || q.mappingStatus.toUpperCase() === status,
    );
  }

  const enriched = await attachTaxonomyNodeDisplay(result);
  result = enriched.map(row => ({ ...row, taxonomyNodeCode: row.taxonomyNodeCode ?? null, taxonomyNodeName: row.taxonomyNodeName ?? null, taxonomyNodeType: row.taxonomyNodeType ?? null }));

  result.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const offset = Math.max(0, params.offset ?? 0);
  const limit = Math.min(5000, Math.max(1, params.limit ?? 5000));
  return result.slice(offset, offset + limit);
}

export async function getQuestionById(questionId: string) {
  const question = toAdminQuestion(await loadLatestVersionById(questionId));
  const [enriched] = await attachTaxonomyNodeDisplay([question]);
  return { ...question, taxonomyNodeCode: enriched.taxonomyNodeCode ?? null, taxonomyNodeName: enriched.taxonomyNodeName ?? null, taxonomyNodeType: enriched.taxonomyNodeType ?? null };
}

export type QuestionBankStatsContext = {
  group?: string;
  status?: string;
  search?: string;
};

/**
 * V11.7.7 Context-Correct Statistics.
 *
 * Summary cards use the same latest-version/search/filter context as the
 * canonical Question Bank page. Sort and pagination intentionally do not
 * affect summary totals because they describe the complete active result set.
 */
export async function getQuestionBankStats(context: QuestionBankStatsContext = {}) {
  const conditions: Prisma.Sql[] = [Prisma.sql`latest.rn = 1`];
  const group = normalizeQuestionBankFilterGroup(context.group);
  if (group !== "ALL") {
    conditions.push(Prisma.sql`latest."testTypeCode" = ${testTypeCodeForGroup(group)}`);
  }

  const search = normalizeQuestionBankSearch(context.search);
  if (search) {
    const pattern = `%${escapeQuestionBankSearchPattern(search)}%`;
    conditions.push(Prisma.sql`(
      latest."questionCode" ILIKE ${pattern} ESCAPE '\\'
      OR latest."text" ILIKE ${pattern} ESCAPE '\\'
      OR latest."domain" ILIKE ${pattern} ESCAPE '\\'
      OR COALESCE(latest."subdomain", '') ILIKE ${pattern} ESCAPE '\\'
      OR COALESCE(latest."indicator", '') ILIKE ${pattern} ESCAPE '\\'
    )`);
  }

  const status = normalizeQuestionBankFilterStatus(context.status);
  if (status !== "ALL") {
    conditions.push(Prisma.sql`(latest."status"::text = ${status} OR latest."mappingStatus"::text = ${status})`);
  }

  const where = Prisma.join(conditions, " AND ");
  const ranked = Prisma.sql`
    WITH ranked AS (
      SELECT
        qv."questionId" AS "questionId",
        qv.id AS "questionVersionId",
        qv.status AS "status",
        qv."mappingStatus" AS "mappingStatus",
        qv."testTypeId" AS "testTypeId",
        tt.code AS "testTypeCode",
        q.code AS "questionCode",
        qv.text AS "text",
        qv.domain AS "domain",
        qv.subdomain AS "subdomain",
        qv.indicator AS "indicator",
        qv."updatedAt" AS "updatedAt",
        qv.type AS "type",
        qv."answerType" AS "answerType",
        qv.weight AS "weight",
        qv.scale AS "scale",
        qv."scoringKey" AS "scoringKey",
        ROW_NUMBER() OVER (
          PARTITION BY qv."questionId"
          ORDER BY qv."createdAt" DESC, qv.id DESC
        ) AS rn
      FROM "QuestionVersion" qv
      INNER JOIN "Question" q ON q.id = qv."questionId"
      LEFT JOIN "TestType" tt ON tt.id = qv."testTypeId"
    ), latest AS (SELECT * FROM ranked)
    SELECT
      COUNT(*)::bigint AS "total",
      COUNT(*) FILTER (WHERE latest."status"::text = 'DRAFT')::bigint AS "draft",
      COUNT(*) FILTER (WHERE latest."status"::text = 'VALIDATED')::bigint AS "validated",
      COUNT(*) FILTER (WHERE latest."mappingStatus"::text IN ('MAPPED', 'APPROVED'))::bigint AS "mapped",
      COUNT(*) FILTER (WHERE latest."mappingStatus"::text = 'REVIEW_REQUIRED')::bigint AS "mappingReview",
      COUNT(*) FILTER (WHERE latest."mappingStatus"::text = 'PARTIAL')::bigint AS "partial",
      COUNT(*) FILTER (WHERE latest."status"::text = 'APPROVED')::bigint AS "approved",
      COUNT(*) FILTER (WHERE latest."status"::text = 'PUBLISHED')::bigint AS "published",
      COUNT(*) FILTER (WHERE
        latest."status"::text = 'PUBLISHED'
        AND latest."mappingStatus"::text = 'APPROVED'
        AND LENGTH(TRIM(latest."text")) > 0
        AND LENGTH(TRIM(latest."domain")) > 0
        AND latest."subdomain" IS NOT NULL AND LENGTH(TRIM(latest."subdomain")) > 0
        AND latest."indicator" IS NOT NULL AND LENGTH(TRIM(latest."indicator")) > 0
        AND latest."weight" > 0
        AND ((latest."answerType" = 'SINGLE_CHOICE_4' AND COALESCE(array_length(latest."scale", 1), 0) = 4 AND COALESCE(array_length(latest."scoringKey", 1), 0) >= 1)
          OR (latest."answerType" = 'LIKERT_5' AND COALESCE(array_length(latest."scale", 1), 0) = 5 AND COALESCE(array_length(latest."scoringKey", 1), 0) = 5))
      )::bigint AS "eligible",
      MAX(latest."updatedAt") AS "updatedAt"
    FROM latest
    WHERE ${where}
  `;

  const latest = await prisma.questionVersion.findFirst({
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { updatedAt: true },
  });
  const [row] = await prisma.$queryRaw<{
    total: bigint;
    draft: bigint;
    validated: bigint;
    mapped: bigint;
    mappingReview: bigint;
    partial: bigint;
    approved: bigint;
    published: bigint;
    eligible: bigint;
    updatedAt: Date | null;
  }[]>(ranked);

  const total = Number(row?.total ?? 0);
  const updatedAt = row?.updatedAt ?? latest?.updatedAt ?? null;
  const questionBankVersion = `QB_DB_${updatedAt?.toISOString().replace(/\D/g, "").slice(0, 14) ?? "EMPTY"}_${total}`;

  return {
    total,
    draft: Number(row?.draft ?? 0),
    validated: Number(row?.validated ?? 0),
    mapped: Number(row?.mapped ?? 0),
    mappingReview: Number(row?.mappingReview ?? 0),
    partial: Number(row?.partial ?? 0),
    approved: Number(row?.approved ?? 0),
    published: Number(row?.published ?? 0),
    eligible: Number(row?.eligible ?? 0),
    questionBankVersion,
    updatedAt: updatedAt?.toISOString() ?? new Date(0).toISOString(),
    context: {
      group,
      status,
      search,
      scope: "active-workspace",
    },
  };
}

export async function getPublishedEligibleQuestions(testTypeCode?: string) {
  const latest = await loadLatestPublishedVersions();
  let candidates = [...latest.values()];

  if (testTypeCode) {
    const testType = await prisma.testType.findUnique({
      where: { code: testTypeCode.trim().toUpperCase() },
      select: { id: true },
    });
    if (!testType) throw new Error(`TEST_TYPE_NOT_FOUND:${testTypeCode}`);
    candidates = candidates.filter((v) => v.testTypeId === testType.id);
  }
  return candidates
    .filter(
      (v) =>
        v.status === QuestionStatus.PUBLISHED &&
        v.mappingStatus === MappingStatus.APPROVED &&
        v.text.trim().length > 0 &&
        v.domain.trim().length > 0 &&
        Boolean(v.subdomain?.trim()) &&
        Boolean(v.indicator?.trim()) &&
        v.weight > 0 &&
        ((v.testType?.code === "RIASEC" && v.answerType === "LIKERT_5" && v.scale.length === 5 && v.scoringKey.length === 5) ||
          ((v.testType?.code === "DISC" || v.testType?.code === "EQ" || v.testType?.code === "COGNITIVE") && v.answerType === "SINGLE_CHOICE_4" && v.scale.length === 4 && ((v.testType?.code === "DISC" && v.scoringKey.length === 4) || (v.testType?.code !== "DISC" && v.scoringKey.length === 1)))),
    )
    .map((v) => ({
      ...toAdminQuestion(v),
      // Stable public/runtime ID is Question.code; persistence requires the
      // canonical PostgreSQL Question.id.
      questionRecordId: v.question.id,
      questionVersionId: v.id,
    }));
}

export type QuestionBankImportDuplicateAnalysis = {
  totalRows: number;
  uniqueQuestionIds: number;
  duplicateExistingIds: string[];
  duplicateExistingCount: number;
  duplicateInFileIds: string[];
  duplicateInFileCount: number;
  duplicateInFileExtraRows: number;
  readyRows: number;
  importBlocked: boolean;
};

export const QUESTION_BANK_IMPORT_DUPLICATE_PREVIEW_LIMIT = 20;

/**
 * V11.7.9 Import-as-Draft Safety Contract.
 *
 * CSV import is an operations convenience, never a lifecycle escalation path.
 * Every assessment-facing version created by the import path is forced to DRAFT
 * at the repository boundary, regardless of any status-like value supplied by
 * an upstream caller or parsed payload.
 */
export type QuestionBankImportAsDraftContract = {
  serverEnforced: true;
  forcedStatus: QuestionStatus;
  noAutoPublish: true;
  noAutoActivate: true;
  noExistingPublishedMutation: true;
  transactional: true;
};

export const QUESTION_BANK_IMPORT_AS_DRAFT_CONTRACT: QuestionBankImportAsDraftContract = {
  serverEnforced: true,
  forcedStatus: QuestionStatus.DRAFT,
  noAutoPublish: true,
  noAutoActivate: true,
  noExistingPublishedMutation: true,
  transactional: true,
};

function importAsDraftVersionData(input: AdminQuestion, version: string, overrides: { testTypeId?: string | null; taxonomyVersion?: string | null } = {}) {
  return {
    ...versionData({ ...input, status: QuestionStatus.DRAFT }, version),
    testTypeId: overrides.testTypeId ?? undefined,
    taxonomyVersion: overrides.taxonomyVersion ?? null,
    status: QuestionStatus.DRAFT,
  };
}

/**
 * Analyze CSV logical Question IDs before an import commit.
 * This query is intentionally independent of the active Question Bank
 * workspace filters/pagination: logical identity is global.
 */
export async function analyzeQuestionBankImportDuplicates(questionIds: string[]): Promise<QuestionBankImportDuplicateAnalysis> {
  const normalizedIds = questionIds.map((id) => id.trim()).filter(Boolean);
  const counts = new Map<string, number>();
  for (const id of normalizedIds) counts.set(id, (counts.get(id) ?? 0) + 1);

  const duplicateInFileAll = [...counts.entries()].filter(([, count]) => count > 1);
  const duplicateInFileIds = duplicateInFileAll
    .map(([id]) => id)
    .slice(0, QUESTION_BANK_IMPORT_DUPLICATE_PREVIEW_LIMIT);
  const duplicateInFileExtraRows = duplicateInFileAll.reduce((sum, [, count]) => sum + Math.max(0, count - 1), 0);

  const uniqueIds = [...counts.keys()];
  const existing = uniqueIds.length
    ? await prisma.question.findMany({
        where: { code: { in: uniqueIds } },
        select: { code: true },
      })
    : [];
  const existingSet = new Set(existing.map((question) => question.code));
  const duplicateExistingIds = existing
    .map((question) => question.code)
    .slice(0, QUESTION_BANK_IMPORT_DUPLICATE_PREVIEW_LIMIT);
  const duplicateExistingRows = existing.reduce((sum, question) => sum + (counts.get(question.code) ?? 0), 0);

  return {
    totalRows: normalizedIds.length,
    uniqueQuestionIds: uniqueIds.length,
    duplicateExistingIds,
    duplicateExistingCount: existingSet.size,
    duplicateInFileIds,
    duplicateInFileCount: duplicateInFileAll.length,
    duplicateInFileExtraRows,
    readyRows: Math.max(0, normalizedIds.length - duplicateExistingRows - duplicateInFileExtraRows),
    importBlocked: duplicateExistingRows > 0 || duplicateInFileExtraRows > 0,
  };
}

/**
 * V11.7.10 Existing Question / Version Governance Contract.
 *
 * Question Bank CSV import is append-only at the logical-identity boundary.
 * An existing Question code is a duplicate and is rejected; import must never
 * silently reinterpret an existing logical Question as a new QuestionVersion.
 * Deliberate version creation remains a separate governed EDIT/version flow.
 */
export type QuestionBankExistingQuestionGovernanceContract = {
  existingQuestionAction: "REJECT_DUPLICATE";
  silentOverwrite: false;
  implicitVersionCreation: false;
  importMode: "APPEND_ONLY";
  versionCreationFlow: "EXPLICIT_EDIT";
};

export const QUESTION_BANK_EXISTING_QUESTION_GOVERNANCE_CONTRACT: QuestionBankExistingQuestionGovernanceContract = {
  existingQuestionAction: "REJECT_DUPLICATE",
  silentOverwrite: false,
  implicitVersionCreation: false,
  importMode: "APPEND_ONLY",
  versionCreationFlow: "EXPLICIT_EDIT",
};

export async function importAdminQuestions(incoming: AdminQuestion[], mode: "append", actorUserId?: string, groupInput?: string) {
  if (mode !== "append") throw new Error("IMPORT_MODE_NOT_SUPPORTED");
  const group = groupInput ? normalizeQuestionGroup(groupInput) : null;
  const incomingIds = new Set<string>();
  for (const q of incoming) {
    if (incomingIds.has(q.id)) throw new Error(`DUPLICATE_QUESTION_IDS:${q.id}`);
    incomingIds.add(q.id);
  }

  for (const q of incoming) {
    if (group && q.questionGroup !== group) throw new Error(`QUESTION_GROUP_MISMATCH:${q.id}`);
  }

  const importTestTypeCode = group ? testTypeCodeForGroup(group) : String(incoming[0]?.testTypeCode ?? "").trim().toUpperCase();
  if (!importTestTypeCode) throw new Error("IMPORT_TEST_TYPE_REQUIRED");
  const importTestType = await prisma.testType.findFirst({
    where: { code: importTestTypeCode, status: "ACTIVE" },
    select: { id: true, code: true },
  });
  if (!importTestType) throw new Error(`TEST_TYPE_NOT_FOUND:${importTestTypeCode}`);
  const activeTaxonomy = await prisma.taxonomyVersion.findFirst({
    where: { testTypeId: importTestType.id, status: "ACTIVE" },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { version: true },
  });
  if (!activeTaxonomy) throw new Error(`ACTIVE_TAXONOMY_NOT_FOUND:${importTestTypeCode}`);

  const existing = await prisma.question.findMany({
    where: { code: { in: [...incomingIds] } },
    select: { id: true, code: true },
  });
  const existingCodes = new Set(existing.map((q) => q.code));

  if (mode === "append") {
    const duplicates = [...incomingIds].filter((id) => existingCodes.has(id));
    if (duplicates.length) {
      throw new Error(`DUPLICATE_QUESTION_IDS:${duplicates.slice(0, 20).join(",")}`);
    }
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const q of incoming) {
      // Existing logical Question IDs are rejected before the transaction.
      // This branch is therefore intentionally unreachable for valid append imports.
      // Keeping the invariant explicit prevents future refactors from turning import
      // into an implicit version-creation path.
      await tx.question.create({
        data: {
          id: q.id,
          code: q.id,
          versions: { create: importAsDraftVersionData(q, "v1", { testTypeId: importTestType.id, taxonomyVersion: activeTaxonomy.version }) },
        },
      });
    }

  });

  if (actorUserId) {
    for (const q of incoming) {
      const logical = await prisma.question.findUnique({ where: { code: q.id }, select: { id: true } });
      const latest = logical ? await loadLatestVersionById(logical.id).catch(() => null) : null;
      if (latest) {
        await auditContentOperation({ entityType: "QUESTION_VERSION", entityId: latest.id, action: "IMPORT", fromStatus: null, toStatus: latest.status, actorUserId, metadata: { sourceFile: q.sourceFile, questionGroup: latest.testType?.code } });
      }
    }
  }

  const stats = await getQuestionBankStats();
  return {
    imported: incoming.length,
    mode,
    questionBankVersion: stats.questionBankVersion,
    total: stats.total,
    importedAt: now.toISOString(),
  };
}

export async function updateQuestionMapping(
  questionId: string,
  input: { domain: string; subdomain: string | null; indicator: string | null },
) {
  const mapping = { domain: input.domain.trim(), subdomain: input.subdomain?.trim() || null, indicator: input.indicator?.trim() || null };
  if (!mapping.domain) throw new Error("INVALID_DOMAIN");
  const current = await loadLatestVersionById(questionId);
  if (current.status === QuestionStatus.PUBLISHED) throw new Error("UNPUBLISH_BEFORE_MAPPING");

  const next: AdminQuestion = {
    ...toAdminQuestion(current),
    domain: mapping.domain,
    subdomain: mapping.subdomain,
    indicator: mapping.indicator,
    status: "DRAFT",
    mappingStatus: mapping.subdomain && mapping.indicator ? "MAPPED" : "PARTIAL",
  };

  await prisma.$transaction(async (tx) => {
    const version = await nextVersion(tx, questionId);
    await tx.questionVersion.create({
      data: {
        questionId,
        testTypeId: current.testTypeId,
        taxonomyVersion: current.taxonomyVersion,
        ...versionData(next, version),
        status: QuestionStatus.DRAFT,
        mappingStatus: mapping.subdomain && mapping.indicator ? MappingStatus.MAPPED : MappingStatus.PARTIAL,
      },
    });
  });

  return getQuestionById(questionId);
}

export async function approveMapping(questionId: string) {
  const current = await loadLatestVersionById(questionId);
  if (!current.subdomain || !current.indicator) throw new Error("MAPPING_INCOMPLETE");
  const mappingReady =
    current.mappingStatus === MappingStatus.MAPPED ||
    current.mappingStatus === MappingStatus.REVIEW_REQUIRED;

  if (!mappingReady) {
    throw new Error("MAPPING_NOT_READY");
  }
  await prisma.questionVersion.update({ where: { id: current.id }, data: { mappingStatus: MappingStatus.APPROVED } });
  return getQuestionById(questionId);
}

export async function approveQuestion(questionId: string) {
  const current = await loadLatestVersionById(questionId);
  if (current.mappingStatus !== MappingStatus.APPROVED) throw new Error("MAPPING_NOT_APPROVED");
  await prisma.questionVersion.update({ where: { id: current.id }, data: { status: QuestionStatus.APPROVED } });
  return getQuestionById(questionId);
}

export async function publishQuestion(questionId: string) {
  const current = await loadLatestVersionById(questionId);
  if (current.status !== QuestionStatus.APPROVED) throw new Error("QUESTION_NOT_APPROVED");
  if (current.mappingStatus !== MappingStatus.APPROVED) throw new Error("MAPPING_NOT_APPROVED");
  await prisma.questionVersion.update({ where: { id: current.id }, data: { status: QuestionStatus.PUBLISHED } });
  return getQuestionById(questionId);
}

export async function unpublishQuestion(questionId: string) {
  const current = await loadLatestVersionById(questionId);
  if (current.status !== QuestionStatus.PUBLISHED) throw new Error("QUESTION_NOT_PUBLISHED");
  await prisma.questionVersion.update({ where: { id: current.id }, data: { status: QuestionStatus.APPROVED } });
  return getQuestionById(questionId);
}

export async function bulkQuestionBankAction(input: {
  action: "UPDATE_MAPPING" | "APPROVE_MAPPING" | "APPROVE" | "PUBLISH" | "UNPUBLISH";
  questionIds: string[];
  mapping?: { domain: string; subdomain: string | null; indicator: string | null };
}) {
  if (input.action === "UPDATE_MAPPING" && !input.mapping?.domain) throw new Error("INVALID_MAPPING");

  const results: AdminQuestion[] = [];
  const errors: Array<{ id: string; message: string }> = [];

  for (const id of [...new Set(input.questionIds)]) {
    try {
      const result = input.action === "UPDATE_MAPPING"
        ? await updateQuestionMapping(id, input.mapping!)
        : input.action === "APPROVE_MAPPING"
          ? await approveMapping(id)
          : input.action === "APPROVE"
            ? await approveQuestion(id)
            : input.action === "PUBLISH"
              ? await publishQuestion(id)
              : await unpublishQuestion(id);
      results.push(result);
    } catch (error) {
      errors.push({ id, message: error instanceof Error ? error.message : "Action gagal." });
    }
  }

  return { results, errors };
}


export async function getQuestionBankGroupStats() {
  const questions = [...(await loadLatestVersions()).values()].map(toAdminQuestion);
  return (["DISC", "RIASEC", "IQ_COGNITIVE", "EQ"] as const).map((group) => {
    const qs = questions.filter((q) => q.questionGroup === group);
    return { group, total: qs.length, draft: qs.filter(q => q.status === "DRAFT").length, review: qs.filter(q => q.status === "REVIEW_REQUIRED").length, published: qs.filter(q => q.status === "PUBLISHED").length, mapped: qs.filter(q => q.mappingStatus === "APPROVED").length };
  });
}

export async function getQuestionBankTestTypes() {
  return prisma.testType.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, code: true, name: true, category: true, runtimeKey: true },
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });
}

function assertEditable(current: DbQuestionVersion) {
  if (current.status === QuestionStatus.ARCHIVED) throw new Error("QUESTION_ARCHIVED");
}

export type QuestionVersionInput = {
  text: string; domain: string; subdomain: string | null; indicator: string | null; difficulty: string;
  type?: string; answerType?: "LIKERT_5" | "SINGLE_CHOICE_4"; reverseScore?: boolean; weight?: number; scale?: number[]; scoringKey?: number[]; options?: string[] | null; correctOption?: number | null;
};

export async function createQuestionVersion(questionId: string, input: QuestionVersionInput) {
  const current = await loadLatestVersionById(questionId);
  assertEditable(current);
  const mapping = { domain: input.domain.trim(), subdomain: input.subdomain?.trim() || null, indicator: input.indicator?.trim() || null };
  if (!mapping.domain) throw new Error("INVALID_DOMAIN");
  const currentAdmin = toAdminQuestion(current);
  const next: AdminQuestion = { ...currentAdmin, text: input.text, domain: mapping.domain, subdomain: mapping.subdomain, indicator: mapping.indicator, difficulty: input.difficulty, type: input.type ?? currentAdmin.type, answerType: (input.answerType ?? currentAdmin.answerType) as AdminQuestion["answerType"], reverseScore: input.reverseScore ?? currentAdmin.reverseScore, weight: input.weight ?? currentAdmin.weight, scale: input.scale ?? currentAdmin.scale, scoringKey: input.scoringKey ?? currentAdmin.scoringKey, options: input.options ?? currentAdmin.options, correctOption: input.correctOption ?? currentAdmin.correctOption, status: "DRAFT", mappingStatus: mapping.subdomain && mapping.indicator ? "MAPPED" : "PARTIAL" };
  const errors = validateQuestionMetadata({ ...next, testTypeId: current.testTypeId });
  if (errors.length) throw new Error(`CONTENT_VALIDATION_FAILED:${errors.join(",")}`);
  await prisma.$transaction(async (tx) => {
    const version = await nextVersion(tx, questionId);
    await tx.questionVersion.create({ data: { questionId, testTypeId: current.testTypeId, taxonomyVersion: current.taxonomyVersion, ...versionData(next, version), status: QuestionStatus.DRAFT, mappingStatus: mapping.subdomain && mapping.indicator ? MappingStatus.MAPPED : MappingStatus.PARTIAL } });
  });
  return getQuestionById(questionId);
}

export async function createLogicalQuestion(input: {
  code: string;
  text: string;
  testTypeId: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  difficulty: string;
  type?: string; answerType?: "LIKERT_5" | "SINGLE_CHOICE_4"; reverseScore?: boolean; weight?: number; scale?: number[]; scoringKey?: number[]; options?: string[] | null; correctOption?: number | null;
}) {
  const code = input.code.trim();
  if (!/^[A-Za-z0-9._-]{2,80}$/.test(code)) throw new Error("INVALID_QUESTION_CODE");
  const exists = await prisma.question.findUnique({ where: { code }, select: { id: true } });
  if (exists) throw new Error("QUESTION_CODE_ALREADY_EXISTS");
  const testType = await prisma.testType.findFirst({
    where: { id: input.testTypeId, status: "ACTIVE" },
    select: { id: true, code: true },
  });
  if (!testType) throw new Error("TEST_TYPE_NOT_FOUND");
  const group = questionGroupFromTestTypeCode(testType.code);
  if (!group) throw new Error("UNSUPPORTED_QUESTION_GROUP");
  const expected = questionContractForGroup(group);
  const taxonomy = await prisma.taxonomyVersion.findFirst({
    where: { testTypeId: testType.id, status: "ACTIVE" },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { version: true },
  });
  const mapping = { domain: input.domain.trim(), subdomain: input.subdomain?.trim() || null, indicator: input.indicator?.trim() || null };
  if (!mapping.domain) throw new Error("INVALID_DOMAIN");
  const candidate: AdminQuestion = {
    id: code, domain: mapping.domain, subdomain: mapping.subdomain, indicator: mapping.indicator, text: input.text.trim(),
    type: input.type ?? expected.type, answerType: (input.answerType ?? expected.answerType) as AdminQuestion["answerType"],
    reverseScore: Boolean(input.reverseScore), weight: input.weight ?? 1, scale: input.scale ?? [...expected.scale],
    scoringKey: input.scoringKey ?? (group === "DISC" ? [1,2,3,4] : group === "RIASEC" ? [1,2,3,4,5] : [1]),
    options: input.options ?? null, correctOption: input.correctOption ?? null, difficulty: input.difficulty, status: "DRAFT",
    mappingStatus: mapping.subdomain && mapping.indicator ? "MAPPED" : "PARTIAL", questionId: "", questionVersionId: "", version: "v1",
    taxonomyVersion: taxonomy?.version ?? null, testTypeCode: testType.code, testTypeName: null, questionGroup: group,
    taxonomyNodeCode: null, taxonomyNodeName: null, taxonomyNodeType: null,
  };
  const validationErrors = validateQuestionMetadata({ ...candidate, testTypeId: testType.id });
  if (validationErrors.length) throw new Error(`CONTENT_VALIDATION_FAILED:${validationErrors.join(",")}`);
  await prisma.question.create({
    data: {
      id: `q_${crypto.randomUUID()}`,
      code,
      versions: {
        create: {
          version: "v1",
          testTypeId: testType.id,
          taxonomyVersion: taxonomy?.version ?? null,
          text: input.text.trim(),
          domain: mapping.domain,
          subdomain: mapping.subdomain,
          indicator: mapping.indicator,
          type: input.type ?? expected.type,
          answerType: input.answerType ?? expected.answerType,
          reverseScore: Boolean(input.reverseScore),
          weight: input.weight ?? 1,
          scale: input.scale ?? [...expected.scale],
          scoringKey: input.scoringKey ?? (group === "DISC" ? [1,2,3,4] : group === "RIASEC" ? [1,2,3,4,5] : [1]),
          options: input.options ? [...input.options] : undefined,
          correctOption: input.correctOption ?? undefined,
          difficulty: normalizeDifficulty(input.difficulty),
          status: QuestionStatus.DRAFT,
          mappingStatus: mapping.subdomain && mapping.indicator ? MappingStatus.MAPPED : MappingStatus.PARTIAL,
          sourceFile: null,
        },
      },
    },
  });
  const created = await prisma.question.findUnique({ where: { code }, select: { id: true } });
  if (!created) throw new Error("QUESTION_NOT_FOUND");
  return getQuestionById(created.id);
}

export async function duplicateQuestion(questionId: string, newCode: string) {
  const current = await loadLatestVersionById(questionId);
  const code = newCode.trim();
  if (!/^[A-Za-z0-9._-]{2,80}$/.test(code)) throw new Error("INVALID_QUESTION_CODE");
  const exists = await prisma.question.findUnique({ where: { code }, select: { id: true } });
  if (exists) throw new Error("QUESTION_CODE_ALREADY_EXISTS");
  const id = `q_${crypto.randomUUID()}`;
  await prisma.question.create({
    data: {
      id,
      code,
      versions: {
        create: {
          ...versionData({ ...toAdminQuestion(current), status: "DRAFT" }, "v1"),
          testTypeId: current.testTypeId,
          taxonomyVersion: current.taxonomyVersion,
        },
      },
    },
  });
  return getQuestionById(id);
}

export async function activateQuestion(questionId: string) {
  const current = await loadLatestVersionById(questionId);
  if (current.mappingStatus !== MappingStatus.APPROVED) throw new Error("MAPPING_NOT_APPROVED");
  if (current.status !== QuestionStatus.APPROVED) throw new Error("QUESTION_NOT_APPROVED");
  return publishQuestion(questionId);
}

export async function archiveQuestion(questionId: string) {
  const current = await loadLatestVersionById(questionId);
  if (current.status === QuestionStatus.ARCHIVED) return getQuestionById(questionId);
  await prisma.questionVersion.update({
    where: { id: current.id },
    data: { status: QuestionStatus.ARCHIVED },
  });
  return getQuestionById(questionId);
}


export async function getQuestionVersionHistory(questionId: string) {
  return prisma.questionVersion.findMany({
    where: { questionId },
    include: { testType: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function getQuestionAuditTrail(questionId: string) {
  const versions = await prisma.questionVersion.findMany({ where: { questionId }, select: { id: true } });
  const ids = versions.map(v => v.id);
  return prisma.adminContentAuditEvent.findMany({
    where: { entityType: "QUESTION_VERSION", entityId: { in: ids } },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });
}

export async function validateQuestionForReview(questionId: string, actorUserId: string) {
  const current = await loadLatestVersionById(questionId);
  const errors = validateQuestionMetadata(current);
  if (errors.length) throw new Error(`CONTENT_VALIDATION_FAILED:${errors.join(",")}`);
  const duplicate = await findQuestionDuplicate(current.id, current.text);
  if (duplicate) throw new Error(`DUPLICATE_CONTENT:${duplicate.questionId}`);
  if (current.status === QuestionStatus.ARCHIVED) throw new Error("QUESTION_ARCHIVED");
  const from = current.status;
  await prisma.questionVersion.update({ where: { id: current.id }, data: { status: QuestionStatus.VALIDATED } });
  await auditContentOperation({ entityType:"QUESTION_VERSION", entityId:current.id, action:"VALIDATE", fromStatus:from, toStatus:QuestionStatus.VALIDATED, actorUserId });
  return getQuestionById(questionId);
}

export async function submitQuestionForReview(questionId: string, actorUserId: string) {
  const current = await loadLatestVersionById(questionId);
  if (current.status !== QuestionStatus.VALIDATED && current.status !== QuestionStatus.MAPPED && current.status !== QuestionStatus.REJECTED) throw new Error("QUESTION_NOT_READY_FOR_REVIEW");
  const from = current.status;
  await prisma.questionVersion.update({ where:{id:current.id}, data:{status:QuestionStatus.REVIEW_REQUIRED} });
  await auditContentOperation({ entityType:"QUESTION_VERSION",entityId:current.id,action:"SUBMIT_REVIEW",fromStatus:from,toStatus:QuestionStatus.REVIEW_REQUIRED,actorUserId });
  return getQuestionById(questionId);
}

export async function approveQuestionForReview(questionId: string, actorUserId: string) {
  const current = await loadLatestVersionById(questionId);
  if (current.status !== QuestionStatus.REVIEW_REQUIRED) throw new Error("QUESTION_NOT_IN_REVIEW");
  if (current.mappingStatus !== MappingStatus.APPROVED) throw new Error("MAPPING_NOT_APPROVED");
  const errors = validateQuestionMetadata(current);
  if (errors.length) throw new Error(`CONTENT_VALIDATION_FAILED:${errors.join(",")}`);
  const from=current.status;
  await prisma.questionVersion.update({where:{id:current.id},data:{status:QuestionStatus.APPROVED}});
  await auditContentOperation({entityType:"QUESTION_VERSION",entityId:current.id,action:"APPROVE",fromStatus:from,toStatus:QuestionStatus.APPROVED,actorUserId});
  return getQuestionById(questionId);
}

export async function publishQuestionForOperations(questionId: string, actorUserId: string) {
  const current = await loadLatestVersionById(questionId);
  if (current.status !== QuestionStatus.APPROVED) throw new Error("QUESTION_NOT_APPROVED");
  if (current.mappingStatus !== MappingStatus.APPROVED) throw new Error("MAPPING_NOT_APPROVED");
  const errors=validateQuestionMetadata(current);
  if(errors.length) throw new Error(`CONTENT_VALIDATION_FAILED:${errors.join(",")}`);
  const from=current.status;
  await prisma.questionVersion.update({where:{id:current.id},data:{status:QuestionStatus.PUBLISHED}});
  await auditContentOperation({entityType:"QUESTION_VERSION",entityId:current.id,action:"PUBLISH",fromStatus:from,toStatus:QuestionStatus.PUBLISHED,actorUserId});
  return getQuestionById(questionId);
}

export async function activateQuestionForOperations(questionId: string, actorUserId: string) {
  const current=await loadLatestVersionById(questionId);
  if(current.status!==QuestionStatus.PUBLISHED) throw new Error("QUESTION_NOT_PUBLISHED");
  const from=current.status;
  // The existing runtime represents active production questions as PUBLISHED.
  // L17 records the operational activation without changing measurement semantics.
  await auditContentOperation({entityType:"QUESTION_VERSION",entityId:current.id,action:"ACTIVATE",fromStatus:from,toStatus:QuestionStatus.PUBLISHED,actorUserId,metadata:{runtimeStatus:"PUBLISHED"}});
  return getQuestionById(questionId);
}

export async function archiveQuestionForOperations(questionId: string, actorUserId: string) {
  const current=await loadLatestVersionById(questionId);
  if(current.status===QuestionStatus.PUBLISHED) throw new Error("ACTIVE_CONTENT_REQUIRES_REPLACEMENT");
  if(current.status!==QuestionStatus.APPROVED && current.status!==QuestionStatus.REVIEW_REQUIRED) throw new Error("QUESTION_NOT_ARCHIVABLE");
  const from=current.status;
  await prisma.questionVersion.update({where:{id:current.id},data:{status:QuestionStatus.ARCHIVED}});
  await auditContentOperation({entityType:"QUESTION_VERSION",entityId:current.id,action:"ARCHIVE",fromStatus:from,toStatus:QuestionStatus.ARCHIVED,actorUserId});
  return getQuestionById(questionId);
}

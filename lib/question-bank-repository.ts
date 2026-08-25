import {
  MappingStatus,
  Prisma,
  QuestionDifficulty,
  QuestionStatus,
} from "@prisma/client";
import { prisma } from "./db/prisma";
import { validateMapping } from "./question-bank-taxonomy";
import type { ScoringKey } from "./question-bank-types";

export type AdminQuestion = {
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
  sourceFile?: string;
  uploadedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  mappingApprovedAt?: string;
};

type DbQuestionVersion = Prisma.QuestionVersionGetPayload<{
  include: { question: true };
}>;

export type QuestionBankListParams = {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

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

function scoringKey(value: number[]): ScoringKey {
  return value.length === 5 && value[0] === 5
    ? ([5, 4, 3, 2, 1] as const)
    : ([1, 2, 3, 4, 5] as const);
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
    reverseScore: v.reverseScore,
    weight: v.weight,
    scale: [1, 2, 3, 4, 5],
    scoringKey: scoringKey(v.scoringKey),
    difficulty: v.difficulty,
    status: v.status,
    mappingStatus: v.mappingStatus,
    sourceFile: v.sourceFile ?? undefined,
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
    include: { question: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return latestVersionMap(rows);
}

async function loadLatestVersionById(questionId: string) {
  const row = await prisma.questionVersion.findFirst({
    where: { questionId },
    include: { question: true },
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
    answerType: "LIKERT_5",
    reverseScore: Boolean(input.reverseScore),
    weight: Number(input.weight) > 0 ? Number(input.weight) : 1,
    scale: [1, 2, 3, 4, 5],
    scoringKey: [...input.scoringKey],
    difficulty: normalizeDifficulty(input.difficulty),
    status: normalizeStatus(input.status),
    mappingStatus: normalizeMappingStatus(input.mappingStatus),
    sourceFile: input.sourceFile ?? null,
  };
}


export async function getQuestions(params: QuestionBankListParams = {}): Promise<AdminQuestion[]> {
  const latest = await loadLatestVersions();
  let result = [...latest.values()].map(toAdminQuestion);

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

  result.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const offset = Math.max(0, params.offset ?? 0);
  const limit = Math.min(5000, Math.max(1, params.limit ?? 5000));
  return result.slice(offset, offset + limit);
}

export async function getQuestionById(questionId: string) {
  return toAdminQuestion(await loadLatestVersionById(questionId));
}

export async function getQuestionBankStats() {
  const questions = [...(await loadLatestVersions()).values()].map(toAdminQuestion);
  const count = (predicate: (q: AdminQuestion) => boolean) => questions.filter(predicate).length;
  const latest = await prisma.questionVersion.findFirst({
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { updatedAt: true },
  });
  const questionBankVersion = `QB_DB_${latest?.updatedAt.toISOString().replace(/\D/g, "").slice(0, 14) ?? "EMPTY"}_${questions.length}`;

  return {
    total: questions.length,
    draft: count((q) => q.status.toUpperCase() === "DRAFT"),
    validated: count((q) => q.status.toUpperCase() === "VALIDATED"),
    mapped: count((q) => ["MAPPED", "APPROVED"].includes(q.mappingStatus.toUpperCase())),
    mappingReview: count((q) => q.mappingStatus.toUpperCase() === "REVIEW_REQUIRED"),
    partial: count((q) => q.mappingStatus.toUpperCase() === "PARTIAL"),
    approved: count((q) => q.status.toUpperCase() === "APPROVED"),
    published: count((q) => q.status.toUpperCase() === "PUBLISHED"),
    eligible: count(
      (q) =>
        q.status.toUpperCase() === "PUBLISHED" &&
        q.mappingStatus.toUpperCase() === "APPROVED" &&
        q.text.trim().length > 0 &&
        q.domain.trim().length > 0 &&
        Boolean(q.subdomain?.trim()) &&
        Boolean(q.indicator?.trim()) &&
        q.weight > 0 &&
        q.scale.length === 5 &&
        q.scoringKey.length === 5,
    ),
    questionBankVersion,
    updatedAt: latest?.updatedAt.toISOString() ?? new Date(0).toISOString(),
  };
}

export async function getPublishedEligibleQuestions() {
  const latest = await loadLatestVersions();
  return [...latest.values()]
    .filter(
      (v) =>
        v.status === QuestionStatus.PUBLISHED &&
        v.mappingStatus === MappingStatus.APPROVED &&
        v.text.trim().length > 0 &&
        v.domain.trim().length > 0 &&
        Boolean(v.subdomain?.trim()) &&
        Boolean(v.indicator?.trim()) &&
        v.weight > 0 &&
        v.scale.length === 5 &&
        v.scoringKey.length === 5,
    )
    .map((v) => ({
      ...toAdminQuestion(v),
      // Stable public/runtime ID is Question.code; persistence requires the
      // canonical PostgreSQL Question.id.
      questionRecordId: v.question.id,
      questionVersionId: v.id,
    }));
}

export async function importAdminQuestions(incoming: AdminQuestion[], mode: "append" | "replace") {
  const incomingIds = new Set<string>();
  for (const q of incoming) {
    if (incomingIds.has(q.id)) throw new Error(`DUPLICATE_QUESTION_IDS:${q.id}`);
    incomingIds.add(q.id);
  }

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
      const existingQuestion = existing.find((item) => item.code === q.id);
      if (!existingQuestion) {
        await tx.question.create({
          data: {
            id: q.id,
            code: q.id,
            versions: { create: versionData({ ...q, status: "DRAFT" }, "v1") },
          },
        });
        continue;
      }

      const version = await nextVersion(tx, existingQuestion.id);
      await tx.questionVersion.create({
        data: {
          questionId: existingQuestion.id,
          ...versionData({ ...q, status: "DRAFT" }, version),
        },
      });
    }

    if (mode === "replace") {
      const all = await tx.question.findMany({
        select: { id: true, code: true },
      });
      for (const q of all) {
        if (incomingIds.has(q.code)) continue;
        const latest = await tx.questionVersion.findFirst({
          where: { questionId: q.id },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });
        if (!latest || latest.status === QuestionStatus.ARCHIVED) continue;
        const version = await nextVersion(tx, q.id);
        await tx.questionVersion.create({
          data: {
            questionId: q.id,
            version,
            text: latest.text,
            domain: latest.domain,
            subdomain: latest.subdomain,
            indicator: latest.indicator,
            type: latest.type,
            answerType: latest.answerType,
            reverseScore: latest.reverseScore,
            weight: latest.weight,
            scale: latest.scale,
            scoringKey: latest.scoringKey,
            difficulty: latest.difficulty,
            status: QuestionStatus.ARCHIVED,
            mappingStatus: latest.mappingStatus,
            sourceFile: latest.sourceFile,
          },
        });
      }
    }
  });

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
  const mapping = validateMapping(input.domain, input.subdomain, input.indicator);
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

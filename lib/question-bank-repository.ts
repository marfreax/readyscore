import crypto from "node:crypto";
import {
  MappingStatus,
  Prisma,
  QuestionDifficulty,
  QuestionStatus,
} from "@prisma/client";
import { prisma } from "./db/prisma";
import { validateMapping } from "./question-bank-taxonomy";
import { auditContentOperation, validateQuestionMetadata, findQuestionDuplicate } from "./admin-content-operations";
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
  questionId: string;
  questionVersionId: string;
  version: string;
  testTypeCode: string | null;
  testTypeName: string | null;
};

type DbQuestionVersion = Prisma.QuestionVersionGetPayload<{
  include: { question: true; testType: true };
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
    questionId: row.question.id,
    questionVersionId: v.id,
    version: v.version,
    testTypeCode: v.testType?.code ?? null,
    testTypeName: v.testType?.name ?? null,
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
  text: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  difficulty: string;
};

export async function createQuestionVersion(
  questionId: string,
  input: QuestionVersionInput,
) {
  const current = await loadLatestVersionById(questionId);
  assertEditable(current);
  const mapping = { domain: input.domain.trim(), subdomain: input.subdomain?.trim() || null, indicator: input.indicator?.trim() || null };
  if (!mapping.domain) throw new Error("INVALID_DOMAIN");
  const next: AdminQuestion = {
    ...toAdminQuestion(current),
    text: input.text,
    domain: mapping.domain,
    subdomain: mapping.subdomain,
    indicator: mapping.indicator,
    difficulty: input.difficulty,
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

export async function createLogicalQuestion(input: {
  code: string;
  text: string;
  testTypeId: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  difficulty: string;
}) {
  const code = input.code.trim();
  if (!/^[A-Za-z0-9._-]{2,80}$/.test(code)) throw new Error("INVALID_QUESTION_CODE");
  const exists = await prisma.question.findUnique({ where: { code }, select: { id: true } });
  if (exists) throw new Error("QUESTION_CODE_ALREADY_EXISTS");
  const testType = await prisma.testType.findFirst({
    where: { id: input.testTypeId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!testType) throw new Error("TEST_TYPE_NOT_FOUND");
  const taxonomy = await prisma.taxonomyVersion.findFirst({
    where: { testTypeId: testType.id, status: "ACTIVE" },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { version: true },
  });
  const mapping = { domain: input.domain.trim(), subdomain: input.subdomain?.trim() || null, indicator: input.indicator?.trim() || null };
  if (!mapping.domain) throw new Error("INVALID_DOMAIN");
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
          type: "LIKERT",
          answerType: "LIKERT_5",
          reverseScore: false,
          weight: 1,
          scale: [1,2,3,4,5],
          scoringKey: [1,2,3,4,5],
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

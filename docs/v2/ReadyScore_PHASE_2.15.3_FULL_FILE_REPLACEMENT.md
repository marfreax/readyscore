# ReadyScore — PHASE 2.15.3 — Full-File Replacement

Source: AppRS-2.15.zip yang diberikan pada 22 Agustus 2026.

## Tujuan

Memindahkan Question Bank dan assessment runtime persistence dari JSON/Map ke PostgreSQL + Prisma tanpa mengubah business rule Free/Premium atau scoring existing.

## Replacement Files

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum AssessmentType {
  FREE
  PREMIUM
}

enum AttemptStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
  EXPIRED
}

enum QuestionDifficulty {
  EASY
  MEDIUM
  HARD
  UNSPECIFIED
}

enum QuestionStatus {
  DRAFT
  VALIDATED
  MAPPED
  REVIEW_REQUIRED
  APPROVED
  PUBLISHED
  ARCHIVED
  REJECTED
}

enum MappingStatus {
  UNMAPPED
  PARTIAL
  MAPPED
  REVIEW_REQUIRED
  APPROVED
  REJECTED
}

model DatabaseHeartbeat {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
}

model User {
  id           String   @id
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole @default(USER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  sessions Session[]
  attempts AssessmentAttempt[]

  @@index([createdAt])
}

model Session {
  id        String   @id
  userId    String
  createdAt DateTime @default(now())
  expiresAt DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

/// Stable question identity. Versioned content lives in QuestionVersion.
model Question {
  id        String   @id
  code      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  versions         QuestionVersion[]
  attemptQuestions AttemptQuestion[]

  @@index([createdAt])
}

/// Assessment-facing question version. Content is immutable after creation;
/// lifecycle state may advance on the latest version before publication.
model QuestionVersion {
  id            String             @id @default(cuid())
  questionId    String
  version       String
  text          String
  domain        String
  subdomain     String?
  indicator     String?
  type          String             @default("LIKERT")
  answerType    String             @default("LIKERT_5")
  reverseScore  Boolean            @default(false)
  weight        Float              @default(1)
  scale         Int[]
  scoringKey    Int[]
  difficulty    QuestionDifficulty @default(UNSPECIFIED)
  status        QuestionStatus     @default(DRAFT)
  mappingStatus MappingStatus      @default(UNMAPPED)
  sourceFile    String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  question         Question          @relation(fields: [questionId], references: [id], onDelete: Restrict)
  attemptQuestions AttemptQuestion[]

  @@unique([questionId, version])
  @@index([status, mappingStatus])
  @@index([domain, subdomain, indicator])
  @@index([createdAt])
  @@index([updatedAt])
}

model AssessmentAttempt {
  id                             String         @id
  userId                         String?
  assessmentType                 AssessmentType
  status                         AttemptStatus  @default(IN_PROGRESS)
  assessmentConfigurationId      String
  assessmentConfigurationVersion String
  questionBankVersion            String
  taxonomyVersion                String
  scoringVersion                 String
  selectionAlgorithmVersion      String
  attemptSeed                    String
  selectionSnapshot              Json
  startedAt                      DateTime       @default(now())
  completedAt                    DateTime?
  abandonedAt                    DateTime?
  lastActivityAt                 DateTime       @default(now())
  createdAt                      DateTime       @default(now())
  updatedAt                      DateTime       @updatedAt

  user      User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  questions AttemptQuestion[]
  answers   Answer[]
  result    AssessmentResult?

  @@index([userId, startedAt])
  @@index([status, startedAt])
  @@index([assessmentType, status])
}

/// Frozen question membership for a specific attempt.
model AttemptQuestion {
  id                String   @id @default(cuid())
  attemptId         String
  questionId        String
  questionVersionId String
  sequence          Int
  required          Boolean  @default(true)
  questionSnapshot  Json
  createdAt         DateTime @default(now())

  attempt         AssessmentAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question        Question          @relation(fields: [questionId], references: [id], onDelete: Restrict)
  questionVersion QuestionVersion   @relation(fields: [questionVersionId], references: [id], onDelete: Restrict)
  answer          Answer?

  @@unique([attemptId, questionId])
  @@unique([attemptId, sequence])
  @@index([questionId])
  @@index([questionVersionId])
}

model Answer {
  id                String   @id @default(cuid())
  attemptId         String
  questionId        String
  attemptQuestionId String   @unique
  rawValue          Int
  answeredAt        DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  attempt         AssessmentAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  attemptQuestion AttemptQuestion   @relation(fields: [attemptQuestionId], references: [id], onDelete: Cascade)

  @@unique([attemptId, questionId])
  @@index([attemptId, answeredAt])
}

/// Persisted immutable result snapshot for a completed attempt.
model AssessmentResult {
  id        String   @id @default(cuid())
  attemptId String   @unique
  result    Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  attempt AssessmentAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
}

```

### `lib/question-bank-repository.ts`

```typescript
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
  if (![MappingStatus.MAPPED, MappingStatus.REVIEW_REQUIRED].includes(current.mappingStatus)) {
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

```

### `lib/question-bank-admin.ts`

```typescript
import {
  approveMapping,
  approveQuestion,
  bulkQuestionBankAction,
  getQuestionBankStats,
  getQuestionById,
  getQuestions,
  importAdminQuestions,
  publishQuestion,
  unpublishQuestion,
  updateQuestionMapping,
} from "./question-bank-repository";
import type { AdminQuestion } from "./question-bank-repository";

export type { AdminQuestion } from "./question-bank-repository";

export async function getAdminQuestionBank() {
  const [questions, stats] = await Promise.all([getQuestions({ limit: 5000 }), getQuestionBankStats()]);
  return {
    version: 2,
    questionBankVersion: stats.questionBankVersion,
    updatedAt: stats.updatedAt,
    questions,
  };
}

export async function getAdminQuestions() {
  return getQuestions({ limit: 5000 });
}

export { getQuestionBankStats as getAdminQuestionBankStats };
export { getQuestionById };
export { importAdminQuestions, updateQuestionMapping, approveMapping, approveQuestion, publishQuestion, unpublishQuestion, bulkQuestionBankAction };

// Kept only as a compatibility type export for callers that imported the old state shape.
export type AdminState = {
  version: number;
  questionBankVersion: string;
  updatedAt: string;
  questions: AdminQuestion[];
};

```

### `lib/question-bank-csv.ts`

```typescript
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

```

### `lib/assessment/question-bank.ts`

```typescript
import { getAdminQuestions } from "../question-bank-admin";
import { getPublishedEligibleQuestions } from "../question-bank-repository";
import type { Question } from "./types";

function toQuestion(q: {
  id: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  text: string;
  type: string;
  reverseScore: boolean;
  weight: number;
  scale: readonly [1, 2, 3, 4, 5];
  scoringKey: readonly [1, 2, 3, 4, 5] | readonly [5, 4, 3, 2, 1];
  difficulty: string;
  status: string;
  mappingStatus: string;
  sourceFile?: string;
}): Question {
  const difficulty = String(q.difficulty).toUpperCase();
  return {
    id: q.id,
    code: q.id,
    text: q.text,
    domain: q.domain,
    subdomain: q.subdomain,
    indicator: q.indicator,
    type: q.type,
    answerType: "LIKERT_5",
    scale: [1, 2, 3, 4, 5] as const,
    reverseScore: q.reverseScore,
    scoringKey: q.scoringKey,
    weight: q.weight,
    difficulty: difficulty === "EASY" || difficulty === "HARD" || difficulty === "UNSPECIFIED" ? difficulty : "MEDIUM",
    status: q.status.toUpperCase() as Question["status"],
    mappingStatus: q.mappingStatus.toUpperCase() as Question["mappingStatus"],
    version: "POSTGRESQL_RUNTIME",
    source: q.sourceFile ?? "POSTGRESQL",
  };
}

export async function getAllQuestions(): Promise<Question[]> {
  return (await getAdminQuestions()).map(toQuestion);
}

export async function getAssessmentReadyQuestions(): Promise<Question[]> {
  return (await getPublishedEligibleQuestions()).map(toQuestion);
}

export async function getQuestionsByDomain(domain: string): Promise<Question[]> {
  const all = await getAssessmentReadyQuestions();
  return all.filter((q) => q.domain === domain);
}

export async function getMappingAudit() {
  const questions = await getAllQuestions();
  const total = questions.length;
  const mapped = questions.filter((q) => ["MAPPED", "APPROVED"].includes(q.mappingStatus)).length;
  return {
    total,
    mapped,
    partial: total - mapped,
    mappingCoverage: total ? Number(((mapped / total) * 100).toFixed(2)) : 0,
  };
}

```

### `lib/assessment/question-engine.ts`

```typescript
import { ASSESSMENT_CONFIG, type AssessmentType } from "../assessment-config";
import { getPublishedEligibleQuestions } from "../question-bank-repository";
import { getAssessmentReadyQuestions } from "./question-bank";
import type { Question } from "./types";

export class SelectionError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "SelectionError";
  }
}

export type SelectedQuestion = Question & { questionVersionId: string };

function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    h = (h * 1664525 + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const PREMIUM_DOMAIN_QUOTAS: Array<{ label: string; aliases: string[]; quota: number }> = [
  { label: "Motivasi", aliases: ["MOT", "Motivasi"], quota: 12 },
  { label: "Disiplin", aliases: ["DIS", "Disiplin"], quota: 12 },
  { label: "Kemandirian", aliases: ["IND", "Kemandirian"], quota: 12 },
  { label: "Critical Thinking", aliases: ["CRT", "Berpikir Kritis", "Critical Thinking"], quota: 13 },
  { label: "Problem Solving", aliases: ["PRS", "Pemecahan Masalah", "Problem Solving"], quota: 13 },
  { label: "Komunikasi", aliases: ["COM", "Komunikasi", "Communication"], quota: 13 },
  { label: "Leadership", aliases: ["LED", "Kepemimpinan", "Leadership"], quota: 13 },
  { label: "Emotional Resilience", aliases: ["ERS", "Ketahanan Emosional", "Emotional Resilience"], quota: 12 },
];

export async function selectQuestions(type: AssessmentType, seed?: string): Promise<SelectedQuestion[]> {
  const config = ASSESSMENT_CONFIG[type];
  const eligible = await getPublishedEligibleQuestions();
  if (eligible.length < config.questionCount) {
    throw new SelectionError(
      "INSUFFICIENT_ELIGIBLE_QUESTIONS",
      `Membutuhkan ${config.questionCount} question eligible, tersedia ${eligible.length}.`,
    );
  }

  const runtimeQuestions: SelectedQuestion[] = eligible.map((q) => {
    const difficulty = String(q.difficulty).toUpperCase();
    return {
      id: q.id,
      code: q.id,
      text: q.text,
      domain: q.domain,
      subdomain: q.subdomain,
      indicator: q.indicator,
      type: q.type,
      answerType: "LIKERT_5",
      scale: [1, 2, 3, 4, 5] as const,
      reverseScore: q.reverseScore,
      scoringKey: q.scoringKey,
      weight: q.weight,
      difficulty: difficulty === "EASY" || difficulty === "HARD" || difficulty === "UNSPECIFIED" ? difficulty : "MEDIUM",
      status: q.status.toUpperCase() as Question["status"],
      mappingStatus: q.mappingStatus.toUpperCase() as Question["mappingStatus"],
      version: "POSTGRESQL_RUNTIME",
      source: q.sourceFile ?? "POSTGRESQL",
      questionVersionId: q.questionVersionId,
    };
  });

  const s = seed ?? Math.random().toString(36);
  let selected: SelectedQuestion[] = [];

  if (type === "free") {
    selected = seededShuffle(runtimeQuestions, s).slice(0, config.questionCount);
  } else {
    for (const domain of PREMIUM_DOMAIN_QUOTAS) {
      const candidates = seededShuffle(
        runtimeQuestions.filter((q) => domain.aliases.includes(q.domain)),
        `${s}:${domain.label}`,
      );
      if (candidates.length < domain.quota) {
        throw new SelectionError(
          "INSUFFICIENT_DOMAIN_QUESTIONS",
          `Domain "${domain.label}" tidak cukup. Membutuhkan ${domain.quota}, tersedia ${candidates.length}.`,
        );
      }
      selected.push(...candidates.slice(0, domain.quota));
    }
    selected = seededShuffle(selected, s);
  }

  if (selected.length !== config.questionCount) {
    throw new SelectionError(
      "SELECTION_COUNT_MISMATCH",
      "Jumlah question hasil selection tidak sesuai konfigurasi.",
    );
  }

  const ids = new Set<string>();
  for (const question of selected) {
    if (ids.has(question.id)) throw new SelectionError("DUPLICATE_SELECTED_QUESTION", `Question ${question.id} terpilih lebih dari sekali.`);
    ids.add(question.id);
  }

  return selected;
}

export function snapshotFromSelection(
  type: AssessmentType,
  args: { attemptId: string; attemptSeed: string; questionBankVersion: string },
  selected: SelectedQuestion[],
) {
  const config = ASSESSMENT_CONFIG[type];
  return {
    attemptId: args.attemptId,
    assessmentType: type,
    assessmentConfigurationVersion: config.version,
    questionBankVersion: args.questionBankVersion,
    taxonomyVersion: "TAXONOMY_V1",
    scoringVersion: config.scoringVersion,
    selectionAlgorithmVersion: config.selectionAlgorithmVersion,
    attemptSeed: args.attemptSeed,
    selectedQuestionIds: selected.map((q) => q.id),
    selectedQuestionVersionIds: selected.map((q) => q.questionVersionId),
    selectedQuestionSequence: selected.map((q) => q.id),
    selectionMetadata: {
      selectedCount: selected.length,
      domainDistribution: Object.fromEntries(
        [...new Set(selected.map((q) => q.domain))].map((domain) => [
          domain,
          selected.filter((q) => q.domain === domain).length,
        ]),
      ),
    },
  };
}

export async function createAssessmentSnapshot(
  type: AssessmentType,
  args: { attemptId: string; attemptSeed: string; questionBankVersion: string },
) {
  const selected = await selectQuestions(type, args.attemptSeed);
  return snapshotFromSelection(type, args, selected);
}

export async function selectQuestionsFromQuestionBank(type: AssessmentType, seed: string) {
  const selected = await selectQuestions(type, seed);
  return selected;
}

// Keep this import path's old helper usable for any legacy diagnostics.
export async function getSelectionPool(): Promise<Question[]> {
  return getAssessmentReadyQuestions();
}

```

### `lib/assessment/assessment-repository.ts`

```typescript
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { AssessmentResult, Answer, LikertValue, Question } from "./types";
import type { SelectedQuestion } from "./question-engine";

export type PersistedAttempt = {
  id: string;
  assessmentType: "free" | "premium";
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "EXPIRED";
  startedAt: string;
  completedAt?: string;
  assessmentConfigurationId: string;
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  scoringVersion: string;
};

function toAttempt(row: {
  id: string;
  assessmentType: "FREE" | "PREMIUM";
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "EXPIRED";
  startedAt: Date;
  completedAt: Date | null;
  assessmentConfigurationId: string;
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  scoringVersion: string;
}): PersistedAttempt {
  return {
    id: row.id,
    assessmentType: row.assessmentType.toLowerCase() as "free" | "premium",
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    assessmentConfigurationId: row.assessmentConfigurationId,
    assessmentConfigurationVersion: row.assessmentConfigurationVersion,
    questionBankVersion: row.questionBankVersion,
    scoringVersion: row.scoringVersion,
  };
}

function snapshotToQuestion(value: Prisma.JsonValue): Question {
  const snapshot = value as Record<string, unknown>;
  return {
    id: String(snapshot.id),
    code: String(snapshot.code ?? snapshot.id),
    text: String(snapshot.text),
    domain: String(snapshot.domain),
    subdomain: snapshot.subdomain ? String(snapshot.subdomain) : null,
    indicator: snapshot.indicator ? String(snapshot.indicator) : null,
    type: String(snapshot.type ?? "LIKERT"),
    answerType: "LIKERT_5",
    scale: [1, 2, 3, 4, 5],
    reverseScore: Boolean(snapshot.reverseScore),
    scoringKey: Array.isArray(snapshot.scoringKey) && snapshot.scoringKey[0] === 5
      ? [5, 4, 3, 2, 1]
      : [1, 2, 3, 4, 5],
    weight: Number(snapshot.weight ?? 1),
    difficulty: String(snapshot.difficulty ?? "MEDIUM").toUpperCase() as Question["difficulty"],
    status: String(snapshot.status ?? "PUBLISHED").toUpperCase() as Question["status"],
    mappingStatus: String(snapshot.mappingStatus ?? "APPROVED").toUpperCase() as Question["mappingStatus"],
    version: String(snapshot.version ?? "POSTGRESQL_RUNTIME"),
    source: snapshot.source ? String(snapshot.source) : "POSTGRESQL",
  };
}

function questionSnapshot(question: SelectedQuestion, sequence: number) {
  return {
    id: question.id,
    code: question.code,
    text: question.text,
    domain: question.domain,
    subdomain: question.subdomain ?? null,
    indicator: question.indicator ?? null,
    type: question.type ?? "LIKERT",
    answerType: "LIKERT_5",
    scale: [...question.scale],
    scoringKey: [...question.scoringKey],
    reverseScore: question.reverseScore,
    weight: question.weight,
    difficulty: question.difficulty,
    status: question.status,
    mappingStatus: question.mappingStatus,
    version: question.version,
    source: question.source ?? "POSTGRESQL",
    sequence,
  };
}

export async function createAttempt(input: {
  id: string;
  type: "free" | "premium";
  assessmentConfigurationId: string;
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  taxonomyVersion: string;
  scoringVersion: string;
  selectionAlgorithmVersion: string;
  attemptSeed: string;
  selectionSnapshot: Record<string, unknown>;
  selectedQuestions: SelectedQuestion[];
  startedAt: Date;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.assessmentAttempt.create({
      data: {
        id: input.id,
        assessmentType: input.type.toUpperCase() as "FREE" | "PREMIUM",
        status: "IN_PROGRESS",
        assessmentConfigurationId: input.assessmentConfigurationId,
        assessmentConfigurationVersion: input.assessmentConfigurationVersion,
        questionBankVersion: input.questionBankVersion,
        taxonomyVersion: input.taxonomyVersion,
        scoringVersion: input.scoringVersion,
        selectionAlgorithmVersion: input.selectionAlgorithmVersion,
        attemptSeed: input.attemptSeed,
        selectionSnapshot: input.selectionSnapshot as Prisma.InputJsonValue,
        startedAt: input.startedAt,
        lastActivityAt: input.startedAt,
        questions: {
          create: input.selectedQuestions.map((question, index) => ({
            questionId: question.id,
            questionVersionId: question.questionVersionId,
            sequence: index + 1,
            required: true,
            questionSnapshot: questionSnapshot(question, index + 1) as Prisma.InputJsonValue,
          })),
        },
      },
    });
  });

  return getAttempt(input.id);
}

export async function getAttempt(attemptId: string) {
  const row = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      questions: { orderBy: { sequence: "asc" } },
      answers: true,
      result: true,
    },
  });
  if (!row) return null;

  return {
    attempt: toAttempt(row),
    raw: row,
    questions: row.questions.map((item) => ({
      question: snapshotToQuestion(item.questionSnapshot),
      sequence: item.sequence,
      attemptQuestionId: item.id,
      questionVersionId: item.questionVersionId,
    })),
    answers: row.answers.map((answer) => ({
      questionId: answer.questionId,
      value: answer.rawValue as LikertValue,
      answeredAt: answer.answeredAt.toISOString(),
    })),
    result: row.result ? (row.result.result as unknown as AssessmentResult) : null,
  };
}

export async function saveAnswer(attemptId: string, questionId: string, value: LikertValue) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { questions: true },
  });
  if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");
  if (attempt.status !== "IN_PROGRESS") throw new Error("ATTEMPT_NOT_IN_PROGRESS");

  const question = attempt.questions.find((item) => item.questionId === questionId);
  if (!question) throw new Error("QUESTION_NOT_IN_ATTEMPT");

  await prisma.answer.upsert({
    where: { attemptQuestionId: question.id },
    create: {
      attemptId,
      questionId,
      attemptQuestionId: question.id,
      rawValue: value,
    },
    update: {
      rawValue: value,
      answeredAt: new Date(),
    },
  });

  await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: { lastActivityAt: new Date() },
  });

  return getAttemptProgress(attemptId);
}

export async function getAttemptProgress(attemptId: string) {
  const row = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      questions: { select: { id: true } },
      answers: { select: { id: true } },
    },
  });
  if (!row) throw new Error("ATTEMPT_NOT_FOUND");
  const total = row.questions.length;
  const answered = row.answers.length;
  return {
    answered,
    total,
    remaining: Math.max(0, total - answered),
    percentage: total ? Math.round((answered / total) * 100) : 0,
  };
}

export async function persistCompletedResult(attemptId: string, result: AssessmentResult) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.assessmentResult.findUnique({ where: { attemptId } });
    if (existing) return existing.result as unknown as AssessmentResult;

    const attempt = await tx.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");
    if (attempt.status !== "IN_PROGRESS" && attempt.status !== "COMPLETED") {
      throw new Error("ATTEMPT_NOT_IN_PROGRESS");
    }

    await tx.assessmentResult.create({
      data: {
        attemptId,
        result: result as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    return result;
  });
}

export async function abandonAttempt(attemptId: string) {
  const row = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!row) throw new Error("ATTEMPT_NOT_FOUND");
  if (row.status === "COMPLETED") throw new Error("ATTEMPT_ALREADY_COMPLETED");
  const updated = await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: { status: "ABANDONED", abandonedAt: new Date(), lastActivityAt: new Date() },
  });
  return toAttempt(updated);
}

export async function getPersistedResult(attemptId: string) {
  const row = await prisma.assessmentResult.findUnique({ where: { attemptId } });
  return row ? (row.result as unknown as AssessmentResult) : null;
}

```

### `lib/assessment/runtime-service.ts`

```typescript
import { randomBytes } from "node:crypto";
import { ASSESSMENT_CONFIG, type AssessmentType } from "../assessment-config";
import { getQuestionBankStats } from "../question-bank-repository";
import {
  abandonAttempt,
  createAttempt,
  getAttempt as getPersistedAttempt,
  getAttemptProgress,
  getPersistedResult,
  persistCompletedResult,
  saveAnswer as persistAnswer,
} from "./assessment-repository";
import { selectQuestions, snapshotFromSelection, SelectionError } from "./question-engine";
import { calculateResult } from "./scoring-engine";
import type { Answer, AssessmentResult, LikertValue, Question } from "./types";

export class RuntimeError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

const newId = (type: AssessmentType) => `${type}-${Date.now()}-${randomBytes(6).toString("hex")}`;
const newSeed = () => randomBytes(16).toString("hex");

export async function startAssessment(type: AssessmentType) {
  const config = ASSESSMENT_CONFIG[type];
  if (config.status !== "PUBLISHED") {
    throw new RuntimeError("ASSESSMENT_NOT_AVAILABLE", "Assessment belum tersedia.");
  }

  const stats = await getQuestionBankStats();
  const attemptId = newId(type);
  const attemptSeed = newSeed();

  let selected;
  try {
    selected = await selectQuestions(type, attemptSeed);
  } catch (error) {
    if (error instanceof SelectionError) throw new RuntimeError(error.code, error.message);
    throw error;
  }

  if (selected.length !== config.questionCount) {
    throw new RuntimeError(
      "SELECTION_COUNT_MISMATCH",
      "Jumlah question hasil selection tidak sesuai konfigurasi.",
    );
  }

  const snapshot = snapshotFromSelection(
    type,
    {
      attemptId,
      attemptSeed,
      questionBankVersion: stats.questionBankVersion,
    },
    selected,
  );

  const persisted = await createAttempt({
    id: attemptId,
    type,
    assessmentConfigurationId: config.id,
    assessmentConfigurationVersion: config.version,
    questionBankVersion: stats.questionBankVersion,
    taxonomyVersion: snapshot.taxonomyVersion,
    scoringVersion: config.scoringVersion,
    selectionAlgorithmVersion: config.selectionAlgorithmVersion,
    attemptSeed,
    selectionSnapshot: snapshot,
    selectedQuestions: selected,
    startedAt: new Date(),
  });

  if (!persisted) throw new RuntimeError("ATTEMPT_CREATE_FAILED", "Assessment attempt gagal dibuat.");
  return buildRuntimeView(persisted);
}

export async function getAttempt(id: string) {
  const persisted = await getPersistedAttempt(id);
  if (!persisted) throw new RuntimeError("ATTEMPT_NOT_FOUND", "Assessment attempt tidak ditemukan.");
  return persisted;
}

function buildRuntimeView(persisted: NonNullable<Awaited<ReturnType<typeof getPersistedAttempt>>>) {
  const questions = persisted.questions.map((item) => {
    const answer = persisted.answers.find((candidate) => candidate.questionId === item.question.id);
    return {
      id: item.question.id,
      code: item.question.code,
      text: item.question.text,
      domain: item.question.domain,
      subdomain: item.question.subdomain ?? null,
      indicator: item.question.indicator ?? null,
      difficulty: item.question.difficulty,
      sequence: item.sequence,
      answered: Boolean(answer),
      answer: answer?.value ?? null,
    };
  });

  const answered = persisted.answers.length;
  const total = persisted.questions.length;
  return {
    attempt: persisted.attempt,
    snapshot: persisted.raw.selectionSnapshot,
    progress: {
      answered,
      total,
      remaining: Math.max(0, total - answered),
      percentage: total ? Math.round((answered / total) * 100) : 0,
    },
    questions,
    result: persisted.result,
  };
}

export async function getAttemptView(id: string) {
  return buildRuntimeView(await getAttempt(id));
}

export async function getAttemptResult(id: string) {
  const persisted = await getPersistedResult(id);
  if (!persisted) throw new RuntimeError("RESULT_NOT_AVAILABLE", "Hasil assessment belum tersedia.");
  return persisted;
}

export async function saveAnswer(id: string, questionId: string, value: unknown) {
  const attempt = await getAttempt(id);
  if (attempt.attempt.status !== "IN_PROGRESS") {
    throw new RuntimeError("ATTEMPT_NOT_IN_PROGRESS", "Attempt tidak sedang berjalan.");
  }
  if (![1, 2, 3, 4, 5].includes(Number(value))) {
    throw new RuntimeError("INVALID_ANSWER", "Jawaban harus bernilai 1 sampai 5.");
  }

  const progress = await persistAnswer(id, questionId, Number(value) as LikertValue).catch((error) => {
    const message = error instanceof Error ? error.message : "Jawaban gagal disimpan.";
    if (message === "ATTEMPT_NOT_FOUND" || message === "ATTEMPT_NOT_IN_PROGRESS" || message === "QUESTION_NOT_IN_ATTEMPT") {
      throw new RuntimeError(message, message === "QUESTION_NOT_IN_ATTEMPT" ? "Question tidak termasuk snapshot." : "Attempt tidak sedang berjalan.");
    }
    throw error;
  });

  return { attemptId: id, questionId, saved: true, progress };
}

export async function submitAssessment(id: string) {
  const attempt = await getAttempt(id);
  if (attempt.result) return attempt.result;
  if (attempt.attempt.status !== "IN_PROGRESS") {
    throw new RuntimeError("ATTEMPT_NOT_IN_PROGRESS", "Attempt tidak sedang berjalan.");
  }

  const progress = await getAttemptProgress(id);
  if (progress.answered !== progress.total) {
    throw new RuntimeError("ASSESSMENT_INCOMPLETE", `${progress.remaining} pertanyaan belum dijawab.`);
  }

  const questions: Question[] = attempt.questions.map((item) => item.question);
  const answers: Answer[] = attempt.answers.map((answer) => ({
    questionId: answer.questionId,
    value: answer.value,
  }));

  let result: AssessmentResult;
  try {
    result = calculateResult(
      questions,
      answers,
      attempt.attempt.assessmentType,
      {
        attemptId: id,
        questionBankVersion: attempt.attempt.questionBankVersion,
        taxonomyVersion: String((attempt.raw.selectionSnapshot as Record<string, unknown>).taxonomyVersion ?? "TAXONOMY_V1"),
        scoringVersion: attempt.attempt.scoringVersion,
        completedAt: new Date().toISOString(),
      },
    );
  } catch (error) {
    throw new RuntimeError("SCORING_FAILED", error instanceof Error ? error.message : "Scoring gagal.");
  }

  return persistCompletedResult(id, result);
}

export async function abandonAssessment(id: string) {
  try {
    return await abandonAttempt(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assessment gagal dihentikan.";
    throw new RuntimeError(message, message === "ATTEMPT_ALREADY_COMPLETED" ? "Assessment sudah selesai." : "Assessment attempt tidak ditemukan.");
  }
}

```

### `app/api/admin/question-bank/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getAdminQuestionBank, getAdminQuestionBankStats } from "../../../../lib/question-bank-admin";

function authorize(request: Request): boolean {
  const configured = process.env.READYSCORE_ADMIN_KEY;
  if (!configured) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-readyscore-admin-key") === configured;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json(
      { ok: false, error: { code: "ADMIN_UNAUTHORIZED", message: "Admin authorization diperlukan." } },
      { status: 401 },
    );
  }

  const [bank, stats] = await Promise.all([getAdminQuestionBank(), getAdminQuestionBankStats()]);
  return NextResponse.json({
    ok: true,
    stats,
    questionBankVersion: bank.questionBankVersion,
    updatedAt: bank.updatedAt,
    questions: bank.questions,
    storage: "postgresql",
  });
}

```

### `app/api/admin/question-bank/upload/route.ts`

```typescript
import { NextResponse } from "next/server";
import { importAdminQuestions } from "../../../../../lib/question-bank-admin";
import { parseQuestionCsv } from "../../../../../lib/question-bank-csv";
import type { AdminQuestion } from "../../../../../lib/question-bank-admin";

function authorize(request: Request): boolean {
  const configured = process.env.READYSCORE_ADMIN_KEY;
  if (!configured) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-readyscore-admin-key") === configured;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json(
      { ok: false, error: { code: "ADMIN_UNAUTHORIZED", message: "Admin authorization diperlukan." } },
      { status: 401 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const mode = form.get("mode") === "replace" ? "replace" : "append";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: { code: "CSV_REQUIRED", message: "File CSV wajib dipilih." } },
        { status: 400 },
      );
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { ok: false, error: { code: "CSV_REQUIRED", message: "Hanya file CSV yang diperbolehkan." } },
        { status: 400 },
      );
    }

    const imported = parseQuestionCsv(await file.text(), file.name);
    const questions: AdminQuestion[] = imported.map((question) => ({ ...question }));
    const result = await importAdminQuestions(questions, mode);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload gagal.";
    const status = message.startsWith("DUPLICATE_") ? 409 : 422;
    return NextResponse.json(
      { ok: false, error: { code: "UPLOAD_FAILED", message } },
      { status },
    );
  }
}

```

### `app/api/admin/question-bank/bulk/route.ts`

```typescript
import { NextResponse } from "next/server";
import { bulkQuestionBankAction } from "../../../../../lib/question-bank-admin";

function authorize(request: Request): boolean {
  const configured = process.env.READYSCORE_ADMIN_KEY;
  if (!configured) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-readyscore-admin-key") === configured;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json(
      { ok: false, error: { code: "ADMIN_UNAUTHORIZED", message: "Admin authorization diperlukan." } },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    action?: "UPDATE_MAPPING" | "APPROVE_MAPPING" | "APPROVE" | "PUBLISH" | "UNPUBLISH";
    mapping?: { domain?: string; subdomain?: string | null; indicator?: string | null };
    questionIds?: string[];
  };

  if (!body.action || !Array.isArray(body.questionIds) || !body.questionIds.length) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_REQUEST", message: "Action dan questionIds wajib diisi." } },
      { status: 400 },
    );
  }

  if (body.action === "UPDATE_MAPPING" && !body.mapping?.domain) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_MAPPING", message: "Domain wajib diisi untuk bulk mapping." } },
      { status: 400 },
    );
  }

  const result = await bulkQuestionBankAction({
    action: body.action,
    questionIds: body.questionIds,
    mapping: body.mapping
      ? {
          domain: body.mapping.domain ?? "",
          subdomain: body.mapping.subdomain ?? null,
          indicator: body.mapping.indicator ?? null,
        }
      : undefined,
  });

  return NextResponse.json({ ok: result.errors.length === 0, ...result });
}

```

### `app/api/admin/question-bank/[questionId]/mapping/route.ts`

```typescript
import { NextResponse } from "next/server";
import { updateQuestionMapping } from "../../../../../../lib/question-bank-admin";

function authorize(request: Request): boolean {
  const configured = process.env.READYSCORE_ADMIN_KEY;
  if (!configured) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-readyscore-admin-key") === configured;
}

export async function POST(request: Request, context: { params: Promise<{ questionId: string }> }) {
  if (!authorize(request)) return NextResponse.json({ ok: false, error: { code: "ADMIN_UNAUTHORIZED", message: "Admin authorization diperlukan." } }, { status: 401 });
  try {
    const { questionId } = await context.params;
    const body = (await request.json()) as { domain?: string; subdomain?: string | null; indicator?: string | null };
    if (!body.domain) return NextResponse.json({ ok: false, error: { code: "INVALID_MAPPING", message: "Domain wajib diisi." } }, { status: 400 });
    const question = await updateQuestionMapping(questionId, { domain: body.domain, subdomain: body.subdomain ?? null, indicator: body.indicator ?? null });
    return NextResponse.json({ ok: true, question });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mapping gagal.";
    const status = message === "QUESTION_NOT_FOUND" ? 404 : message === "UNPUBLISH_BEFORE_MAPPING" ? 409 : message.startsWith("UNKNOWN_") ? 400 : 422;
    return NextResponse.json({ ok: false, error: { code: message, message } }, { status });
  }
}

```

### `app/api/admin/question-bank/[questionId]/mapping-approve/route.ts`

```typescript
import { NextResponse } from "next/server";
import { approveMapping } from "../../../../../../lib/question-bank-admin";

function authorize(request: Request): boolean { const configured = process.env.READYSCORE_ADMIN_KEY; if (!configured) return process.env.NODE_ENV !== "production"; return request.headers.get("x-readyscore-admin-key") === configured; }

export async function POST(request: Request, context: { params: Promise<{ questionId: string }> }) {
  if (!authorize(request)) return NextResponse.json({ ok: false, error: { code: "ADMIN_UNAUTHORIZED", message: "Admin authorization diperlukan." } }, { status: 401 });
  try { const { questionId } = await context.params; return NextResponse.json({ ok: true, question: await approveMapping(questionId) }); }
  catch (error) { const message = error instanceof Error ? error.message : "Action gagal."; return NextResponse.json({ ok: false, error: { code: message, message } }, { status: 409 }); }
}

```

### `app/api/admin/question-bank/[questionId]/approve/route.ts`

```typescript
import { NextResponse } from "next/server";
import { approveQuestion } from "../../../../../../lib/question-bank-admin";
function authorize(request: Request): boolean { const configured = process.env.READYSCORE_ADMIN_KEY; if (!configured) return process.env.NODE_ENV !== "production"; return request.headers.get("x-readyscore-admin-key") === configured; }
export async function POST(request: Request, context: { params: Promise<{ questionId: string }> }) {
  if (!authorize(request)) return NextResponse.json({ ok: false, error: { code: "ADMIN_UNAUTHORIZED", message: "Admin authorization diperlukan." } }, { status: 401 });
  try { const { questionId } = await context.params; return NextResponse.json({ ok: true, question: await approveQuestion(questionId) }); }
  catch (error) { const message = error instanceof Error ? error.message : "Action gagal."; return NextResponse.json({ ok: false, error: { code: message, message } }, { status: 409 }); }
}

```

### `app/api/admin/question-bank/[questionId]/publish/route.ts`

```typescript
import { NextResponse } from "next/server";
import { publishQuestion } from "../../../../../../lib/question-bank-admin";
function authorize(request: Request): boolean { const configured = process.env.READYSCORE_ADMIN_KEY; if (!configured) return process.env.NODE_ENV !== "production"; return request.headers.get("x-readyscore-admin-key") === configured; }
export async function POST(request: Request, context: { params: Promise<{ questionId: string }> }) {
  if (!authorize(request)) return NextResponse.json({ ok: false, error: { code: "ADMIN_UNAUTHORIZED", message: "Admin authorization diperlukan." } }, { status: 401 });
  try { const { questionId } = await context.params; return NextResponse.json({ ok: true, question: await publishQuestion(questionId) }); }
  catch (error) { const message = error instanceof Error ? error.message : "Action gagal."; return NextResponse.json({ ok: false, error: { code: message, message } }, { status: 409 }); }
}

```

### `app/api/admin/question-bank/[questionId]/unpublish/route.ts`

```typescript
import { NextResponse } from "next/server";
import { unpublishQuestion } from "../../../../../../lib/question-bank-admin";
function authorize(request: Request): boolean { const configured = process.env.READYSCORE_ADMIN_KEY; if (!configured) return process.env.NODE_ENV !== "production"; return request.headers.get("x-readyscore-admin-key") === configured; }
export async function POST(request: Request, context: { params: Promise<{ questionId: string }> }) {
  if (!authorize(request)) return NextResponse.json({ ok: false, error: { code: "ADMIN_UNAUTHORIZED", message: "Admin authorization diperlukan." } }, { status: 401 });
  try { const { questionId } = await context.params; return NextResponse.json({ ok: true, question: await unpublishQuestion(questionId) }); }
  catch (error) { const message = error instanceof Error ? error.message : "Action gagal."; return NextResponse.json({ ok: false, error: { code: message, message } }, { status: 409 }); }
}

```

### `app/api/assessment/start/route.ts`

```typescript
import { NextResponse } from "next/server";
import { startAssessment, RuntimeError } from "../../../../lib/assessment/runtime-service";
import type { AssessmentType } from "../../../../lib/assessment-config";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { type?: AssessmentType };
    if (body.type !== "free" && body.type !== "premium") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_ASSESSMENT_TYPE", message: "Tipe assessment tidak valid." } },
        { status: 400 },
      );
    }

    const attempt = await startAssessment(body.type);
    return NextResponse.json({
      ok: true,
      attemptId: attempt.attempt.id,
      status: attempt.attempt.status,
      progress: attempt.progress,
      snapshot: attempt.snapshot,
      questions: attempt.questions.map((question) => ({
        id: question.id,
        code: question.code,
        text: question.text,
        domain: question.domain,
        subdomain: question.subdomain ?? null,
        indicator: question.indicator ?? null,
        difficulty: question.difficulty,
        sequence: question.sequence,
      })),
    });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json({ ok: false, error: { code: error.code, message: error.message } }, { status: 422 });
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal memulai assessment." } },
      { status: 500 },
    );
  }
}

```

### `app/api/assessment/[attemptId]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getAttemptView } from "../../../../lib/assessment/runtime-service";
import { runtimeErrorResponse } from "../runtime-error";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    return NextResponse.json({ ok: true, ...(await getAttemptView(attemptId)) });
  } catch (error) {
    return runtimeErrorResponse(error);
  }
}

```

### `app/api/assessment/[attemptId]/answer/route.ts`

```typescript
import { NextResponse } from "next/server";
import { saveAnswer } from "../../../../../lib/assessment/runtime-service";
import { runtimeErrorResponse } from "../../runtime-error";

async function handle(request: Request, attemptId: string) {
  try {
    const body = await request.json();
    if (!body?.questionId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_REQUEST", message: "questionId wajib diisi." } },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, ...(await saveAnswer(attemptId, body.questionId, body.value)) });
  } catch (error) {
    return runtimeErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  return handle(request, (await context.params).attemptId);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  return handle(request, (await context.params).attemptId);
}

```

### `app/api/assessment/[attemptId]/submit/route.ts`

```typescript
import { NextResponse } from "next/server";
import { submitAssessment } from "../../../../../lib/assessment/runtime-service";
import { runtimeErrorResponse } from "../../runtime-error";

export async function POST(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    return NextResponse.json({ ok: true, result: await submitAssessment(attemptId) });
  } catch (error) {
    return runtimeErrorResponse(error);
  }
}

```

### `app/api/assessment/[attemptId]/result/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getAttemptResult } from "../../../../../lib/assessment/runtime-service";
import { runtimeErrorResponse } from "../../runtime-error";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    return NextResponse.json({ ok: true, result: await getAttemptResult(attemptId) });
  } catch (error) {
    return runtimeErrorResponse(error);
  }
}

```

### `app/api/assessment/[attemptId]/abandon/route.ts`

```typescript
import { NextResponse } from "next/server";
import { abandonAssessment } from "../../../../../lib/assessment/runtime-service";
import { runtimeErrorResponse } from "../../runtime-error";

export async function POST(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    return NextResponse.json({ ok: true, attempt: await abandonAssessment(attemptId) });
  } catch (error) {
    return runtimeErrorResponse(error);
  }
}

```

### `scripts/seed-question-bank.mjs`

```javascript
#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ROOT = process.cwd();
const source = path.join(ROOT, "data", "question-bank", "admin-question-bank.json");

function difficulty(value) {
  const v = String(value ?? "UNSPECIFIED").toUpperCase();
  return ["EASY", "MEDIUM", "HARD", "UNSPECIFIED"].includes(v) ? v : "UNSPECIFIED";
}
function status(value) {
  const v = String(value ?? "DRAFT").toUpperCase();
  return ["DRAFT", "VALIDATED", "MAPPED", "REVIEW_REQUIRED", "APPROVED", "PUBLISHED", "ARCHIVED", "REJECTED"].includes(v) ? v : "DRAFT";
}
function mappingStatus(value) {
  const v = String(value ?? "UNMAPPED").toUpperCase();
  return ["UNMAPPED", "PARTIAL", "MAPPED", "REVIEW_REQUIRED", "APPROVED", "REJECTED"].includes(v) ? v : "UNMAPPED";
}

async function main() {
  if (!fs.existsSync(source)) throw new Error(`Source tidak ditemukan: ${source}`);
  const questions = JSON.parse(fs.readFileSync(source, "utf8"));
  if (!Array.isArray(questions)) throw new Error("admin-question-bank.json bukan array.");

  let created = 0;
  let skipped = 0;

  for (const q of questions) {
    const exists = await prisma.question.findUnique({ where: { code: q.id }, select: { id: true } });
    if (exists) {
      skipped += 1;
      continue;
    }

    await prisma.question.create({
      data: {
        id: q.id,
        code: q.id,
        versions: {
          create: {
            version: "v1",
            text: String(q.text),
            domain: String(q.domain),
            subdomain: q.subdomain ?? null,
            indicator: q.indicator ?? null,
            type: String(q.type ?? "LIKERT"),
            answerType: "LIKERT_5",
            reverseScore: Boolean(q.reverseScore),
            weight: Number(q.weight) > 0 ? Number(q.weight) : 1,
            scale: [1, 2, 3, 4, 5],
            scoringKey: Array.isArray(q.scoringKey) ? q.scoringKey : (q.reverseScore ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5]),
            difficulty: difficulty(q.difficulty),
            status: status(q.status),
            mappingStatus: mappingStatus(q.mappingStatus),
            sourceFile: q.sourceFile ?? "INITIAL_IMPORT",
          },
        },
      },
    });
    created += 1;
  }

  const total = await prisma.question.count();
  const versions = await prisma.questionVersion.count();
  const published = await prisma.questionVersion.count({ where: { status: "PUBLISHED" } });
  const mapped = await prisma.questionVersion.count({ where: { mappingStatus: "APPROVED" } });

  console.log("========================================");
  console.log("ReadyScore PostgreSQL Question Seed");
  console.log("========================================");
  console.log(`Source           : ${path.relative(ROOT, source)}`);
  console.log(`Source rows      : ${questions.length}`);
  console.log(`Created          : ${created}`);
  console.log(`Skipped          : ${skipped}`);
  console.log(`Question total   : ${total}`);
  console.log(`Version total    : ${versions}`);
  console.log(`Mapped/approved  : ${mapped}`);
  console.log(`Published        : ${published}`);
  console.log("========================================");
}

main().catch((error) => {
  console.error("QUESTION BANK SEED FAILED");
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});

```

## Commands setelah replacement

```bash
pnpm db:validate
pnpm db:format
pnpm db:migrate --name question_bank_runtime
pnpm db:generate
node scripts/seed-question-bank.mjs
pnpm typecheck
pnpm build
```

## Runtime verification

1. Buka `/admin/question-bank` dan pastikan jumlah awal menjadi 1825 dari PostgreSQL.
2. Upload `ReadyScore_QuestionBank_Test_200_Additional.csv` dengan mode `Append`. File tambahan akan masuk sebagai DRAFT dan tidak otomatis eligible.
3. Mapping/approve/publish soal yang memang ingin dipakai test.
4. Pastikan `/trial` mendapatkan 20 soal random hanya dari published + mapping approved.
5. Jawab satu soal, refresh, dan pastikan jawaban tetap ada.
6. Submit sampai result terbentuk.
7. Refresh/restart Next.js dan buka `/result/[attemptId]`; result harus tetap ada.

## Catatan

- `data/question-bank/admin-question-bank.json` berubah fungsi menjadi seed/import artifact, bukan runtime store.
- `lib/assessment/runtime-store.ts` tidak lagi menjadi persistence path runtime.
- Auth dan ownership JSON lama belum dimigrasikan pada phase ini; `AssessmentAttempt.userId` tetap nullable sesuai desain 2.15.2.
- `AssessmentResult` ditambahkan pada migration 2.15.3 karena result harus persisted.

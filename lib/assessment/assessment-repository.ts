import { AssessmentType, type Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { AssessmentResult, Answer, LikertValue, Question } from "./types";
import type { SelectedQuestion } from "./question-engine";

export type PersistedAttempt = {
  id: string;
  assessmentType: "free" | "premium" | "riasec" | "disc" | "eq" | "cognitive";
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
  assessmentType: "FREE" | "PREMIUM" | "RIASEC" | "DISC" | "EQ" | "COGNITIVE";
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
    assessmentType: row.assessmentType.toLowerCase() as "free" | "premium" | "riasec" | "disc" | "eq" | "cognitive",
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

export async function createReassessmentAttempt(input: {
  id: string;
  userId: string;
  type: "riasec" | "disc" | "eq" | "cognitive";
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
  creditId: string;
}) {
  await prisma.$transaction(async (tx) => {
    const testType = input.type.toUpperCase() as "RIASEC" | "DISC" | "EQ" | "COGNITIVE";

    const { start, end } = (() => {
      const start = new Date(input.startedAt);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    })();

    const prior = await tx.assessmentAttempt.findFirst({
      where: {
        userId: input.userId,
        assessmentType: testType,
        status: "COMPLETED",
        result: { isNot: null },
      },
      select: { id: true },
      orderBy: { completedAt: "desc" },
    });
    if (!prior) throw new Error("INITIAL_ASSESSMENT_REQUIRED");

    const dailyCount = await tx.assessmentAttempt.count({
      where: {
        userId: input.userId,
        assessmentType: testType,
        status: "COMPLETED",
        startedAt: { gte: start, lt: end },
        selectionSnapshot: { path: ["reassessment"], equals: true },
      },
    });
    if (dailyCount >= 1) throw new Error("REASSESSMENT_DAILY_LIMIT");

    const credit = await tx.reassessmentCredit.findUnique({ where: { id: input.creditId } });
    if (!credit || credit.userId !== input.userId) throw new Error("REASSESSMENT_CREDIT_NOT_FOUND");
    if (credit.status !== "AVAILABLE") throw new Error("REASSESSMENT_CREDIT_NOT_AVAILABLE");
    if (credit.testType !== testType) throw new Error("REASSESSMENT_CREDIT_TYPE_MISMATCH");

    await tx.assessmentAttempt.create({
      data: {
        id: input.id,
        userId: input.userId,
        assessmentType: testType,
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
            questionId: question.questionRecordId,
            questionVersionId: question.questionVersionId,
            sequence: index + 1,
            required: true,
            questionSnapshot: questionSnapshot(question, index + 1) as Prisma.InputJsonValue,
          })),
        },
      },
    });

    const consumed = await tx.reassessmentCredit.updateMany({
      where: {
        id: input.creditId,
        userId: input.userId,
        status: "AVAILABLE",
        testType,
      },
      data: {
        status: "CONSUMED",
        consumedAt: input.startedAt,
        consumedAttemptId: input.id,
      },
    });
    if (consumed.count !== 1) throw new Error("REASSESSMENT_CREDIT_RACE");
  });

  return getAttempt(input.id);
}

export async function createAttempt(input: {
  id: string;
  userId?: string;
  type: "free" | "premium" | "riasec" | "disc" | "eq" | "cognitive";
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
        userId: input.userId,
        assessmentType: input.type.toUpperCase() as AssessmentType,
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
            questionId: question.questionRecordId,
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
    answers: row.answers.map((answer) => {
      const attemptQuestion = row.questions.find((item) => item.id === answer.attemptQuestionId);
      const snapshot = attemptQuestion?.questionSnapshot;
      const publicQuestionId =
        snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) && "id" in snapshot
          ? String((snapshot as Record<string, unknown>).id)
          : answer.questionId;
      return {
        questionId: publicQuestionId,
        value: answer.rawValue as LikertValue,
        answeredAt: answer.answeredAt.toISOString(),
      };
    }),
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

  const question = attempt.questions.find((item) => {
    const snapshot = item.questionSnapshot;
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return false;
    const publicId = String((snapshot as Record<string, unknown>).id ?? "");
    const code = String((snapshot as Record<string, unknown>).code ?? "");
    return publicId === questionId || code === questionId;
  });
  if (!question) throw new Error("QUESTION_NOT_IN_ATTEMPT");

  await prisma.answer.upsert({
    where: { attemptQuestionId: question.id },
    create: {
      attemptId,
      // Answer.questionId is a PostgreSQL Question.id foreign key.
      questionId: question.questionId,
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

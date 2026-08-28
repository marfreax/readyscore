import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
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
  createReassessmentAttempt,
} from "./assessment-repository";
import { selectQuestions, snapshotFromSelection, SelectionError } from "./question-engine";
import { calculateRuntimeAssessmentResult } from "./scoring/engine-v2";
import { interpretAssessmentResult } from "./result/engine-v1";
import type { Answer, AssessmentResult, LikertValue, Question } from "./types";
import {
  getReassessmentEligibility,
  isReassessmentTestType,
} from "./reassessment";

export class RuntimeError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

const newId = (type: AssessmentType) => `${type}-${Date.now()}-${randomBytes(6).toString("hex")}`;
const newSeed = () => randomBytes(16).toString("hex");

export async function startAssessment(
  type: AssessmentType,
  userId?: string,
  options?: { reassessment?: boolean; reassessmentPriorAttemptId?: string },
) {
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
  if (options?.reassessment) {
    (snapshot as Record<string, unknown>).reassessment = true;
    (snapshot as Record<string, unknown>).reassessmentPriorAttemptId =
      options.reassessmentPriorAttemptId ?? null;
  }

  const persisted = await createAttempt({
    id: attemptId,
    userId,
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

export async function startReassessment(
  type: "riasec" | "disc" | "eq" | "cognitive",
  userId: string,
) {
  if (!isReassessmentTestType(type)) {
    throw new RuntimeError("INVALID_ASSESSMENT_TYPE", "Tipe assessment reassessment tidak valid.");
  }

  const eligibility = await getReassessmentEligibility(userId, type);
  if (!eligibility.eligible) {
    throw new RuntimeError(eligibility.code, eligibility.message);
  }

  const config = ASSESSMENT_CONFIG[type];
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
    throw new RuntimeError("SELECTION_COUNT_MISMATCH", "Jumlah question hasil selection tidak sesuai konfigurasi.");
  }

  const snapshot = snapshotFromSelection(
    type,
    { attemptId, attemptSeed, questionBankVersion: stats.questionBankVersion },
    selected,
  );
  (snapshot as Record<string, unknown>).reassessment = true;
  (snapshot as Record<string, unknown>).reassessmentPriorAttemptId = eligibility.priorAttemptId;

  let persisted;
  try {
    persisted = await createReassessmentAttempt({
      id: attemptId,
      userId,
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
      creditId: eligibility.creditId,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "REASSESSMENT_START_FAILED";
    const messages: Record<string, string> = {
      INITIAL_ASSESSMENT_REQUIRED: "Reassessment hanya tersedia setelah assessment awal selesai.",
      REASSESSMENT_DAILY_LIMIT: "Maksimum 1 reassessment untuk test ini per hari.",
      REASSESSMENT_CREDIT_NOT_FOUND: "Reassessment Credit tidak tersedia.",
      REASSESSMENT_CREDIT_NOT_AVAILABLE: "Reassessment Credit tidak tersedia.",
      REASSESSMENT_CREDIT_TYPE_MISMATCH: "Reassessment Credit tidak sesuai dengan test.",
      REASSESSMENT_CREDIT_RACE: "Reassessment Credit baru saja digunakan. Silakan coba lagi.",
    };
    throw new RuntimeError(code, messages[code] ?? "Reassessment gagal dimulai.");
  }

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

export async function getAttemptResultForUser(userId: string, attemptId: string) {
  const owned = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId },
    select: { id: true },
  });
  if (!owned) throw new RuntimeError("RESULT_NOT_AVAILABLE", "Hasil assessment tidak tersedia untuk akun ini.");

  const persisted = await getPersistedResult(attemptId);
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

  const completedAt = new Date().toISOString();
  const taxonomyVersion = String(
    (attempt.raw.selectionSnapshot as Record<string, unknown>).taxonomyVersion ??
      "TAXONOMY_V1",
  );

  let result: AssessmentResult;
  try {
    result = calculateRuntimeAssessmentResult(
      attempt.attempt.assessmentType,
      questions,
      answers,
      {
        attemptId: id,
        assessmentConfigurationVersion:
          attempt.attempt.assessmentConfigurationVersion,
        questionBankVersion: attempt.attempt.questionBankVersion,
        taxonomyVersion,
        scoringVersion: attempt.attempt.scoringVersion,
        completedAt,
      },
    );
  } catch (error) {
    throw new RuntimeError(
      "SCORING_FAILED",
      error instanceof Error ? error.message : "Scoring gagal.",
    );
  }

  let interpretedResult = result;
  if (attempt.attempt.assessmentType === "riasec" || attempt.attempt.assessmentType === "disc" || attempt.attempt.assessmentType === "eq" || attempt.attempt.assessmentType === "cognitive") {
    interpretedResult = interpretAssessmentResult(
      result,
      (result as AssessmentResult & { riasec?: unknown; disc?: unknown; eq?: unknown; cognitive?: unknown })[
        attempt.attempt.assessmentType
      ],
    );
  }

  return persistCompletedResult(id, interpretedResult);
}

export async function abandonAssessment(id: string) {
  try {
    return await abandonAttempt(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assessment gagal dihentikan.";
    throw new RuntimeError(message, message === "ATTEMPT_ALREADY_COMPLETED" ? "Assessment sudah selesai." : "Assessment attempt tidak ditemukan.");
  }
}

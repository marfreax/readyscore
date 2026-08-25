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
import { scoreRiasec } from "./riasec/scoring";
import { toAssessmentResult } from "./riasec/result-adapter";
import type { RiasecAnswer, RiasecQuestion } from "./riasec/types";
import type { Answer, AssessmentResult, LikertValue, Question } from "./types";

export class RuntimeError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

const newId = (type: AssessmentType) => `${type}-${Date.now()}-${randomBytes(6).toString("hex")}`;
const newSeed = () => randomBytes(16).toString("hex");

export async function startAssessment(type: AssessmentType, userId?: string) {
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

  const completedAt = new Date().toISOString();
  const taxonomyVersion = String(
    (attempt.raw.selectionSnapshot as Record<string, unknown>).taxonomyVersion ??
      "TAXONOMY_V1",
  );

  let result: AssessmentResult;
  try {
    if (attempt.attempt.assessmentType === "riasec") {
      const riasecQuestions: RiasecQuestion[] = questions.map((question) => {
        const dimension = question.domain.trim().toUpperCase();
        if (!["R", "I", "A", "S", "E", "C"].includes(dimension)) {
          throw new Error(
            `RIASEC question ${question.id} memiliki dimension tidak valid: ${question.domain}`,
          );
        }

        return {
          id: question.id,
          code: question.code,
          dimension: dimension as RiasecQuestion["dimension"],
          reverseScore: question.reverseScore,
          weight: question.weight,
        };
      });

      const riasecAnswers: RiasecAnswer[] = answers.map((answer) => ({
        questionId: answer.questionId,
        value: answer.value,
      }));

      const measurement = scoreRiasec(riasecQuestions, riasecAnswers);

      result = toAssessmentResult(measurement, {
        attemptId: id,
        assessmentConfigurationVersion:
          attempt.attempt.assessmentConfigurationVersion,
        questionBankVersion: attempt.attempt.questionBankVersion,
        taxonomyVersion,
        scoringVersion: attempt.attempt.scoringVersion,
        completedAt,
      });

      // Preserve the complete test-specific RIASEC contract inside the
      // existing JSON result column. The generic v2 TypeScript contract
      // remains unchanged.
      result = {
        ...result,
        riasec: {
          contractVersion: "RIASEC_RESULT_V1",
          measurement,
        },
      } as AssessmentResult;
    } else {
      result = calculateResult(
        questions,
        answers,
        attempt.attempt.assessmentType,
        {
          attemptId: id,
          questionBankVersion: attempt.attempt.questionBankVersion,
          taxonomyVersion,
          scoringVersion: attempt.attempt.scoringVersion,
          completedAt,
        },
      );
    }
  } catch (error) {
    throw new RuntimeError(
      "SCORING_FAILED",
      error instanceof Error ? error.message : "Scoring gagal.",
    );
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

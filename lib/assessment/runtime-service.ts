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
  expireAttemptIfNeeded,
  persistExpiredResult,
} from "./assessment-repository";
import { selectQuestions, snapshotFromSelection, SelectionError } from "./question-engine";
import { packageSnapshotMetadata, selectPackageAndQuestions, PackageSelectionError } from "../question-package-runtime";
import { calculateUnifiedAssessmentResult } from "./unified-engine";
import { interpretAssessmentResult } from "./result/engine-v1";
import { validateResultSemantics } from "./result/semantics-v1";
import type { Answer, AssessmentResult, CognitiveOptionValue, LikertValue, Question } from "./types";
import { getAssessmentRuntimeContract, toPublicRuntimeQuestion, toPublicRuntimeSnapshot } from "./runtime-contract";
import {
  getReassessmentEligibility,
  isReassessmentTestType,
} from "./reassessment";
import { findConsumableTestEntitlement } from "../commercial/v14-3";

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

  let commercialAccessClaim: Awaited<ReturnType<typeof findConsumableTestEntitlement>> = null;
  const paidTestTypes = new Set(["riasec", "disc", "eq", "cognitive"]);
  if (paidTestTypes.has(type)) {
    if (!userId) throw new RuntimeError("AUTHENTICATION_REQUIRED", "Login diperlukan untuk assessment berbayar.");
    commercialAccessClaim = await findConsumableTestEntitlement(userId, type);
    if (!commercialAccessClaim) {
      throw new RuntimeError("TEST_ACCESS_REQUIRED", "Anda belum memiliki akses assessment ini atau akses sudah digunakan.");
    }
  }

  const stats = await getQuestionBankStats();
  const attemptId = newId(type);
  const attemptSeed = newSeed();

  let selected;
  let packageSelection: Awaited<ReturnType<typeof selectPackageAndQuestions>> | null = null;
  try {
    if (type === "riasec" || type === "disc" || type === "eq" || type === "cognitive") {
      packageSelection = await selectPackageAndQuestions(type, attemptSeed);
      selected = packageSelection.questions;
      if (selected.length !== packageSelection.package.totalQuestions) {
        throw new RuntimeError("SELECTION_COUNT_MISMATCH", "Jumlah question hasil package selection tidak sesuai konfigurasi.");
      }
    } else {
      selected = await selectQuestions(type, attemptSeed);
    }
  } catch (error) {
    if (error instanceof PackageSelectionError) throw new RuntimeError(error.code, error.message);
    if (error instanceof SelectionError) throw new RuntimeError(error.code, error.message);
    throw error;
  }

  if (selected.length !== config.questionCount) {
    throw new RuntimeError(
      "SELECTION_COUNT_MISMATCH",
      "Jumlah question hasil selection tidak sesuai konfigurasi.",
    );
  }

  const startedAt = new Date();
  const timeLimitSeconds = packageSelection?.package.timeLimitSeconds ?? null;
  const expiresAt = timeLimitSeconds ? new Date(startedAt.getTime() + timeLimitSeconds * 1000) : null;

  const snapshot = snapshotFromSelection(
    type,
    {
      attemptId,
      attemptSeed,
      questionBankVersion: stats.questionBankVersion,
    },
    selected,
  );
  if (packageSelection) {
    Object.assign(
      snapshot,
      {
        selectionAlgorithmVersion: packageSelection.package.selectionAlgorithmVersion,
        package: packageSnapshotMetadata(packageSelection.package, attemptSeed, selected),
      timer: expiresAt ? { startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), timeLimitSeconds: timeLimitSeconds } : null,
      },
    );
  }
  if (options?.reassessment) {
    (snapshot as Record<string, unknown>).reassessment = true;
    (snapshot as Record<string, unknown>).reassessmentPriorAttemptId =
      options.reassessmentPriorAttemptId ?? null;
  }

  let persisted: Awaited<ReturnType<typeof createAttempt>>;
  try {
    persisted = await createAttempt({
      id: attemptId,
      userId,
      type,
      assessmentConfigurationId: config.id,
      assessmentConfigurationVersion: config.version,
      questionBankVersion: stats.questionBankVersion,
      taxonomyVersion: snapshot.taxonomyVersion,
      scoringVersion: config.scoringVersion,
      selectionAlgorithmVersion: packageSelection?.package.selectionAlgorithmVersion ?? config.selectionAlgorithmVersion,
      attemptSeed,
      selectionSnapshot: snapshot,
      selectedQuestions: selected,
      startedAt,
      expiresAt,
      commercialAccessClaim: commercialAccessClaim
        ? {
            entitlementId: commercialAccessClaim.id,
            userId: userId!,
            testType: commercialAccessClaim.resourceKey,
            expectedUsageConsumed: commercialAccessClaim.usageConsumed,
            sourceOrderId: commercialAccessClaim.sourceOrderId,
          }
        : undefined,
    });
  } catch (error) {
    // The repository uses a compare-and-set update to guarantee that only one
    // concurrent request can consume a single entitlement. If another request
    // wins that race, expose the same public access-denied contract as a
    // normally exhausted entitlement instead of leaking a generic 500.
    if (error instanceof Error && error.message === "ASSESSMENT_ACCESS_RACE") {
      throw new RuntimeError(
        "TEST_ACCESS_REQUIRED",
        "Anda belum memiliki akses assessment ini atau akses sudah digunakan.",
      );
    }
    throw error;
  }

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
  let packageSelection: Awaited<ReturnType<typeof selectPackageAndQuestions>> | null = null;
  try {
    packageSelection = await selectPackageAndQuestions(type, attemptSeed);
    selected = packageSelection.questions;
  } catch (error) {
    if (error instanceof PackageSelectionError) throw new RuntimeError(error.code, error.message);
    if (error instanceof SelectionError) throw new RuntimeError(error.code, error.message);
    throw error;
  }

  if (selected.length !== config.questionCount) {
    throw new RuntimeError("SELECTION_COUNT_MISMATCH", "Jumlah question hasil selection tidak sesuai konfigurasi.");
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + packageSelection.package.timeLimitSeconds * 1000);
  const snapshot = snapshotFromSelection(
    type,
    { attemptId, attemptSeed, questionBankVersion: stats.questionBankVersion },
    selected,
  );
  Object.assign(
    snapshot,
    {
      selectionAlgorithmVersion: packageSelection.package.selectionAlgorithmVersion,
      package: packageSnapshotMetadata(packageSelection.package, attemptSeed, selected),
      timer: { startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), timeLimitSeconds: packageSelection.package.timeLimitSeconds },
    },
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
      selectionAlgorithmVersion: packageSelection.package.selectionAlgorithmVersion,
      attemptSeed,
      selectionSnapshot: snapshot,
      selectedQuestions: selected,
      startedAt,
      expiresAt,
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
  await expireAttemptIfNeeded(id);
  const persisted = await getPersistedAttempt(id);
  if (!persisted) throw new RuntimeError("ATTEMPT_NOT_FOUND", "Assessment attempt tidak ditemukan.");
  return persisted;
}

function buildRuntimeView(persisted: NonNullable<Awaited<ReturnType<typeof getPersistedAttempt>>>) {
  const questions = persisted.questions.map((item) => {
    const answer = persisted.answers.find((candidate) => candidate.questionId === item.question.id);
    return {
      ...toPublicRuntimeQuestion(item.question, item.sequence),
      // Explicit runtime projection keeps the customer response controls visible
      // while the helper owns the private-metadata exclusion boundary.
      scale: [...item.question.scale],
      options: item.question.options ? [...item.question.options] : undefined,
      answered: Boolean(answer),
      answer: answer?.value ?? null,
    };
  });

  const answered = persisted.answers.length;
  const total = persisted.questions.length;
  return {
    attempt: persisted.attempt,
    timer: persisted.attempt.expiresAt
      ? {
          startedAt: persisted.attempt.startedAt,
          expiresAt: persisted.attempt.expiresAt,
          timeLimitSeconds: Math.max(0, Math.round((new Date(persisted.attempt.expiresAt).getTime() - new Date(persisted.attempt.startedAt).getTime()) / 1000)),
          remainingSeconds: Math.max(0, Math.ceil((new Date(persisted.attempt.expiresAt).getTime() - Date.now()) / 1000)),
          serverNow: new Date().toISOString(),
        }
      : null,
    snapshot: toPublicRuntimeSnapshot(persisted.raw.selectionSnapshot as Record<string, unknown>),
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
  let persisted = await getAttempt(id);
  if (persisted.attempt.status === "EXPIRED" && !persisted.result) {
    await finalizeExpiredAttempt(id);
    persisted = await getAttempt(id);
  }
  return buildRuntimeView(persisted);
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
  if (attempt.attempt.status === "EXPIRED") {
    throw new RuntimeError("ATTEMPT_EXPIRED", "Waktu assessment telah habis.");
  }
  if (attempt.attempt.status !== "IN_PROGRESS") {
    throw new RuntimeError("ATTEMPT_NOT_IN_PROGRESS", "Attempt tidak sedang berjalan.");
  }
  const targetQuestion = attempt.questions.find((item) => item.question.id === questionId)?.question;
  if (!targetQuestion) throw new RuntimeError("QUESTION_NOT_IN_ATTEMPT", "Question tidak termasuk snapshot.");
  const contract = getAssessmentRuntimeContract(attempt.attempt.assessmentType);
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || !contract.scale.includes(numericValue)) {
    throw new RuntimeError("INVALID_ANSWER", `Jawaban harus menggunakan skala ${contract.scale.join("-")}.`);
  }

  const normalizedValue = numericValue as LikertValue | CognitiveOptionValue;
  const progress = await persistAnswer(id, questionId, normalizedValue).catch((error) => {
    const message = error instanceof Error ? error.message : "Jawaban gagal disimpan.";
    if (message === "ATTEMPT_NOT_FOUND" || message === "ATTEMPT_NOT_IN_PROGRESS" || message === "QUESTION_NOT_IN_ATTEMPT") {
      throw new RuntimeError(message, message === "QUESTION_NOT_IN_ATTEMPT" ? "Question tidak termasuk snapshot." : "Attempt tidak sedang berjalan.");
    }
    throw error;
  });

  return { attemptId: id, questionId, saved: true, progress };
}

async function scoreAttempt(id: string, completionMode: "SUBMITTED" | "TIMEOUT") {
  const attempt = await getAttempt(id);
  if (attempt.result) return attempt.result;
  const questions: Question[] = attempt.questions.map((item) => item.question);
  const answers: Answer[] = attempt.answers.map((answer) => ({ questionId: answer.questionId, value: answer.value }));
  const completedAt = new Date().toISOString();
  const taxonomyVersion = String((attempt.raw.selectionSnapshot as Record<string, unknown>).taxonomyVersion ?? "TAXONOMY_V1");
  let result: AssessmentResult;
  try {
    result = calculateUnifiedAssessmentResult(
      attempt.attempt.assessmentType, questions, answers,
      { attemptId: id, assessmentConfigurationVersion: attempt.attempt.assessmentConfigurationVersion, questionBankVersion: attempt.attempt.questionBankVersion, taxonomyVersion, scoringVersion: attempt.attempt.scoringVersion, completedAt, completionMode },
    );
  } catch (error) {
    throw new RuntimeError("SCORING_FAILED", error instanceof Error ? error.message : "Scoring gagal.");
  }
  let interpretedResult = result;
  if (["riasec", "disc", "eq", "cognitive"].includes(attempt.attempt.assessmentType)) {
    const testSpecificResult = (result as AssessmentResult & {
      riasec?: unknown;
      disc?: unknown;
      eq?: unknown;
      cognitive?: unknown;
      [key: string]: unknown;
    })[attempt.attempt.assessmentType];
    interpretedResult = interpretAssessmentResult(result, testSpecificResult);
    validateResultSemantics(interpretedResult);
  }
  if (completionMode === "TIMEOUT") return persistExpiredResult(id, interpretedResult);
  return persistCompletedResult(id, interpretedResult);
}

export async function finalizeExpiredAttempt(id: string) {
  await expireAttemptIfNeeded(id);
  const attempt = await getAttempt(id);
  if (attempt.result) return attempt.result;
  if (attempt.attempt.status !== "EXPIRED") throw new RuntimeError("ATTEMPT_NOT_EXPIRED", "Attempt belum expired.");
  return scoreAttempt(id, "TIMEOUT");
}

export async function submitAssessment(id: string) {
  const attempt = await getAttempt(id);
  if (attempt.result) return attempt.result;
  if (attempt.attempt.status === "EXPIRED") return finalizeExpiredAttempt(id);
  if (attempt.attempt.status !== "IN_PROGRESS") {
    throw new RuntimeError("ATTEMPT_NOT_IN_PROGRESS", "Attempt tidak sedang berjalan.");
  }
  const progress = await getAttemptProgress(id);
  if (progress.answered !== progress.total) {
    throw new RuntimeError("ASSESSMENT_INCOMPLETE", `${progress.remaining} pertanyaan belum dijawab.`);
  }
  return scoreAttempt(id, "SUBMITTED");
}

export async function abandonAssessment(id: string) {
  try {
    return await abandonAttempt(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assessment gagal dihentikan.";
    throw new RuntimeError(message, message === "ATTEMPT_ALREADY_COMPLETED" ? "Assessment sudah selesai." : "Assessment attempt tidak ditemukan.");
  }
}

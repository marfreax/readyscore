import type { AssessmentType } from "../assessment-config";
import type { Answer, Question, QuestionAnswerType } from "./types";

export type AssessmentRuntimeContract = {
  readonly assessmentType: AssessmentType;
  readonly answerType: QuestionAnswerType;
  readonly questionCount: number;
  readonly scale: readonly number[];
  readonly optionsRequired: boolean;
  readonly scoringMetadataRequired: "COGNITIVE" | "EQ" | "DISC" | "RIASEC" | "LEGACY";
};

const CONTRACTS: Record<AssessmentType, AssessmentRuntimeContract> = {
  free: { assessmentType: "free", answerType: "LIKERT_5", questionCount: 60, scale: [1, 2, 3, 4, 5], optionsRequired: false, scoringMetadataRequired: "LEGACY" },
  premium: { assessmentType: "premium", answerType: "LIKERT_5", questionCount: 100, scale: [1, 2, 3, 4, 5], optionsRequired: false, scoringMetadataRequired: "LEGACY" },
  cognitive: { assessmentType: "cognitive", answerType: "SINGLE_CHOICE_4", questionCount: 40, scale: [1, 2, 3, 4], optionsRequired: true, scoringMetadataRequired: "COGNITIVE" },
  eq: { assessmentType: "eq", answerType: "SINGLE_CHOICE_4", questionCount: 50, scale: [1, 2, 3, 4], optionsRequired: true, scoringMetadataRequired: "EQ" },
  disc: { assessmentType: "disc", answerType: "SINGLE_CHOICE_4", questionCount: 80, scale: [1, 2, 3, 4], optionsRequired: true, scoringMetadataRequired: "DISC" },
  riasec: { assessmentType: "riasec", answerType: "LIKERT_5", questionCount: 60, scale: [1, 2, 3, 4, 5], optionsRequired: false, scoringMetadataRequired: "RIASEC" },
};

export function getAssessmentRuntimeContract(type: AssessmentType): AssessmentRuntimeContract {
  return CONTRACTS[type];
}

function assertScale(question: Question, expected: readonly number[]) {
  if (question.scale.length !== expected.length || question.scale.some((value, index) => Number(value) !== expected[index])) {
    throw new Error(`${question.id} has an invalid ${expected.length}-point response scale.`);
  }
}

function assertQuestionSemantics(type: AssessmentType, question: Question) {
  const contract = CONTRACTS[type];
  if (question.answerType !== contract.answerType) {
    throw new Error(`${type} question ${question.id} must use ${contract.answerType}.`);
  }
  assertScale(question, contract.scale);

  if (contract.optionsRequired) {
    if (!Array.isArray(question.options) || question.options.length !== 4 || new Set(question.options).size !== 4) {
      throw new Error(`${type} question ${question.id} requires four unique customer options.`);
    }
  } else if (question.options !== undefined) {
    throw new Error(`${type} question ${question.id} must not contain choice options.`);
  }

  if (type === "cognitive") {
    if (!Number.isInteger(question.correctOption) || Number(question.correctOption) < 1 || Number(question.correctOption) > 4) {
      throw new Error(`Cognitive question ${question.id} requires an internal correct option.`);
    }
  }
  if (type === "disc") {
    if (question.scoringKey.length !== 4 || new Set(question.scoringKey).size !== 4) {
      throw new Error(`DISC question ${question.id} requires an item-specific four-position scoring key.`);
    }
  }
  if (type === "eq") {
    if (question.scoringKey.length !== 4 || new Set(question.scoringKey).size !== 4) {
      throw new Error(`EQ question ${question.id} requires an explicit four-value scoring key.`);
    }
  }
  if (type === "riasec") {
    if (question.scoringKey.length !== 5 || question.scoringKey.some((value, index) => Number(value) !== index + 1)) {
      throw new Error(`RIASEC question ${question.id} requires the identity 1-5 scoring key.`);
    }
    if (question.reverseScore !== false || Number(question.weight) !== 1) {
      throw new Error(`RIASEC question ${question.id} violates the protected V2 scoring boundary.`);
    }
    if (question.correctOption !== undefined && question.correctOption !== null) {
      throw new Error(`RIASEC question ${question.id} must not contain correctOption.`);
    }
  }
}

export function validateAssessmentRuntimeQuestions(type: AssessmentType, questions: Question[]): void {
  const contract = CONTRACTS[type];
  if (questions.length !== contract.questionCount) {
    throw new Error(`${type} requires exactly ${contract.questionCount} questions; received ${questions.length}.`);
  }
  const ids = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error(`${type} question identities must be unique.`);
    ids.add(question.id);
    assertQuestionSemantics(type, question);
  }
}

export function validateAssessmentRuntimeAnswers(type: AssessmentType, questions: Question[], answers: Answer[]): void {
  validateAssessmentRuntimeQuestions(type, questions);
  if (answers.length !== questions.length) {
    throw new Error(`${type} requires ${questions.length} answers; received ${answers.length}.`);
  }
  const questionIds = new Set(questions.map((question) => question.id));
  const answerIds = new Set<string>();
  const max = CONTRACTS[type].scale.length;
  for (const answer of answers) {
    if (!questionIds.has(answer.questionId)) throw new Error(`${type} answer references unknown question ${answer.questionId}.`);
    if (answerIds.has(answer.questionId)) throw new Error(`${type} answers must not contain duplicate question IDs.`);
    answerIds.add(answer.questionId);
    if (!Number.isInteger(answer.value) || answer.value < 1 || answer.value > max) {
      throw new Error(`Invalid ${type} answer for question ${answer.questionId}.`);
    }
  }
}

/** Public runtime projection. Never includes scoring keys, reverse keys, weights, or objective answer keys. */
export function toPublicRuntimeQuestion(question: Question, sequence?: number) {
  const publicQuestion = {
    id: question.id,
    code: question.code,
    text: question.text,
    domain: question.domain,
    subdomain: question.subdomain ?? null,
    indicator: question.indicator ?? null,
    type: question.type,
    answerType: question.answerType,
    scale: [...question.scale],
    options: question.options ? [...question.options] : undefined,
    difficulty: question.difficulty,
    ...(sequence === undefined ? {} : { sequence }),
  };
  return publicQuestion;
}

export function toPublicRuntimeSnapshot(snapshot: Record<string, unknown>) {
  return {
    attemptId: String(snapshot.attemptId ?? ""),
    assessmentType: String(snapshot.assessmentType ?? ""),
    assessmentConfigurationVersion: String(snapshot.assessmentConfigurationVersion ?? ""),
    questionBankVersion: String(snapshot.questionBankVersion ?? ""),
    taxonomyVersion: String(snapshot.taxonomyVersion ?? ""),
    scoringVersion: String(snapshot.scoringVersion ?? ""),
    selectionAlgorithmVersion: String(snapshot.selectionAlgorithmVersion ?? ""),
    selectedQuestionIds: Array.isArray(snapshot.selectedQuestionIds) ? snapshot.selectedQuestionIds.map(String) : [],
    selectedQuestionVersionIds: Array.isArray(snapshot.selectedQuestionVersionIds) ? snapshot.selectedQuestionVersionIds.map(String) : [],
    selectedQuestionSequence: Array.isArray(snapshot.selectedQuestionSequence) ? snapshot.selectedQuestionSequence.map(String) : [],
    ...(snapshot.package && typeof snapshot.package === "object" && !Array.isArray(snapshot.package)
      ? {
          package: {
            packageId: String((snapshot.package as Record<string, unknown>).packageId ?? ""),
            packageCode: String((snapshot.package as Record<string, unknown>).packageCode ?? ""),
            packageVersionId: String((snapshot.package as Record<string, unknown>).packageVersionId ?? ""),
            packageVersion: String((snapshot.package as Record<string, unknown>).packageVersion ?? ""),
            packageTotalQuestions: Number((snapshot.package as Record<string, unknown>).packageTotalQuestions ?? 0),
            timeLimitSeconds: Number((snapshot.package as Record<string, unknown>).timeLimitSeconds ?? 0),
            taxonomyVersionId: String((snapshot.package as Record<string, unknown>).taxonomyVersionId ?? ""),
            taxonomyVersion: String((snapshot.package as Record<string, unknown>).taxonomyVersion ?? ""),
            selectionAlgorithmVersion: String((snapshot.package as Record<string, unknown>).selectionAlgorithmVersion ?? ""),
            composition: Array.isArray((snapshot.package as Record<string, unknown>).composition)
              ? (snapshot.package as Record<string, unknown>).composition
              : [],
            selectedQuestionIds: Array.isArray((snapshot.package as Record<string, unknown>).selectedQuestionIds)
              ? ((snapshot.package as Record<string, unknown>).selectedQuestionIds as unknown[]).map(String)
              : [],
            selectedQuestionVersionIds: Array.isArray((snapshot.package as Record<string, unknown>).selectedQuestionVersionIds)
              ? ((snapshot.package as Record<string, unknown>).selectedQuestionVersionIds as unknown[]).map(String)
              : [],
            selectedQuestionSequence: Array.isArray((snapshot.package as Record<string, unknown>).selectedQuestionSequence)
              ? ((snapshot.package as Record<string, unknown>).selectedQuestionSequence as unknown[]).map(String)
              : [],
          },
        }
      : {}),
    timer: snapshot.timer && typeof snapshot.timer === "object" && !Array.isArray(snapshot.timer)
      ? {
          startedAt: String((snapshot.timer as Record<string, unknown>).startedAt ?? ""),
          expiresAt: String((snapshot.timer as Record<string, unknown>).expiresAt ?? ""),
          timeLimitSeconds: Number((snapshot.timer as Record<string, unknown>).timeLimitSeconds ?? 0),
        }
      : null,
    selectionMetadata: snapshot.selectionMetadata && typeof snapshot.selectionMetadata === "object" && !Array.isArray(snapshot.selectionMetadata)
      ? { selectedCount: Number((snapshot.selectionMetadata as Record<string, unknown>).selectedCount ?? 0) }
      : { selectedCount: 0 },
    ...(snapshot.reassessment === true ? { reassessment: true } : {}),
  };
}

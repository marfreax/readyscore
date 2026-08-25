import { calculateResult } from "../scoring-engine";
import { scoreRiasec } from "./scoring";
import { toAssessmentResult } from "./result-adapter";
import { createRiasecPersistableResult } from "./result-contract";
import type { AssessmentResult, Answer, Question } from "../types";
import type { RiasecAnswer, RiasecDimension, RiasecQuestion } from "./types";

const RIASEC_DIMENSIONS = new Set<RiasecDimension>(["R","I","A","S","E","C"]);

export type RuntimeAssessmentType = "free" | "premium" | "riasec";

export type RuntimeScoringMetadata = {
  attemptId: string;
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  taxonomyVersion: string;
  scoringVersion: string;
  completedAt: string;
};

function toRiasecQuestions(questions: Question[]): RiasecQuestion[] {
  if (questions.length !== 60) {
    throw new Error(`RIASEC requires exactly 60 questions; received ${questions.length}.`);
  }

  return questions.map((question) => {
    const dimension = String(question.domain ?? "").trim().toUpperCase() as RiasecDimension;
    if (!RIASEC_DIMENSIONS.has(dimension)) {
      throw new Error(
        `RIASEC question ${question.id} has invalid dimension "${question.domain}".`,
      );
    }
    return {
      id: question.id,
      code: question.code,
      dimension,
      reverseScore: Boolean(question.reverseScore),
      weight: Number(question.weight) > 0 ? Number(question.weight) : 1,
    };
  });
}

function assertRiasecDistribution(questions: RiasecQuestion[]): void {
  for (const dimension of RIASEC_DIMENSIONS) {
    const count = questions.filter((q) => q.dimension === dimension).length;
    if (count !== 10) {
      throw new Error(
        `RIASEC dimension "${dimension}" requires exactly 10 questions; received ${count}.`,
      );
    }
  }
}

function toRiasecAnswers(answers: Answer[]): RiasecAnswer[] {
  return answers.map((answer) => {
    if (![1,2,3,4,5].includes(answer.value)) {
      throw new Error(`Invalid RIASEC answer for question ${answer.questionId}.`);
    }
    return { questionId: answer.questionId, value: answer.value };
  });
}

export function calculateRuntimeAssessmentResult(
  assessmentType: RuntimeAssessmentType,
  questions: Question[],
  answers: Answer[],
  metadata: RuntimeScoringMetadata,
): AssessmentResult {
  if (assessmentType === "riasec") {
    const riasecQuestions = toRiasecQuestions(questions);
    assertRiasecDistribution(riasecQuestions);

    const riasecAnswers = toRiasecAnswers(answers);
    if (riasecAnswers.length !== riasecQuestions.length) {
      throw new Error(
        `RIASEC requires ${riasecQuestions.length} answers; received ${riasecAnswers.length}.`,
      );
    }

    const measurement = scoreRiasec(riasecQuestions, riasecAnswers);

    const genericResult = toAssessmentResult(measurement, {
      attemptId: metadata.attemptId,
      assessmentConfigurationVersion: metadata.assessmentConfigurationVersion,
      questionBankVersion: metadata.questionBankVersion,
      taxonomyVersion: metadata.taxonomyVersion,
      scoringVersion: metadata.scoringVersion,
      completedAt: metadata.completedAt,
    });

    const persistedRiasec = createRiasecPersistableResult(measurement, {
      attemptId: metadata.attemptId,
      testType: "RIASEC",
      assessmentConfigurationVersion: metadata.assessmentConfigurationVersion,
      questionBankVersion: metadata.questionBankVersion,
      scoringVersion: metadata.scoringVersion,
      completedAt: metadata.completedAt,
    });

    return {
      ...genericResult,
      riasec: persistedRiasec,
    } as AssessmentResult & { riasec: typeof persistedRiasec };
  }

  return calculateResult(questions, answers, assessmentType, {
    attemptId: metadata.attemptId,
    questionBankVersion: metadata.questionBankVersion,
    taxonomyVersion: metadata.taxonomyVersion,
    scoringVersion: metadata.scoringVersion,
    completedAt: metadata.completedAt,
  });
}

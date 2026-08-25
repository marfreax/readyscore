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

import { calculateRuntimeAssessmentResult } from "./runtime-dispatch";
import type { Answer, Question } from "../types";

const questions: Question[] = [
  ...["R", "I", "A", "S", "E", "C"].flatMap((dimension) =>
    Array.from({ length: 10 }, (_, index) => ({
      id: `${dimension}-${index + 1}`,
      code: `RIASEC-${dimension}-${index + 1}`,
      text: `${dimension} question ${index + 1}`,
      domain: dimension,
      subdomain: null,
      indicator: null,
      type: "LIKERT",
      answerType: "LIKERT_5" as const,
      scale: [1, 2, 3, 4, 5] as const,
      reverseScore: false,
      scoringKey: [1, 2, 3, 4, 5] as const,
      weight: 1,
      difficulty: "MEDIUM" as const,
      status: "PUBLISHED" as const,
      mappingStatus: "APPROVED" as const,
      version: "TEST",
      source: "TEST",
    })),
  ),
];

const answers: Answer[] = questions.map((question) => ({
  questionId: question.id,
  value:
    question.domain === "I"
      ? 5
      : question.domain === "R"
        ? 4
        : question.domain === "E"
          ? 3
          : 2,
}));

const result = calculateRuntimeAssessmentResult(
  "riasec",
  questions,
  answers,
  {
    attemptId: "attempt-riasec-dispatch-test",
    assessmentConfigurationVersion: "RIASEC_CONFIG_V1",
    questionBankVersion: "RIASEC_QB_V1",
    taxonomyVersion: "RIASEC_TAXONOMY_V1",
    scoringVersion: "RIASEC_SCORE_V1",
    completedAt: "2026-08-22T00:00:00.000Z",
  },
);

if (result.assessmentType !== "RIASEC") {
  throw new Error("Runtime dispatch did not route to RIASEC.");
}

if (result.attemptId !== "attempt-riasec-dispatch-test") {
  throw new Error("Attempt provenance mismatch.");
}

console.log("RIASEC_F9.1_RUNTIME_DISPATCH_TEST passed.");

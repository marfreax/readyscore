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
  answerType: "LIKERT_5" | "SINGLE_CHOICE_4";
  reverseScore: boolean;
  weight: number;
  scale: readonly number[];
  scoringKey: readonly number[];
  difficulty: string;
  status: string;
  mappingStatus: string;
  sourceFile?: string;
  options?: string[] | null;
  correctOption?: number | null;
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
    answerType: q.answerType,
    scale: [...q.scale],
    reverseScore: q.reverseScore,
    scoringKey: q.scoringKey,
    options: q.options ?? undefined,
    correctOption: q.correctOption ?? undefined,
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

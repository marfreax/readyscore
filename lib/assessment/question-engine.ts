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

export type SelectedQuestion = Question & {
  /** Canonical PostgreSQL Question.id used only at persistence boundary. */
  questionRecordId: string;
  /** Immutable PostgreSQL QuestionVersion.id captured in the attempt snapshot. */
  questionVersionId: string;
};

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
      questionRecordId: q.questionRecordId,
      questionVersionId: q.questionVersionId,
    };
  });

  const s = seed ?? Math.random().toString(36);
  let selected: SelectedQuestion[] = [];

  if (type === "riasec") {
    const dimensions = ["R", "I", "A", "S", "E", "C"] as const;
    const quota = 10;

    for (const dimension of dimensions) {
      const candidates = seededShuffle(
        runtimeQuestions.filter(
          (q) => q.domain.trim().toUpperCase() === dimension,
        ),
        `${s}:RIASEC:${dimension}`,
      );

      if (candidates.length < quota) {
        throw new SelectionError(
          "INSUFFICIENT_RIASEC_DIMENSION_QUESTIONS",
          `RIASEC dimension "${dimension}" tidak cukup. Membutuhkan ${quota}, tersedia ${candidates.length}.`,
        );
      }

      selected.push(...candidates.slice(0, quota));
    }

    selected = seededShuffle(selected, `${s}:RIASEC`);
  } else if (type === "free") {
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

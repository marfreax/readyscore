import { ASSESSMENT_CONFIG, type AssessmentType } from "../assessment-config";
import { getPublishedEligibleQuestions } from "../question-bank-repository";
import { getPublishedQuestionBank } from "../catalog/question-bank";
import { getAssessmentReadyQuestions } from "./question-bank";
import type { Question } from "./types";
import type { ScoringKey } from "../question-bank-types";

export class SelectionError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "SelectionError";
  }
}

function normalizeScoringKey(value: number[]): ScoringKey {
  if (value.length === 5 && value.every((v, i) => v === [5, 4, 3, 2, 1][i])) {
    return [5, 4, 3, 2, 1] as const;
  }
  return [1, 2, 3, 4, 5] as const;
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
  const eligible = type === "riasec" || type === "disc" || type === "eq" || type === "cognitive"
    ? (await getPublishedQuestionBank(type === "riasec" ? "RIASEC" : type === "disc" ? "DISC" : type === "eq" ? "EQ" : "COGNITIVE")).map((q) => ({
        id: q.questionCode,
        domain: q.domain,
        subdomain: q.subdomain,
        indicator: q.indicator,
        text: q.text,
        type: q.type,
        reverseScore: q.reverseScore,
        weight: q.weight,
        scale: [1, 2, 3, 4, 5] as const,
        scoringKey: normalizeScoringKey(q.scoringKey),
        difficulty: q.difficulty,
        status: q.status,
        mappingStatus: q.mappingStatus,
        sourceFile: undefined,
        questionRecordId: q.questionRecordId,
        questionVersionId: q.questionVersionId,
      }))
    : await getPublishedEligibleQuestions();

  const scopedEligible = type === "free" || type === "premium"
    ? eligible.filter((q) => !q.id.toUpperCase().startsWith("DISC-"))
    : eligible;

  if (scopedEligible.length < config.questionCount) {
    throw new SelectionError(
      "INSUFFICIENT_ELIGIBLE_QUESTIONS",
      `Membutuhkan ${config.questionCount} question eligible, tersedia ${eligible.length}.`,
    );
  }

  const runtimeQuestions: SelectedQuestion[] = scopedEligible.map((q) => {
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
  } else if (type === "disc") {
    const dimensions = ["D", "I", "S", "C"] as const;
    const quota = 6;
    for (const dimension of dimensions) {
      const candidates = seededShuffle(
        runtimeQuestions.filter((q) => q.domain.trim().toUpperCase() === dimension),
        `${s}:DISC:${dimension}`,
      );
      if (candidates.length < quota) {
        throw new SelectionError(
          "INSUFFICIENT_DISC_DIMENSION_QUESTIONS",
          `DISC dimension "${dimension}" tidak cukup. Membutuhkan ${quota}, tersedia ${candidates.length}.`,
        );
      }
      selected.push(...candidates.slice(0, quota));
    }
    selected = seededShuffle(selected, `${s}:DISC`);
  } else if (type === "eq") {
    const dimensions = [
      "EMOTION_AWARENESS",
      "EMOTION_REGULATION",
      "EMPATHY_SOCIAL_AWARENESS",
      "RELATIONSHIP_SOCIAL_RESPONSE",
    ] as const;
    const quota = 6;
    for (const dimension of dimensions) {
      const candidates = seededShuffle(
        runtimeQuestions.filter((q) => q.domain.trim().toUpperCase() === dimension),
        `${s}:EQ:${dimension}`,
      );
      if (candidates.length < quota) {
        throw new SelectionError(
          "INSUFFICIENT_EQ_DIMENSION_QUESTIONS",
          `EQ dimension "${dimension}" tidak cukup. Membutuhkan ${quota}, tersedia ${candidates.length}.`,
        );
      }
      selected.push(...candidates.slice(0, quota));
    }
    selected = seededShuffle(selected, `${s}:EQ`);
  } else if (type === "cognitive") {
    const dimensions = [
      "VERBAL_REASONING",
      "NUMERICAL_REASONING",
      "LOGICAL_REASONING",
      "ABSTRACT_REASONING",
    ] as const;
    const quota = 6;
    for (const dimension of dimensions) {
      const candidates = seededShuffle(
        runtimeQuestions.filter((q) => q.domain.trim().toUpperCase() === dimension),
        `${s}:COGNITIVE:${dimension}`,
      );
      if (candidates.length < quota) {
        throw new SelectionError(
          "INSUFFICIENT_COGNITIVE_DIMENSION_QUESTIONS",
          `Cognitive dimension "${dimension}" tidak cukup. Membutuhkan ${quota}, tersedia ${candidates.length}.`,
        );
      }
      selected.push(...candidates.slice(0, quota));
    }
    selected = seededShuffle(selected, `${s}:COGNITIVE`);
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
    taxonomyVersion: type === "disc" ? "DISC_TAXONOMY_V1" : type === "eq" ? "EQ_TAXONOMY_V1" : type === "cognitive" ? "COGNITIVE_TAXONOMY_V1" : "TAXONOMY_V1",
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

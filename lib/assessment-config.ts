export type AssessmentType = "free" | "premium" | "riasec";

export const ASSESSMENT_CONFIG = {
  free: {
    id: "free-v1",
    version: "FREE_V1",
    questionCount: 20,
    scoringVersion: "SCORING_V1",
    selectionAlgorithmVersion: "SELECTION_V1",
    status: "PUBLISHED" as const,
  },
  premium: {
    id: "premium-v1",
    version: "PREMIUM_V1",
    questionCount: 100,
    scoringVersion: "SCORING_V1",
    selectionAlgorithmVersion: "SELECTION_V1",
    status: "PUBLISHED" as const,
  },
  riasec: {
    id: "riasec-v1",
    version: "RIASEC_CONFIG_V1",
    questionCount: 60,
    scoringVersion: "RIASEC_SCORE_V1",
    selectionAlgorithmVersion: "RIASEC_SELECTION_V1",
    status: "PUBLISHED" as const,
  },
} satisfies Record<AssessmentType, {
  id: string;
  version: string;
  questionCount: number;
  scoringVersion: string;
  selectionAlgorithmVersion: string;
  status: "PUBLISHED";
}>;

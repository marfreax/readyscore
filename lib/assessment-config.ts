export type AssessmentType = "free" | "premium" | "riasec" | "disc" | "eq" | "cognitive";

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
  disc: {
    id: "disc-v1",
    version: "DISC_CONFIG_V1",
    questionCount: 24,
    scoringVersion: "DISC_SCORE_V1",
    selectionAlgorithmVersion: "DISC_SELECTION_V1",
    status: "PUBLISHED" as const,
  },
  eq: {
    id: "eq-v1",
    version: "EQ_CONFIG_V1",
    questionCount: 24,
    scoringVersion: "EQ_SCORE_V1",
    selectionAlgorithmVersion: "EQ_SELECTION_V1",
    status: "PUBLISHED" as const,
  },
  cognitive: {
    id: "cognitive-v1",
    version: "COGNITIVE_CONFIG_V1",
    questionCount: 24,
    scoringVersion: "COGNITIVE_SCORE_V1",
    selectionAlgorithmVersion: "COGNITIVE_SELECTION_V1",
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

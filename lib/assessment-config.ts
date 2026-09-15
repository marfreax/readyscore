export type AssessmentType = "free" | "premium" | "riasec" | "disc" | "eq" | "cognitive";

export const ASSESSMENT_CONFIG = {
  free: {
    id: "free-v1",
    version: "FREE_V1",
    questionCount: 10,
    scoringVersion: "RIASEC_FREE_SCORE_V1",
    selectionAlgorithmVersion: "RIASEC_FREE_SELECTION_V1",
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
    id: "disc-v2",
    version: "DISC_CONFIG_V2",
    questionCount: 80,
    timeLimitSeconds: 1200,
    scoringVersion: "DISC_SCORE_V2",
    selectionAlgorithmVersion: "DISC_SELECTION_V2",
    status: "PUBLISHED" as const,
  },
  eq: {
    id: "eq-v2",
    version: "EQ_CONFIG_V2",
    questionCount: 50,
    timeLimitSeconds: 1200,
    scoringVersion: "EQ_SCORE_V2",
    selectionAlgorithmVersion: "EQ_SELECTION_V2",
    status: "PUBLISHED" as const,
  },
  cognitive: {
    id: "cognitive-v2",
    version: "COGNITIVE_CONFIG_V2",
    questionCount: 40,
    timeLimitSeconds: 1200,
    scoringVersion: "COGNITIVE_SCORE_V2",
    selectionAlgorithmVersion: "COGNITIVE_SELECTION_V2",
    status: "PUBLISHED" as const,
  },
  riasec: {
    id: "riasec-v2",
    version: "RIASEC_CONFIG_V2",
    questionCount: 60,
    timeLimitSeconds: 1200,
    scoringVersion: "RIASEC_SCORE_V2",
    selectionAlgorithmVersion: "RIASEC_SELECTION_V2",
    status: "PUBLISHED" as const,
  },
} satisfies Record<AssessmentType, {
  id: string;
  version: string;
  questionCount: number;
  scoringVersion: string;
  selectionAlgorithmVersion: string;
  status: "PUBLISHED";
  timeLimitSeconds?: number;
}>;


/**
 * Immutable audit evidence for the pre-V8 Cognitive/assessment configuration
 * boundary. This is historical metadata only; runtime MUST use ASSESSMENT_CONFIG.
 */
export const LEGACY_ASSESSMENT_CONFIG_V1 = {
  cognitive: {
    id: "cognitive-v1",
    version: "COGNITIVE_CONFIG_V1",
    questionCount: 24,
    scoringVersion: "COGNITIVE_SCORE_V1",
    selectionAlgorithmVersion: "COGNITIVE_SELECTION_V1",
  },
  eq: {
    id: "eq-v1",
    version: "EQ_CONFIG_V1",
    questionCount: 24,
    scoringVersion: "EQ_SCORE_V1",
    selectionAlgorithmVersion: "EQ_SELECTION_V1",
  },
  disc: {
    id: "disc-v1",
    version: "DISC_CONFIG_V1",
    questionCount: 24,
    scoringVersion: "DISC_SCORE_V1",
    selectionAlgorithmVersion: "DISC_SELECTION_V1",
  },
  riasec: {
    id: "riasec-v1",
    version: "RIASEC_CONFIG_V1",
    questionCount: 60,
    scoringVersion: "RIASEC_SCORE_V1",
    selectionAlgorithmVersion: "RIASEC_SELECTION_V1",
  },
} as const;

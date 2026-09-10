import { TEST_RESULT_CONTRACT_VERSION } from "../result/types";
import type { AssessmentResult } from "../types";
import { COGNITIVE_DIMENSIONS, type CognitiveDimension } from "./scoring";

export const COGNITIVE_INTERPRETATION_VERSION = "COGNITIVE_INTERPRETATION_V2" as const;

const LABELS: Record<CognitiveDimension, string> = {
  VERBAL_REASONING: "Verbal Reasoning",
  NUMERICAL_REASONING: "Numerical Reasoning",
  LOGICAL_REASONING: "Logical Reasoning",
  ABSTRACT_REASONING: "Abstract Reasoning",
};

const DESCRIPTIONS: Record<CognitiveDimension, string> = {
  VERBAL_REASONING: "Kemampuan menalar menggunakan bahasa, makna, dan hubungan antar-gagasan.",
  NUMERICAL_REASONING: "Kemampuan menalar menggunakan angka, besaran, dan hubungan kuantitatif.",
  LOGICAL_REASONING: "Kemampuan menyusun hubungan sebab-akibat, aturan, dan pola penalaran secara terstruktur.",
  ABSTRACT_REASONING: "Kemampuan mengenali pola, hubungan, dan struktur ketika informasi tidak disajikan secara langsung.",
};

export function interpretCognitive(
  result: AssessmentResult & {
    cognitive?: {
      measurement?: {
        dimensionScores?: Array<{
          dimension: CognitiveDimension;
          score: number;
          answeredCount: number;
          questionCount: number;
        }>;
        overallScore?: number;
      };
    };
  },
) {
  const measurement = result.cognitive?.measurement;
  if (!measurement) throw new Error("Cognitive interpretation requires COGNITIVE_RESULT_V2 measurement.");
  const dimensions = measurement.dimensionScores;
  if (!dimensions || dimensions.length !== COGNITIVE_DIMENSIONS.length) {
    throw new Error("Cognitive interpretation requires four dimension scores.");
  }

  const ranked = [...dimensions].sort((a, b) => b.score - a.score);
  const strongest = ranked[0];
  const developing = ranked[ranked.length - 1];

  return {
    contractVersion: TEST_RESULT_CONTRACT_VERSION,
    interpretationVersion: COGNITIVE_INTERPRETATION_VERSION,
    status: "COMPLETE" as const,
    confidence: "MODERATE" as const,
    summary: `Hasil Anda menunjukkan performa relatif pada empat dimensi penalaran. ${LABELS[strongest.dimension]} merupakan dimensi dengan skor relatif paling tinggi, sementara ${LABELS[developing.dimension]} merupakan area yang dapat dieksplorasi lebih lanjut. Hasil ini adalah profil berbasis assessment dan bukan skor IQ atau diagnosis kemampuan kognitif.`,
    dimensions: dimensions.map((item) => ({
      dimension: item.dimension,
      name: LABELS[item.dimension],
      score: item.score,
      description: DESCRIPTIONS[item.dimension],
    })),
    strongestDimension: { code: strongest.dimension, name: LABELS[strongest.dimension] },
    developmentDimension: { code: developing.dimension, name: LABELS[developing.dimension] },
    claims: {
      allowed: ["relative patterns across the four cognitive reasoning dimensions", "potential areas of strength", "areas to explore or strengthen"],
      restricted: ["formal intelligence scores", "fixed cognitive ability labels"],
      prohibited: ["IQ claims", "clinical or diagnostic conclusions", "deterministic academic or career decisions", "claiming psychometric validation from runtime execution alone"],
    },
  };
}

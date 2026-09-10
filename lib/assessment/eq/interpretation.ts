import { TEST_RESULT_CONTRACT_VERSION } from "../result/types";
import type { AssessmentResult } from "../types";
import { EQ_DIMENSIONS, type EqDimension } from "./scoring";

export const EQ_INTERPRETATION_VERSION = "EQ_INTERPRETATION_V2" as const;

const LABELS: Record<EqDimension, string> = {
  EMOTION_AWARENESS: "Emotion Awareness",
  EMOTION_REGULATION: "Emotion Regulation",
  EMPATHY_SOCIAL_AWARENESS: "Empathy / Social Awareness",
  RELATIONSHIP_SOCIAL_RESPONSE: "Relationship / Social Response",
};

const DESCRIPTIONS: Record<EqDimension, string> = {
  EMOTION_AWARENESS: "Mengenali dan memperhatikan perubahan keadaan emosi diri dalam berbagai situasi.",
  EMOTION_REGULATION: "Mengelola respons emosi agar tetap dapat memilih tindakan secara terarah.",
  EMPATHY_SOCIAL_AWARENESS: "Memperhatikan perspektif, kebutuhan, dan sinyal emosional orang lain.",
  RELATIONSHIP_SOCIAL_RESPONSE: "Merespons perbedaan, umpan balik, dan interaksi sosial secara konstruktif.",
};

function band(score: number) {
  if (score >= 75) return "RELATIVELY_STRONG";
  if (score >= 50) return "MODERATE";
  return "AREA_TO_EXPLORE";
}

export function interpretEq(
  result: AssessmentResult & {
    eq?: {
      measurement?: {
        dimensionScores?: Array<{
          dimension: EqDimension;
          score: number;
          answeredCount: number;
          questionCount: number;
        }>;
      };
    };
  },
) {
  const measurement = result.eq?.measurement;
  if (!measurement) throw new Error("EQ interpretation requires EQ_RESULT_V2 measurement.");

  const dimensions = measurement.dimensionScores;
  if (!dimensions || dimensions.length !== EQ_DIMENSIONS.length) {
    throw new Error("EQ interpretation requires four dimension scores.");
  }

  const ranked = [...dimensions].sort((a, b) => b.score - a.score);
  const strongest = ranked[0];
  const developing = ranked[ranked.length - 1];

  return {
    contractVersion: TEST_RESULT_CONTRACT_VERSION,
    interpretationVersion: EQ_INTERPRETATION_VERSION,
    status: "COMPLETE" as const,
    confidence: "MODERATE" as const,
    summary: `Profil EQ Anda menunjukkan pola relatif pada empat dimensi yang dioperasionalkan dalam assessment. ${LABELS[strongest.dimension]} memiliki skor relatif paling tinggi, sedangkan ${LABELS[developing.dimension]} merupakan area yang dapat dieksplorasi lebih lanjut. Hasil ini menggambarkan respons Anda pada situasi yang diberikan dan bukan diagnosis klinis atau ukuran absolut kemampuan emosional.`,
    overall: {
      score: measurement.overallScore,
      description: "EQ Score adalah ringkasan terstandar 0–100 dari skor respons situasional pada empat dimensi EQ ReadyScore.",
    },
    dimensions: dimensions.map((item) => ({
      dimension: item.dimension,
      name: LABELS[item.dimension],
      score: item.score,
      band: band(item.score),
      description: DESCRIPTIONS[item.dimension],
    })),
    strongestDimension: { code: strongest.dimension, name: LABELS[strongest.dimension] },
    developmentDimension: { code: developing.dimension, name: LABELS[developing.dimension] },
    claims: {
      allowed: [
        "relative patterns across the four EQ dimensions",
        "potential areas of strength",
        "areas to explore or strengthen",
        "response patterns to the presented situations",
      ],
      restricted: [
        "fixed emotional intelligence labels",
        "claims that the score is a clinical or diagnostic measure",
        "claims that the score is equivalent to a standardized population IQ/EQ norm",
      ],
      prohibited: [
        "clinical diagnosis",
        "deterministic academic or career decisions",
        "claiming psychometric validation from runtime execution alone",
      ],
    },
  };
}

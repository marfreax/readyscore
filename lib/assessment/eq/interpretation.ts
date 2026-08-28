import { TEST_RESULT_CONTRACT_VERSION } from "../result/types";
import type { AssessmentResult } from "../types";
import { EQ_DIMENSIONS, type EqDimension } from "../scoring/eq";

export const EQ_INTERPRETATION_VERSION = "EQ_INTERPRETATION_V1" as const;

const LABELS: Record<EqDimension, string> = {
  EMOTION_AWARENESS: "Emotion Awareness",
  EMOTION_REGULATION: "Emotion Regulation",
  EMPATHY_SOCIAL_AWARENESS: "Empathy / Social Awareness",
  RELATIONSHIP_SOCIAL_RESPONSE: "Relationship / Social Response",
};

const DESCRIPTIONS: Record<EqDimension, string> = {
  EMOTION_AWARENESS: "Mengenali dan memperhatikan keadaan emosi diri dalam situasi sehari-hari.",
  EMOTION_REGULATION: "Mengelola respons emosi agar tetap dapat bertindak secara terarah.",
  EMPATHY_SOCIAL_AWARENESS: "Memperhatikan dan memahami perspektif atau keadaan emosional orang lain.",
  RELATIONSHIP_SOCIAL_RESPONSE: "Merespons dan membangun interaksi sosial secara konstruktif.",
};

export function interpretEq(result: AssessmentResult & { eq?: { measurement?: { dimensionScores?: Array<{ dimension: EqDimension; score: number; answeredCount: number; questionCount: number }> } } }) {
  const measurement = result.eq?.measurement;
  if (!measurement) throw new Error("EQ interpretation requires EQ_RESULT_V1 measurement.");
  const dimensions = measurement.dimensionScores;
  if (!dimensions || dimensions.length !== EQ_DIMENSIONS.length) throw new Error("EQ interpretation requires four dimension scores.");

  const ranked = [...dimensions].sort((a,b)=>b.score-a.score);
  const strongest = ranked[0];
  const developing = ranked[ranked.length-1];

  return {
    contractVersion: TEST_RESULT_CONTRACT_VERSION,
    interpretationVersion: EQ_INTERPRETATION_VERSION,
    status: "COMPLETE" as const,
    confidence: "MODERATE" as const,
    summary: `Profil EQ Anda menunjukkan variasi relatif pada empat dimensi. ${LABELS[strongest.dimension]} merupakan dimensi dengan skor relatif paling tinggi, sementara ${LABELS[developing.dimension]} merupakan area yang dapat dieksplorasi lebih lanjut. Hasil ini menggambarkan respons pada assessment, bukan diagnosis atau ukuran tunggal kemampuan emosional seseorang.`,
    dimensions: dimensions.map((item) => ({
      dimension: item.dimension,
      name: LABELS[item.dimension],
      score: item.score,
      description: DESCRIPTIONS[item.dimension],
    })),
    strongestDimension: { code: strongest.dimension, name: LABELS[strongest.dimension] },
    developmentDimension: { code: developing.dimension, name: LABELS[developing.dimension] },
    claims: {
      allowed: ["relative patterns across the four EQ dimensions", "potential areas of strength", "areas to explore or strengthen"],
      restricted: ["fixed emotional intelligence labels", "clinical or diagnostic conclusions"],
      prohibited: ["clinical diagnosis", "deterministic academic or career decisions", "claiming psychometric validation from runtime execution alone"],
    },
  };
}

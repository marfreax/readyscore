import { TEST_RESULT_CONTRACT_VERSION } from "../result/types";

export const DISC_INTERPRETATION_VERSION = "DISC_INTERPRETATION_V2" as const;

const LABELS = {
  D: "Dominance",
  I: "Influence",
  S: "Steadiness",
  C: "Conscientiousness",
} as const;

const CONTENT = {
  D: {
    tendencies: "Cenderung mengambil inisiatif, tegas, cepat menentukan arah, dan berorientasi pada hasil.",
    strengths: ["Inisiatif", "Keberanian mengambil keputusan", "Orientasi hasil"],
    challenges: ["Memberi ruang bagi perspektif lain", "Menyesuaikan tempo", "Memastikan detail sebelum bergerak"],
  },
  I: {
    tendencies: "Cenderung ekspresif, persuasif, energik, dan aktif membangun interaksi dengan orang lain.",
    strengths: ["Komunikasi", "Membangun antusiasme", "Membangun relasi"],
    challenges: ["Menjaga fokus", "Konsistensi tindak lanjut", "Memperhatikan detail"],
  },
  S: {
    tendencies: "Cenderung kooperatif, suportif, stabil, dan memperhatikan kenyamanan serta kesinambungan kerja sama.",
    strengths: ["Kerja sama", "Dukungan terhadap orang lain", "Konsistensi"],
    challenges: ["Menghadapi perubahan cepat", "Menyampaikan ketidaksetujuan", "Mengambil keputusan tegas"],
  },
  C: {
    tendencies: "Cenderung teliti, sistematis, hati-hati, dan memperhatikan kualitas, aturan, serta kejelasan.",
    strengths: ["Ketelitian", "Analisis terstruktur", "Menjaga kualitas"],
    challenges: ["Beradaptasi dengan ambiguitas", "Mengambil keputusan dengan informasi terbatas", "Menjaga fleksibilitas"],
  },
} as const;

export function interpretDisc(result: {
  disc?: {
    measurement?: {
      primaryPattern: "D" | "I" | "S" | "C";
      secondaryPattern: "D" | "I" | "S" | "C";
      dimensionScores?: Array<{ dimension: "D" | "I" | "S" | "C"; score: number }>;
      profileModel?: "IPSATIVE_FORCED_CHOICE";
      scoreMeaning?: "SHARE_OF_FORCED_CHOICES";
    };
  };
}) {
  const measurement = result.disc?.measurement;
  if (!measurement) throw new Error("DISC interpretation requires DISC_RESULT_V2 measurement.");
  if (measurement.profileModel !== "IPSATIVE_FORCED_CHOICE") {
    throw new Error("DISC V2 interpretation requires the ipsative forced-choice profile model.");
  }

  const primary = measurement.primaryPattern;
  const secondary = measurement.secondaryPattern;

  return {
    contractVersion: TEST_RESULT_CONTRACT_VERSION,
    interpretationVersion: DISC_INTERPRETATION_VERSION,
    status: "COMPLETE" as const,
    confidence: "MODERATE" as const,
    summary:
      `Pola pilihan perilaku yang paling dominan dalam assessment ini adalah ${LABELS[primary]}, ` +
      `diikuti ${LABELS[secondary]}. Hasil menggambarkan kecenderungan respons dalam situasi yang diberikan, ` +
      `bukan kemampuan, diagnosis, atau prediksi pasti keberhasilan.`,
    primaryPattern: {
      code: primary,
      name: LABELS[primary],
      behavioralTendencies: CONTENT[primary].tendencies,
    },
    secondaryPattern: {
      code: secondary,
      name: LABELS[secondary],
      behavioralTendencies: CONTENT[secondary].tendencies,
    },
    profile: measurement.dimensionScores?.map((item) => ({
      code: item.dimension,
      name: LABELS[item.dimension],
      score: item.score,
    })) ?? [],
    behavioralTendencies: [CONTENT[primary].tendencies, CONTENT[secondary].tendencies],
    potentialStrengths: [...CONTENT[primary].strengths],
    potentialChallenges: [...CONTENT[primary].challenges],
    claims: {
      allowed: ["behavioral response tendencies", "potential strengths", "potential challenges"],
      restricted: ["fixed personality labels", "deterministic study or career fit"],
      prohibited: [
        "aptitude or intelligence claims",
        "clinical or diagnostic claims",
        "deterministic career or major decisions from DISC alone",
        "universal score across assessments",
      ],
    },
    methodology: {
      responseModel: "situational forced-choice",
      scoreMeaning: "share of forced choices mapped to each behavioral dimension",
      note: "Dimension percentages are ipsative within this assessment and should not be interpreted as independent ability scores.",
    },
  };
}

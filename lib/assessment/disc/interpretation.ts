import { TEST_RESULT_CONTRACT_VERSION } from "../result/types";

export const DISC_INTERPRETATION_VERSION = "DISC_INTERPRETATION_V1" as const;
const LABELS = { D:"Dominance", I:"Influence", S:"Steadiness", C:"Conscientiousness" } as const;
const CONTENT = {
  D:{ tendencies:"Cenderung langsung, tegas, berorientasi pada hasil dan keputusan.", strengths:["Inisiatif","Keberanian mengambil keputusan","Orientasi hasil"], challenges:["Kesabaran terhadap proses","Mendengarkan sebelum bertindak","Menyesuaikan tempo dengan orang lain"]},
  I:{ tendencies:"Cenderung ekspresif, persuasif, energik, dan berorientasi pada interaksi.", strengths:["Komunikasi","Membangun antusiasme","Relasi sosial"], challenges:["Konsistensi detail","Menjaga fokus","Menindaklanjuti komitmen"]},
  S:{ tendencies:"Cenderung stabil, kooperatif, suportif, dan menghargai ritme yang terprediksi.", strengths:["Kerja sama","Dukungan terhadap orang lain","Konsistensi"], challenges:["Menghadapi perubahan cepat","Menyampaikan ketidaksetujuan","Mengambil keputusan tegas"]},
  C:{ tendencies:"Cenderung teliti, sistematis, hati-hati, dan memperhatikan standar.", strengths:["Ketelitian","Analisis terstruktur","Menjaga kualitas"], challenges:["Beradaptasi dengan ambiguitas","Mengambil keputusan dengan informasi terbatas","Menjaga fleksibilitas"]},
} as const;

export function interpretDisc(result: { disc?: { measurement?: { primaryPattern:"D"|"I"|"S"|"C"; secondaryPattern:"D"|"I"|"S"|"C" } } }) {
  const m = result.disc?.measurement;
  if (!m) throw new Error("DISC interpretation requires DISC_RESULT_V1 measurement.");
  const primary = m.primaryPattern, secondary = m.secondaryPattern;
  return {
    contractVersion:TEST_RESULT_CONTRACT_VERSION,
    interpretationVersion:DISC_INTERPRETATION_VERSION,
    status:"COMPLETE" as const,
    confidence:"MODERATE" as const,
    summary:`Pola utama Anda adalah ${LABELS[primary]}, dengan ${LABELS[secondary]} sebagai pola sekunder. Hasil ini menggambarkan kecenderungan perilaku dalam konteks assessment, bukan kemampuan atau prediksi pasti keberhasilan.`,
    primaryPattern:{ code:primary, name:LABELS[primary], behavioralTendencies:CONTENT[primary].tendencies },
    secondaryPattern:{ code:secondary, name:LABELS[secondary] },
    behavioralTendencies:[CONTENT[primary].tendencies, CONTENT[secondary].tendencies],
    potentialStrengths:[...CONTENT[primary].strengths],
    potentialChallenges:[...CONTENT[primary].challenges],
    claims:{
      allowed:["behavioral tendency patterns","potential strengths","potential challenges"],
      restricted:["fixed personality labels","deterministic study or career fit"],
      prohibited:["aptitude or intelligence claims","deterministic career or major decisions from DISC alone"],
    },
  };
}

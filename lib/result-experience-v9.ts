export const RESULT_EXPERIENCE_V9_VERSION = "V9.9_RESULT_EXPERIENCE_V1" as const;

export type ResultExperienceDefinition = {
  assessmentType: "COGNITIVE" | "EQ" | "DISC" | "RIASEC";
  eyebrow: string;
  title: string;
  description: string;
  metricLabel: string;
  metricMeaning: string;
  profileTitle: string;
  profileDescription: string;
  nextAction: string;
  limitations: string;
};

export const RESULT_EXPERIENCE: Readonly<Record<ResultExperienceDefinition["assessmentType"], ResultExperienceDefinition>> = {
  COGNITIVE: {
    assessmentType: "COGNITIVE",
    eyebrow: "Cognitive · Result",
    title: "Cognitive Reasoning Profile",
    description: "Ringkasan performa relatif pada empat dimensi penalaran yang diukur dalam assessment ini.",
    metricLabel: "Cognitive Score",
    metricMeaning: "Skor presentasi 0–100 untuk hasil assessment ini; bukan skor IQ atau norma populasi.",
    profileTitle: "Empat dimensi penalaran",
    profileDescription: "Gunakan perbedaan relatif antar-dimensi untuk memahami pola performa pada assessment ini.",
    nextAction: "Gunakan hasil sebagai bahan refleksi terhadap cara Anda menghadapi informasi, pola, dan masalah penalaran.",
    limitations: "Hasil ini bukan skor IQ, diagnosis, norma populasi, atau bukti validasi psikometrik. Jangan gunakan sebagai satu-satunya dasar keputusan akademik atau karier.",
  },
  EQ: {
    assessmentType: "EQ",
    eyebrow: "EQ · Result",
    title: "EQ Profile",
    description: "Ringkasan pola respons relatif pada empat dimensi EQ dalam situasi yang disajikan.",
    metricLabel: "EQ Score",
    metricMeaning: "Skor presentasi 0–100 untuk assessment ini; bukan norma populasi atau diagnosis klinis.",
    profileTitle: "Empat dimensi EQ",
    profileDescription: "Perhatikan pola relatif antar-dimensi dan konteks situasi yang menjadi dasar respons Anda.",
    nextAction: "Gunakan hasil sebagai bahan refleksi dan pengembangan kemampuan emosional dalam konteks nyata.",
    limitations: "Hasil ini menggambarkan respons pada situasi yang diberikan. Ini bukan diagnosis klinis, norma populasi, atau bukti validasi psikometrik.",
  },
  DISC: {
    assessmentType: "DISC",
    eyebrow: "DISC · Result",
    title: "Behavioral Profile",
    description: "Ringkasan pola pilihan perilaku relatif D/I/S/C dari situasi forced-choice yang disajikan.",
    metricLabel: "Primary Pattern",
    metricMeaning: "Pola yang paling dominan dalam distribusi pilihan forced-choice assessment ini.",
    profileTitle: "D / I / S / C Profile",
    profileDescription: "Keempat dimensi merupakan distribusi ipsative dalam assessment ini; bandingkan secara relatif, bukan sebagai kemampuan independen.",
    nextAction: "Gunakan hasil untuk merefleksikan pola interaksi dan cara bekerja dalam konteks yang berbeda.",
    limitations: "DISC menggambarkan kecenderungan respons perilaku, bukan aptitude, intelligence, diagnosis, atau kepastian kecocokan jurusan/karier.",
  },
  RIASEC: {
    assessmentType: "RIASEC",
    eyebrow: "RIASEC · Result",
    title: "RIASEC Interest Profile",
    description: "Ringkasan pola preferensi relatif pada enam dimensi vocational interest.",
    metricLabel: "Top Code",
    metricMeaning: "Kode yang merangkum dimensi minat yang paling menonjol dalam hasil ini.",
    profileTitle: "Six Interest Dimensions",
    profileDescription: "Enam dimensi membantu melihat pola minat relatif dan area yang layak dieksplorasi lebih lanjut.",
    nextAction: "Gunakan hasil sebagai bahan eksplorasi minat bersama pengalaman, konteks, dan informasi lain.",
    limitations: "RIASEC menggambarkan minat vokasional, bukan kemampuan atau kecerdasan, dan tidak menjamin kecocokan jurusan maupun karier.",
  },
};

export function getResultExperience(assessmentType: string): ResultExperienceDefinition {
  const key = assessmentType.trim().toUpperCase() as ResultExperienceDefinition["assessmentType"];
  const result = RESULT_EXPERIENCE[key];
  if (!result) throw new Error(`Unsupported result experience type: ${assessmentType}`);
  return result;
}

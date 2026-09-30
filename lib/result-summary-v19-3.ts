export type V19_3_SummaryType = "RIASEC" | "DISC" | "EQ" | "COGNITIVE" | "WORK_ATTITUDE" | "LEARNING_PREFERENCE";

type DimensionLike = { code: string; name: string; description?: string; score: number | null };

type SummaryInput = {
  assessmentType: string;
  interpretationSummary?: string | null;
  dimensions: DimensionLike[];
  primary?: string | null;
  secondary?: string | null;
  dominant?: string[];
};

const LABELS: Record<string, string> = {
  R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional",
  D: "Dominance", IFL: "Influence", ST: "Steadiness", CND: "Conscientiousness",
  EMOTION_AWARENESS: "Emotion Awareness", EMOTION_REGULATION: "Emotion Regulation",
  EMPATHY_SOCIAL_AWARENESS: "Empathy / Social Awareness", RELATIONSHIP_SOCIAL_RESPONSE: "Relationship / Social Response",
  VERBAL_REASONING: "Verbal Reasoning", NUMERICAL_REASONING: "Numerical Reasoning", LOGICAL_REASONING: "Logical Reasoning", ABSTRACT_REASONING: "Abstract Reasoning",
  SYSTEMATIKA_KERJA: "Sistematika Kerja", POLA_BERPIKIR: "Pola Berpikir", PENGAMBILAN_KEPUTUSAN: "Pengambilan Keputusan", KERJASAMA: "Kerjasama", INTERAKSI_SOSIAL: "Interaksi Sosial", PENYESUAIAN_DIRI: "Penyesuaian Diri", KEDISIPLINAN: "Kedisiplinan",
  VISUAL: "Visual", AUDITORY: "Auditory", KINESTHETIC: "Kinesthetic",
};

const TYPE_LABEL: Record<V19_3_SummaryType, string> = {
  RIASEC: "RIASEC",
  DISC: "DISC",
  EQ: "Emotional Intelligence",
  COGNITIVE: "Cognitive",
  WORK_ATTITUDE: "Work Attitude",
  LEARNING_PREFERENCE: "Learning Preference",
};

function normalizeType(value: string): V19_3_SummaryType {
  const normalized = value.trim().toUpperCase().replace(/-/g, "_");
  if (["RIASEC", "DISC", "EQ", "COGNITIVE", "WORK_ATTITUDE", "LEARNING_PREFERENCE"].includes(normalized)) return normalized as V19_3_SummaryType;
  throw new Error(`V19_3_SUMMARY_UNSUPPORTED_ASSESSMENT:${value}`);
}

function label(code: string) { return LABELS[code] ?? code; }
function ranked(dimensions: DimensionLike[]) { return dimensions.filter((d) => d.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)); }

export type V19_3_AssessmentSummary = {
  title: string;
  reading: string;
  strengths: string[];
  areasToWatch: string[];
};

export function buildAssessmentSummaryV19_3(input: SummaryInput): V19_3_AssessmentSummary {
  const type = normalizeType(input.assessmentType);
  const dims = ranked(input.dimensions);
  const strongest = dims[0];
  const weakest = dims.at(-1);
  const interpretation = input.interpretationSummary?.trim();
  const typeLabel = TYPE_LABEL[type];

  const strengths = type === "DISC" && input.primary
    ? [
        ...(dims.filter((d) => label(d.code) === label(input.primary!)).map((d) => `${label(d.code)} menjadi pola utama dalam hasil ini.`)),
        ...dims.slice(0, 3).filter((d) => label(d.code) !== label(input.primary!)).map((d) => `${label(d.code)} terlihat sebagai kecenderungan relatif yang menonjol.`),
      ].slice(0, 3)
    : dims.slice(0, 3).map((d) => `${d.name || label(d.code)} terlihat sebagai area relatif yang paling menonjol dalam assessment ini.`);

  const areasToWatch = type === "DISC"
    ? dims.slice(-3).reverse().map((d) => `${d.name || label(d.code)} layak diperhatikan ketika situasi menuntut penyesuaian atau keseimbangan dengan pola lain.`)
    : dims.slice(-3).reverse().map((d) => `${d.name || label(d.code)} menjadi area relatif yang dapat dieksplorasi atau dikembangkan lebih lanjut.`);

  let reading = interpretation || `Hasil ${typeLabel} ini menunjukkan pola relatif pada dimensi yang diukur dalam assessment.`;
  if (strongest) {
    if (type === "RIASEC") reading += ` Secara umum, pola minat yang paling menonjol berpusat pada ${strongest.name}, sehingga area aktivitas yang terkait dapat menjadi titik awal eksplorasi.`;
    else if (type === "DISC") reading += ` Dalam pembacaan keseluruhan, ${label(input.primary ?? strongest.code)} menjadi pola utama${input.secondary ? ` dengan ${label(input.secondary)} sebagai pola pendukung` : ""}.`;
    else if (type === "EQ") reading += ` Dimensi ${strongest.name} menjadi sinyal relatif yang paling menonjol, sehingga dapat digunakan sebagai titik refleksi ketika membaca respons emosional dan sosial.`;
    else if (type === "COGNITIVE") reading += ` Dimensi ${strongest.name} menjadi area relatif yang paling menonjol; hasil ini tetap perlu dibaca sebagai profil assessment, bukan sebagai skor IQ.`;
    else if (type === "WORK_ATTITUDE") reading += ` Dimensi ${strongest.name} menjadi area relatif yang paling menonjol dalam cara hasil ini menggambarkan kecenderungan sikap kerja.`;
    else if (type === "LEARNING_PREFERENCE") reading += ` Preferensi ${input.dominant?.join(" / ") || strongest.name} dapat menjadi petunjuk untuk mencoba pendekatan belajar yang terasa lebih natural, tanpa menjadikannya batas kemampuan.`;
  }
  if (weakest) reading += ` Area dengan skor relatif lebih rendah bukan berarti kekurangan; area tersebut lebih tepat digunakan sebagai bahan refleksi, latihan, dan eksplorasi dalam konteks nyata.`;

  return { title: "Assessment Summary", reading, strengths, areasToWatch };
}

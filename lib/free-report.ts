import type { AssessmentResult } from "./assessment/types";

export type FreeReportData = {
  typeCode: string;
  typeName: string;
  interpretation: string;
  strengths: string[];
  learningStyle: string;
  recommendations: string[];
};

const CONTENT: Record<string, Omit<FreeReportData, "typeCode">> = {
  R: {
    typeName: "REALISTIC",
    interpretation: "Kamu cenderung menyukai aktivitas yang konkret, praktis, teknis, dan menghasilkan sesuatu yang bisa dilihat atau digunakan.",
    strengths: ["Praktis dan berorientasi pada hasil", "Suka bekerja dengan objek, alat, atau proses nyata", "Cenderung menikmati tantangan yang jelas dan terukur"],
    learningStyle: "Biasanya lebih mudah memahami materi ketika ada contoh nyata, praktik, simulasi, atau kesempatan mencoba langsung.",
    recommendations: ["Teknik", "Teknik Mesin", "Teknik Sipil"],
  },
  I: {
    typeName: "INVESTIGATIVE",
    interpretation: "Kamu cenderung analitis, penasaran, dan menikmati proses memahami masalah, mencari pola, serta menemukan penjelasan.",
    strengths: ["Analitis dan suka mencari alasan di balik sesuatu", "Senang memecahkan masalah", "Cenderung nyaman dengan eksplorasi dan pertanyaan yang menantang"],
    learningStyle: "Biasanya lebih mudah memahami materi melalui konsep, eksperimen, riset, data, dan kesempatan untuk menemukan jawaban sendiri.",
    recommendations: ["Psikologi", "Data Science", "Statistik"],
  },
  A: {
    typeName: "ARTISTIC",
    interpretation: "Kamu cenderung kreatif, imajinatif, dan membutuhkan ruang untuk menghasilkan atau mengekspresikan gagasan.",
    strengths: ["Kreatif dalam melihat kemungkinan", "Menyukai kebebasan berekspresi", "Cenderung peka terhadap bentuk, ide, atau pengalaman"],
    learningStyle: "Biasanya lebih mudah memahami materi melalui visual, proyek kreatif, eksplorasi ide, dan kebebasan mencoba pendekatan berbeda.",
    recommendations: ["Desain Komunikasi Visual", "Arsitektur", "Film"],
  },
  S: {
    typeName: "SOCIAL",
    interpretation: "Kamu cenderung menikmati interaksi, membantu orang lain, mengajar, mendampingi, atau membangun hubungan yang positif.",
    strengths: ["Peduli pada kebutuhan orang lain", "Cenderung nyaman berkomunikasi dan berkolaborasi", "Menikmati aktivitas yang memberi dampak pada orang lain"],
    learningStyle: "Biasanya lebih mudah memahami materi melalui diskusi, kerja kelompok, praktik sosial, mentoring, dan interaksi langsung.",
    recommendations: ["Pendidikan", "Psikologi", "Komunikasi"],
  },
  E: {
    typeName: "ENTERPRISING",
    interpretation: "Kamu cenderung nyaman mengambil inisiatif, memengaruhi orang lain, memimpin, dan mengejar target.",
    strengths: ["Inisiatif dan berorientasi pada peluang", "Cenderung nyaman memimpin atau menggerakkan orang lain", "Menyukai target dan tantangan yang jelas"],
    learningStyle: "Biasanya lebih mudah memahami materi melalui proyek, presentasi, simulasi, tantangan, dan pengalaman mengambil keputusan.",
    recommendations: ["Manajemen", "Marketing", "Entrepreneurship"],
  },
  C: {
    typeName: "CONVENTIONAL",
    interpretation: "Kamu cenderung menyukai struktur, keteraturan, detail, data, dan proses yang jelas.",
    strengths: ["Teliti dan terstruktur", "Nyaman bekerja dengan data atau aturan", "Cenderung menghargai proses yang rapi dan konsisten"],
    learningStyle: "Biasanya lebih mudah memahami materi melalui struktur yang jelas, langkah bertahap, latihan teratur, dan contoh yang sistematis.",
    recommendations: ["Akuntansi", "Sistem Informasi", "Administrasi"],
  },
};

export function buildFreeReport(result: AssessmentResult): FreeReportData {
  const top = String(result.domainScores?.slice().sort((a, b) => b.score - a.score)[0]?.domainId ?? "I").toUpperCase();
  const content = CONTENT[top] ?? CONTENT.I;
  return { typeCode: top in CONTENT ? top : "I", ...content };
}

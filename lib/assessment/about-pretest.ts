import { CUSTOMER_ASSESSMENT_CATALOG, type CustomerAssessmentCatalogItem } from "./catalog";

export type AssessmentAboutPreTest = CustomerAssessmentCatalogItem & {
  purpose: string;
  whatToExpect: string;
  preparation: string[];
  responseInstruction: string;
  resultSummary: string;
  limitations: string[];
};

const CONTENT: Record<string, Omit<AssessmentAboutPreTest, keyof CustomerAssessmentCatalogItem>> = {
  cognitive: {
    purpose: "Melihat pola penalaran melalui tugas dengan jawaban objektif pada beberapa area kognitif.",
    whatToExpect: "Anda akan membaca stimulus atau soal lalu memilih satu jawaban yang paling tepat. Fokus pada informasi yang tersedia di setiap item.",
    preparation: ["Kerjakan saat Anda dapat fokus tanpa banyak gangguan.", "Baca setiap soal sampai selesai sebelum memilih jawaban.", "Gunakan informasi yang diberikan oleh soal, bukan asumsi di luar soal."],
    responseInstruction: "Pilih satu jawaban yang paling tepat. Item memiliki jawaban yang dinilai secara objektif.",
    resultSummary: "Cognitive Score dan Cognitive Profile sesuai struktur hasil assessment.",
    limitations: ["Bukan skor IQ universal.", "Bukan diagnosis klinis.", "Hasil tidak boleh diperlakukan sebagai pengganti evaluasi profesional."],
  },
  eq: {
    purpose: "Melihat pola respons emosional dan sosial melalui situasi yang relevan dengan empat area EQ.",
    whatToExpect: "Anda akan membaca situasi dan memilih respons yang paling tepat menurut konteks yang diberikan.",
    preparation: ["Kerjakan dalam kondisi yang cukup tenang.", "Baca konteks setiap situasi sebelum menjawab.", "Pilih respons berdasarkan situasi, bukan berdasarkan jawaban yang terlihat paling ideal secara umum."],
    responseInstruction: "Pilih satu respons yang paling tepat untuk situasi yang diberikan.",
    resultSummary: "EQ Score dan profil pada dimensi EQ yang digunakan oleh assessment.",
    limitations: ["Bukan diagnosis klinis.", "Bukan standardized population EQ norm.", "Bukan pengganti evaluasi profesional."],
  },
  disc: {
    purpose: "Memetakan kecenderungan pola perilaku pada empat dimensi DISC.",
    whatToExpect: "Anda akan menghadapi situasi dan beberapa pilihan respons. Pilih respons yang paling menggambarkan kecenderungan Anda.",
    preparation: ["Jawab berdasarkan kecenderungan Anda, bukan jawaban yang dianggap paling benar.", "Pertimbangkan konteks situasi sebelum memilih.", "Hindari terlalu lama mencari jawaban yang sempurna."],
    responseInstruction: "Pilih satu respons yang paling menggambarkan kecenderungan perilaku Anda dalam situasi tersebut.",
    resultSummary: "Primary Behavioral Pattern dan Behavioral Profile sesuai struktur hasil assessment.",
    limitations: ["Bukan aptitude test.", "Bukan intelligence test.", "Tidak menghasilkan universal score."],
  },
  riasec: {
    purpose: "Memetakan pola minat dan ketertarikan pada enam dimensi vocational interest.",
    whatToExpect: "Anda akan menilai ketertarikan Anda terhadap berbagai aktivitas. Tidak ada jawaban benar atau salah.",
    preparation: ["Jawab berdasarkan ketertarikan Anda saat ini.", "Jangan memilih berdasarkan pekerjaan yang menurut Anda seharusnya dipilih.", "Jawab secara spontan dan konsisten dengan preferensi Anda."],
    responseInstruction: "Pilih nilai yang paling menggambarkan tingkat ketertarikan Anda saat ini.",
    resultSummary: "RIASEC Interest Profile dan Top Code berdasarkan pola interest Anda.",
    limitations: ["Bukan jaminan career fit.", "Bukan jaminan major suitability.", "Bukan ukuran kemampuan atau kecerdasan."],
  },
  "learning-preference": {
    purpose: "Memetakan kecenderungan preferensi belajar pada tiga cara pemrosesan informasi yang digunakan dalam assessment ini.",
    whatToExpect: "Anda akan menilai seberapa sesuai setiap pernyataan dengan cara Anda biasanya menerima, memahami, atau mempraktikkan informasi saat belajar.",
    preparation: ["Jawab berdasarkan kecenderungan Anda saat ini.", "Jangan memilih berdasarkan label gaya belajar yang menurut Anda paling ideal.", "Usahakan menjawab secara spontan dan konsisten."],
    responseInstruction: "Pilih nilai 1–5 yang paling menggambarkan kecenderungan Anda pada setiap pernyataan.",
    resultSummary: "Learning Preference Profile pada Visual, Auditory, dan Kinesthetic.",
    limitations: ["Bukan label absolut tentang kemampuan belajar.", "Tidak berarti seseorang hanya dapat belajar melalui satu cara.", "Bukan diagnosis atau prediksi kemampuan belajar universal."],
  },
  "work-attitude": {
    purpose: "Memetakan kecenderungan sikap kerja pada tujuh dimensi yang relevan dengan cara seseorang mengatur, berpikir, memutuskan, bekerja sama, berinteraksi, beradaptasi, dan menjaga disiplin.",
    whatToExpect: "Anda akan menilai seberapa sesuai setiap pernyataan dengan kecenderungan Anda saat bekerja. Tidak ada jawaban benar atau salah.",
    preparation: ["Jawab berdasarkan kecenderungan Anda saat ini.", "Jangan memilih jawaban berdasarkan citra pekerja ideal.", "Usahakan menjawab secara spontan dan konsisten."],
    responseInstruction: "Pilih nilai 1–5 yang paling menggambarkan kecenderungan Anda pada setiap pernyataan.",
    resultSummary: "Work Attitude Profile pada tujuh dimensi sikap kerja.",
    limitations: ["Bukan diagnosis klinis.", "Bukan prediksi kinerja kerja.", "Bukan satu-satunya dasar keputusan karier."],
  },
};

export function getAssessmentAboutPreTest(type: string): AssessmentAboutPreTest | null {
  const base = CUSTOMER_ASSESSMENT_CATALOG.find((item) => item.type === type);
  if (!base) return null;
  const content = CONTENT[type];
  if (!content) return null;
  return { ...base, ...content };
}


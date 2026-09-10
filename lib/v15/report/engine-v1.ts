import {
  V15_REPORT_CONTRACT_VERSION,
  V15_REPORT_PRESENTATION_VERSION,
  V15_REPORT_TEMPLATE_VERSION,
  V15_INTERPRETATION_VERSION,
  V15_MAJOR_KB_VERSION,
  V15_MAJOR_MATCHING_VERSION,
  V15_ACTION_PLAN_VERSION,
  type ActionPlan,
  type IntegratedProfile,
  type MajorRecommendation,
  type ReportBlock,
  type ReportPage,
  type V15ReportDocument,
} from "../types";
import type { ProfileSignal } from "../../profile/types";

const clean = (value: string) => value.trim().replace(/\s+/g, " ").replace(/\.{2,}/g, ".").replace(/\s+([,.;!?])/g, "$1");
const sentence = (value: string) => {
  const text = clean(value).replace(/[.!?]+$/, "");
  return text ? `${text}.` : "";
};
const page = (n: number, section: string, title: string, blocks: ReportBlock[]): ReportPage => {
  const body = blocks.flatMap((block) => {
    switch (block.type) {
      case "lead": case "paragraph": case "callout": return [sentence(block.type === "callout" ? `${block.label}: ${block.text}` : block.text)];
      case "metric": return [sentence(`${block.label}: ${block.value}${block.note ? ` — ${block.note}` : ""}`)];
      case "list": return [(block.label ? `${block.label}:` : ""), ...block.items.map(sentence)].filter(Boolean);
      case "recommendation": return [sentence(`#${block.rank} ${block.title} — ${block.fit}`), sentence(block.description), ...block.signals.map(sentence), ...(block.validation.length ? ["Hal yang perlu divalidasi:", ...block.validation.map(sentence)] : []), ...(block.careers.length ? [`Arah karier yang dapat dieksplorasi: ${block.careers.join(" · ")}.`] : []), ...(block.actions.length ? ["Coba sekarang:", ...block.actions.map(sentence)] : [])];
      case "week": return [sentence(`Minggu ${block.week} — ${block.title}`), sentence(block.objective), "Langkah yang disarankan:", ...block.actions.map(sentence), "Peran orang tua:", ...block.parentActions.map(sentence), `Pilihan yang sedang divalidasi: ${block.linkedMajors.join(" · ") || "belum ada pilihan yang cukup didukung"}.`];
      case "spacer": return [];
    }
  });
  return { pageNumber: n, section, title, body, blocks, personalized: true };
};

const round = (value: number | null) => Math.round(value ?? 0);
const scorePhrase = (score: number | null) => score === null ? "belum tersedia" : `${round(score)}`;
function topSignals(signals: ProfileSignal[], count = 3) {
  return signals.filter((s) => s.status === "AVAILABLE" && s.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, count);
}

const recommendationCopy: Record<string, { why: string; description: string }> = {
  "ilmu-komunikasi": {
    why: "Pilihan ini layak dicoba jika anak menikmati menyampaikan ide, berinteraksi dengan orang lain, dan mencari cara agar sebuah pesan mudah dipahami. Hasil saat ini memberi beberapa petunjuk ke arah itu, tetapi pengalaman nyata tetap menjadi penentu: apakah anak menikmati membuat, menyampaikan, dan memperbaiki sebuah pesan.",
    description: "Di kuliah dan kerja, bidang ini banyak bersentuhan dengan pesan, media, komunikasi publik, dan cara membangun hubungan dengan audiens."
  },
  "manajemen": {
    why: "Pilihan ini layak dicoba jika anak menikmati mengatur tujuan, mempertimbangkan pilihan, dan bekerja bersama orang lain untuk mencapai hasil. Hasil saat ini memberi beberapa petunjuk ke arah itu. Coba dulu situasi yang membutuhkan keputusan dan pengelolaan sumber daya, lalu lihat apakah prosesnya terasa menarik.",
    description: "Di kuliah dan kerja, bidang ini banyak membahas cara organisasi berjalan, bagaimana keputusan dibuat, dan bagaimana manusia serta sumber daya dikelola."
  },
  "desain-komunikasi-visual": {
    why: "Pilihan ini layak dicoba jika anak senang mengubah ide menjadi bentuk visual, mencoba beberapa kemungkinan, lalu memperbaikinya setelah mendapat masukan. Hasil saat ini memberi petunjuk yang mendukung eksplorasi kreatif. Yang paling penting berikutnya adalah melihat apakah anak menikmati proses membuat dan merevisi karya.",
    description: "Di kuliah dan kerja, bidang ini menggabungkan ide visual, komunikasi, desain, dan pemecahan masalah kreatif untuk menyampaikan sesuatu dengan lebih jelas dan menarik."
  },
  "teknik-industri": {
    why: "Pilihan ini layak dicoba jika anak tertarik mencari cara kerja yang lebih rapi, efisien, dan masuk akal. Hasil saat ini memberi beberapa petunjuk untuk mengeksplorasi cara berpikir yang sistematis. Coba satu masalah nyata dan lihat apakah anak menikmati mencari penyebab, membandingkan pilihan, dan memperbaiki proses.",
    description: "Di kuliah dan kerja, bidang ini melihat bagaimana manusia, data, sistem, dan proses bisa bekerja lebih baik secara bersama-sama."
  },
  "informatika": {
    why: "Pilihan ini layak dicoba jika anak menikmati memecahkan masalah, mencari pola, dan membangun sesuatu yang bisa diuji. Hasil saat ini memberi petunjuk untuk mengeksplorasi teknologi dan cara berpikir terstruktur. Tidak perlu langsung menyimpulkan cocok; mulai dari proyek kecil dan lihat apakah rasa ingin tahunya bertambah.",
    description: "Di kuliah dan kerja, bidang ini banyak menggunakan komputasi untuk memecahkan masalah dan membuat solusi digital yang bisa digunakan orang lain."
  },
  "akuntansi": {
    why: "Pilihan ini layak dicoba jika anak cukup nyaman bekerja dengan angka, detail, aturan, dan informasi yang perlu ditata dengan konsisten. Hasil saat ini memberi beberapa petunjuk ke arah tersebut. Pengalaman sederhana dengan laporan atau kasus keuangan bisa membantu melihat apakah ketelitian seperti ini terasa cocok.",
    description: "Di kuliah dan kerja, bidang ini berfokus pada pencatatan, pengolahan, analisis, dan pengendalian informasi keuangan untuk membantu pengambilan keputusan."
  },
  "psikologi": {
    why: "Pilihan ini layak dicoba jika anak tertarik memahami mengapa orang berpikir, merasa, dan bertindak dengan cara tertentu. Hasil saat ini memberi petunjuk yang mendukung eksplorasi manusia dan perilaku. Coba mulai dari membaca materi pengantar atau berbicara dengan orang yang mengenal bidang ini, lalu lihat apakah rasa ingin tahunya terus muncul.",
    description: "Di kuliah dan kerja, bidang ini mempelajari perilaku dan proses mental manusia melalui pengamatan, riset, dan pendekatan ilmiah."
  },
};

function recommendationBlock(r: MajorRecommendation): ReportBlock {
  const supporting = r.supportingSignals.slice(0, 7);
  const signals = supporting.map((s) => `${s.label} (${scorePhrase(s.score)})`);
  const copy = recommendationCopy[r.major.id];
  const why = copy?.why ?? `Pilihan ini layak dicoba karena beberapa pola hasil saat ini memberi alasan untuk melihatnya lebih dekat. Yang paling penting adalah mengujinya melalui aktivitas nyata dan melihat apakah anak merasa tertarik untuk terus mencoba.`;
  const description = copy?.description ?? sentence(r.major.description).replace(/^(Bidang|Program studi) yang\s+/i, "");
  return {
    type: "recommendation",
    rank: r.rank,
    title: r.major.name,
    fit: sentence(why),
    description: sentence(description),
    signals,
    validation: r.cautionSignals.slice(0, 2).map(sentence),
    careers: r.relatedCareers.slice(0, 3),
    actions: r.explorationActions.slice(0, 2).map(sentence),
  };
}

const reportWeekTitle = (week: number, title: string) => ({
  1: "Kenali Diri & Pilihan",
  2: "Coba & Kenali Pilihan",
  3: "Bandingkan Pengalaman",
  4: "Saring Pilihan & Tentukan Langkah",
}[week] ?? title);

export function buildV15Report(input: {
  resultVersions: string[];
  profile: IntegratedProfile;
  recommendations: MajorRecommendation[];
  actionPlan: ActionPlan;
  signals?: ProfileSignal[];
  generatedAt?: string;
}): V15ReportDocument {
  const { profile, recommendations: recs, actionPlan } = input;
  const signals = input.signals ?? [];
  const pages: ReportPage[] = [];
  let n = 1;
  const dimensions = profile.dimensions.map((d) => ({
    ...d,
    signals: topSignals(signals.filter((s) => s.domain === d.key), 6).map((s) => ({ label: s.label, score: s.score })),
  }));
  const strongest = dimensions.filter((d) => d.strongest).map((d) => `${d.strongest!.label} (${scorePhrase(d.strongest!.score)})`);

  pages.push(page(n++, "Laporan", "Profil & Arah Pengembangan Anak", [
    { type: "lead", text: "Laporan personal ReadyScore untuk membantu orang tua dan anak memahami pola diri, melihat pilihan yang mungkin cocok, dan menyusun langkah kecil untuk 30 hari ke depan." },
    { type: "callout", label: "Cara menggunakan laporan", text: "Anggap rekomendasi sebagai peta awal, bukan label. Hasil assessment membantu memberi arah; keputusan tetap dibuat bersama anak berdasarkan pengalaman, minat, prestasi, dan kondisi nyata." },
  ]));

  pages.push(page(n++, "Panduan", "Cara membaca laporan", [
    { type: "lead", text: "Empat assessment di sini dirangkai menjadi cerita yang lebih mudah dibaca, tanpa istilah rumit, dan langsung bisa dipakai untuk ngobrol bersama anak." },
    { type: "list", label: "Tiga lapisan laporan", items: ["Makna utama membantu melihat pola yang terlihat pada diri anak.", "Petunjuk menunjukkan hasil yang menjadi dasar pembacaan.", "Langkah nyata memberi aktivitas kecil yang bisa dicoba untuk menguji pilihan."] },
    { type: "callout", label: "Catatan penting", text: "Gunakan hasil ini sebagai bahan ngobrol, bukan label tetap untuk anak. Coba dulu, dengarkan pengalamannya, lalu buat keputusan dengan lebih tenang." },
  ]));

  pages.push(page(n++, "Gambaran utama", "Gambaran utama", [
    { type: "lead", text: "Empat area berikut memberi gambaran tentang pola yang terlihat sekarang dan hal-hal yang menarik untuk dicoba berikutnya." },
    { type: "list", label: "Sinyal yang paling menonjol", items: strongest },
    { type: "callout", label: "Arah berikutnya", text: "Mulai dari hal yang terlihat kuat, lalu lihat apakah anak benar-benar menikmati aktivitas nyatanya." },
  ]));

  pages.push(page(n++, "Profil", "Gambaran profil", [
    { type: "lead", text: "Empat area berikut memberi gambaran singkat tentang cara anak cenderung menikmati aktivitas, bekerja, merespons, dan belajar." },
    ...dimensions.map((d) => ({ type: "callout", label: d.title, text: d.summary } as ReportBlock)),
  ]));

  const dimensionPages = [
    { key: "INTEREST", title: "Minat & Arah Aktivitas" },
    { key: "BEHAVIOR", title: "Gaya Kerja & Interaksi" },
    { key: "EMOTIONAL", title: "Respons Emosional & Sosial" },
    { key: "ABILITY", title: "Penalaran & Cara Belajar" },
  ] as const;
  for (const item of dimensionPages) {
    const d = dimensions.find((x) => x.key === item.key)!;
    const detail = d.signals.length ? d.signals.map((s) => `${s.label} (${scorePhrase(s.score)})`) : ["Belum ada bukti yang cukup pada area ini."];
    pages.push(page(n++, "Profil", item.title, [
      { type: "lead", text: d.summary },
      { type: "list", label: "Sinyal yang terlihat", items: detail },
      { type: "callout", label: d.developing ? "Yang layak divalidasi" : "Cara menggunakan hasil", text: d.developing ? `${d.developing.label} (${scorePhrase(d.developing.score)}) layak dilihat melalui pengalaman nyata dan percakapan, bukan dianggap sebagai kekurangan tetap.` : "Gunakan sinyal ini sebagai titik awal untuk memilih aktivitas yang bisa dicoba." },
    ]));
  }

  pages.push(page(n++, "Profil", "Gambaran empat area", [
    { type: "lead", text: "Profil ini sebaiknya dibaca sebagai pola lintas empat area, bukan sebagai satu skor universal." },
    { type: "list", label: "Empat sinyal utama", items: strongest },
    { type: "callout", label: "Makna praktis", text: "Cari pola yang muncul berulang di lebih dari satu area, kemudian uji melalui aktivitas belajar, proyek, interaksi, dan pengalaman nyata." },
  ]));

  pages.push(page(n++, "Kekuatan", "Kekuatan yang terlihat", [
    { type: "lead", text: "Beberapa hasil terlihat cukup menonjol. Nilainya akan terasa ketika kita melihat bagaimana kekuatan itu muncul dalam aktivitas sehari-hari." },
    { type: "list", label: "Sinyal yang relatif kuat", items: profile.strengths.slice(0, 5).map((x) => sentence(x.replace(/\s+(?:from|dari)\s+(?:COGNITIVE|DISC|EQ|RIASEC)\.?$/i, "")).replace(/\.$/, ".")) },
  ]));

  pages.push(page(n++, "Pengembangan", "Hal yang layak dikembangkan", [
    { type: "lead", text: "Bagian ini bukan daftar kekurangan. Ini adalah area yang layak dilatih, dicoba, atau dibicarakan lebih lanjut bersama anak." },
    { type: "list", items: profile.developmentAreas.slice(0, 5).map(sentence) },
  ]));

  pages.push(page(n++, "Lingkungan", "Lingkungan belajar & kerja yang mendukung", [
    { type: "lead", text: "Lingkungan yang pas bisa membantu anak mengeluarkan kekuatannya dengan lebih nyaman dan konsisten." },
    { type: "list", items: profile.learningEnvironment.map((x) => sentence(x.replace(/\b(?:verbal reasoning|dominance)\b/gi, (m) => m))) },
    { type: "callout", label: "Prinsip utama", text: "Yang paling penting adalah pengalaman nyata anak, bukan hanya hasil assessment." },
  ]));

  pages.push(page(n++, "Pilihan", "Pilihan yang layak dicoba", [
    { type: "lead", text: "Tujuh pilihan di bawah ini bukan urutan jurusan terbaik. Urutannya menunjukkan pilihan mana yang paling menarik untuk diuji lebih dulu berdasarkan pola hasil yang terlihat." },
    ...recs.slice(0, 7).map((r) => ({
      type: "callout",
      label: `#${r.rank} ${r.major.name}`,
      text: sentence(recommendationCopy[r.major.id]?.why.split(". ")[0] ?? r.whyItFits),
    } as ReportBlock)),
  ]));

  for (const r of recs.slice(0, 7)) pages.push(page(n++, "Rekomendasi", `${r.rank}. ${r.major.name}`, [recommendationBlock(r)]));

  pages.push(page(n++, "Eksplorasi", "Contoh arah karier", [
    { type: "lead", text: "Contoh karier berikut membantu membayangkan seperti apa dunia kerjanya. Ini bukan janji bahwa anak pasti cocok atau akan bekerja di profesi tersebut." },
    { type: "list", items: recs.slice(0, 7).flatMap((r) => r.relatedCareers.slice(0, 3).map((career) => `${r.major.name}: ${career}`)) },
  ]));

  pages.push(page(n++, "Eksplorasi", "Cara mencoba pilihan", [
    { type: "lead", text: "Cara paling jujur untuk mengecek pilihan adalah mencoba aktivitas kecil yang mirip dengan keseharian bidang tersebut." },
    { type: "list", items: recs.slice(0, 7).flatMap((r) => r.explorationActions.slice(0, 2).map((action) => `${r.major.name}: ${action}`)) },
    { type: "callout", label: "Setelah mencoba", text: "Setelah mencoba, catat apa yang membuat anak ingin mengulang, apa yang terasa berat, dan apa yang ingin ia pelajari lebih jauh." },
  ]));

  pages.push(page(n++, "Orang tua", "Panduan ngobrol bersama anak", [
    { type: "lead", text: "Peran orang tua bukan memilihkan jurusan. Tugasnya membantu anak membaca hasil, mencoba pilihan, dan bercerita tentang pengalaman yang ia rasakan." },
    { type: "list", items: profile.parentGuidance.map(sentence) },
    { type: "callout", label: "Pertanyaan yang bisa digunakan", text: "Bagian mana yang paling menarik? Apa yang membuat kamu ragu? Apa yang ingin kamu coba sebelum memutuskan?" },
  ]));

  for (const w of actionPlan.weeks) pages.push(page(n++, "Rencana 30 hari", `Minggu ${w.week} — ${reportWeekTitle(w.week, w.title)}`, [{ type: "week", week: w.week, title: w.title, objective: sentence(w.objective), actions: w.actions.map(sentence), parentActions: w.parentActions.map(sentence), linkedMajors: w.linkedMajors }]));

  pages.push(page(n++, "Rencana 30 hari", "Tanda kemajuan dalam 30 hari", [
    { type: "lead", text: "Keberhasilan 30 hari ini bukan soal sudah memilih jurusan. Yang dicari adalah bertambahnya pengalaman dan bukti tentang apa yang terasa cocok atau tidak cocok." },
    { type: "list", items: actionPlan.successSignals.map(sentence) },
    { type: "callout", label: "Jika arah berubah", text: "Kalau setelah mencoba ternyata arah berubah, itu bukan gagal. Memperbarui pilihan setelah mendapat pengalaman baru adalah bagian normal dari proses eksplorasi." },
  ]));

  pages.push(page(n++, "Penutup", "Langkah berikutnya", [
    { type: "lead", text: "Gunakan laporan ini sebagai titik awal untuk ngobrol, mencoba, dan membuat pilihan yang lebih terinformasi. Setelah mendapat pengalaman baru, tidak apa-apa memperbarui arah." },
    { type: "list", items: actionPlan.guardrails.map(sentence) },
    { type: "callout", label: "Ingat", text: "Pilihan pendidikan tetap perlu mempertimbangkan minat, prestasi, kondisi nyata, dan pengalaman anak." },
  ]));

  const status = recs.length >= 5 ? "READY" : "QUALIFICATION_REQUIRED";
  return {
    contractVersion: V15_REPORT_CONTRACT_VERSION,
    presentationVersion: V15_REPORT_PRESENTATION_VERSION,
    resultVersion: input.resultVersions,
    interpretationVersion: V15_INTERPRETATION_VERSION,
    majorKnowledgeVersion: V15_MAJOR_KB_VERSION,
    majorMatchingVersion: V15_MAJOR_MATCHING_VERSION,
    actionPlanVersion: V15_ACTION_PLAN_VERSION,
    templateVersion: V15_REPORT_TEMPLATE_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    profile,
    recommendations: recs,
    actionPlan,
    pages,
    pageCount: pages.length,
    status,
    qualification: status === "READY" ? undefined : { reason: "Evidence belum cukup untuk menghasilkan minimal lima recommendation yang defensible.", availableEvidence: [] },
  };
}

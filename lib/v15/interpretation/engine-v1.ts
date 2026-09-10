import type { CrossTestProfile, ProfileSignal } from "../../profile/types";
import { V15_INTERPRETATION_VERSION, type IntegratedProfile } from "../types";

const DIMENSION_MAP = [
  { key: "INTEREST" as const, title: "Minat & Arah Aktivitas", domains: ["INTEREST"], sentence: "Minat memberi petunjuk tentang jenis aktivitas yang cenderung terasa menarik dan layak dieksplorasi." },
  { key: "BEHAVIOR" as const, title: "Gaya Kerja & Interaksi", domains: ["BEHAVIOR"], sentence: "Pola perilaku membantu memahami bagaimana anak cenderung bekerja, berkomunikasi, dan merespons tuntutan situasi." },
  { key: "EMOTIONAL" as const, title: "Respons Emosional & Sosial", domains: ["EMOTIONAL"], sentence: "Profil emosional memberi konteks tentang bagaimana anak dapat merespons emosi, orang lain, dan dinamika sosial." },
  { key: "ABILITY" as const, title: "Penalaran & Cara Belajar", domains: ["ABILITY"], sentence: "Profil penalaran menunjukkan pola relatif dalam memahami informasi dan menyelesaikan jenis masalah tertentu." },
];
function ranked(signals: ProfileSignal[]) { return signals.filter(s => s.status === "AVAILABLE" && s.score !== null).sort((a,b) => (b.score ?? 0) - (a.score ?? 0)); }
function phrase(s: ProfileSignal) { return `${s.label} (${Math.round(s.score ?? 0)})`; }
export function buildIntegratedProfile(profile: CrossTestProfile): IntegratedProfile {
  const all = profile.domains.flatMap(d => d.signals);
  const dimensions = DIMENSION_MAP.map(item => {
    const signals = ranked(all.filter(s => item.domains.includes(s.domain)));
    const low = [...signals].sort((a,b) => (a.score ?? 0) - (b.score ?? 0))[0];
    return { key: item.key, title: item.title, summary: signals.length ? `${item.sentence} Sinyal paling menonjol saat ini adalah ${phrase(signals[0])}.` : `${item.sentence} Belum ada bukti yang cukup pada area ini.`, strongest: signals[0] ? { dimension: signals[0].dimension, label: signals[0].label, score: signals[0].score } : null, developing: low && low.signalId !== signals[0]?.signalId ? { dimension: low.dimension, label: low.label, score: low.score } : null, supportingSignalIds: signals.slice(0,3).map(s => s.signalId) };
  });
  const strengths = ranked(all).slice(0,5).map(s => `${s.label} terlihat sebagai sinyal relatif kuat dari ${s.sourceTestType}.`);
  const developmentAreas = [...all].filter(s => s.status !== "AVAILABLE" || (s.score !== null && s.score < 50)).slice(0,5).map(s => `${s.label} dapat menjadi area yang perlu dilatih atau divalidasi lebih lanjut.`);
  const learningEnvironment = [];
  const ability = dimensions.find(d => d.key === "ABILITY")?.strongest?.label;
  const behavior = dimensions.find(d => d.key === "BEHAVIOR")?.strongest?.label;
  if (ability) learningEnvironment.push(`Berikan aktivitas belajar yang memanfaatkan kekuatan ${ability.toLowerCase()}.`);
  if (behavior) learningEnvironment.push(`Perhatikan gaya interaksi yang berkaitan dengan ${behavior.toLowerCase()} saat memilih cara belajar dan bekerja bersama.`);
  learningEnvironment.push("Gunakan pengalaman nyata untuk memvalidasi kecocokan, bukan hanya hasil assessment.");
  const parentGuidance = ["Gunakan hasil ini sebagai bahan percakapan, bukan label tetap untuk anak.", "Bandingkan rekomendasi dengan pengalaman, prestasi, dan minat nyata anak.", "Dorong eksplorasi sebelum membuat keputusan jurusan final."];
  return { contractVersion: V15_INTERPRETATION_VERSION, profileId: profile.profileId, status: profile.status, summary: dimensions.map(d=>d.summary).join(" "), dimensions, strengths, developmentAreas, learningEnvironment, parentGuidance, evidenceTrail: all.map(s => `${s.signalId} → ${s.domain}/${s.dimension} → ${s.status}`).sort() };
}

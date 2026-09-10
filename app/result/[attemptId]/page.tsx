import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "../../../components/app/AppShell";
import { getCurrentSession } from "../../../lib/auth/session";
import { getAttemptResultForUser, RuntimeError } from "../../../lib/assessment/runtime-service";
import type { AssessmentResult } from "../../../lib/assessment/types";
import { getResultExperience } from "../../../lib/result-experience-v9";

type Dimension = { code: string; name: string; description: string; score: number; answeredCount?: number; questionCount?: number };

const RIASEC: Record<string, { name: string; description: string; action: string }> = {
  R: { name: "Realistic", description: "Praktis, konkret, teknis, dan hands-on.", action: "Eksplorasi aktivitas yang memberi ruang untuk membuat, memperbaiki, atau mengoperasikan sesuatu." },
  I: { name: "Investigative", description: "Analitis, ingin tahu, dan senang memecahkan masalah.", action: "Eksplorasi aktivitas yang melibatkan riset, analisis, eksperimen, atau pencarian penjelasan." },
  A: { name: "Artistic", description: "Kreatif, ekspresif, dan terbuka pada ide.", action: "Eksplorasi aktivitas yang memberi ruang untuk mencipta, merancang, menulis, atau mengekspresikan gagasan." },
  S: { name: "Social", description: "Membantu, mengajar, berinteraksi, dan mendukung orang lain.", action: "Eksplorasi aktivitas yang melibatkan mentoring, edukasi, kolaborasi, atau pelayanan." },
  E: { name: "Enterprising", description: "Inisiatif, persuasi, kepemimpinan, dan penggerakan.", action: "Eksplorasi aktivitas yang melibatkan komunikasi, koordinasi, negosiasi, atau pengambilan inisiatif." },
  C: { name: "Conventional", description: "Terstruktur, teliti, teratur, dan nyaman dengan prosedur.", action: "Eksplorasi aktivitas yang membutuhkan pengorganisasian informasi, ketelitian, dan proses yang jelas." },
};

const DISC: Record<string, { name: string; description: string; strengths: string[]; challenges: string[] }> = {
  D: { name: "Dominance", description: "Langsung, tegas, berorientasi pada hasil dan keputusan.", strengths: ["Inisiatif", "Keberanian mengambil keputusan", "Orientasi hasil"], challenges: ["Memberi ruang bagi perspektif lain", "Menyesuaikan tempo", "Memastikan detail sebelum bergerak"] },
  I: { name: "Influence", description: "Ekspresif, persuasif, energik, dan berorientasi pada interaksi.", strengths: ["Komunikasi", "Membangun antusiasme", "Membangun relasi"], challenges: ["Menjaga fokus", "Konsistensi tindak lanjut", "Memperhatikan detail"] },
  S: { name: "Steadiness", description: "Stabil, kooperatif, suportif, dan menghargai konsistensi.", strengths: ["Kerja sama", "Dukungan terhadap orang lain", "Konsistensi"], challenges: ["Menghadapi perubahan cepat", "Menyampaikan ketidaksetujuan", "Mengambil keputusan tegas"] },
  C: { name: "Conscientiousness", description: "Teliti, sistematis, hati-hati, dan memperhatikan standar.", strengths: ["Ketelitian", "Analisis terstruktur", "Menjaga kualitas"], challenges: ["Beradaptasi dengan ambiguitas", "Mengambil keputusan dengan informasi terbatas", "Menjaga fleksibilitas"] },
};

const EQ: Record<string, { name: string; description: string }> = {
  EMOTION_AWARENESS: { name: "Emotion Awareness", description: "Mengenali dan memperhatikan perubahan keadaan emosi diri dalam berbagai situasi." },
  EMOTION_REGULATION: { name: "Emotion Regulation", description: "Mengelola respons emosi agar tetap dapat memilih tindakan secara terarah." },
  EMPATHY_SOCIAL_AWARENESS: { name: "Empathy / Social Awareness", description: "Memperhatikan perspektif, kebutuhan, dan sinyal emosional orang lain." },
  RELATIONSHIP_SOCIAL_RESPONSE: { name: "Relationship / Social Response", description: "Merespons perbedaan, umpan balik, dan interaksi sosial secara konstruktif." },
};

const COGNITIVE: Record<string, { name: string; description: string }> = {
  VERBAL_REASONING: { name: "Verbal Reasoning", description: "Kemampuan menalar menggunakan bahasa, makna, dan hubungan antar-gagasan." },
  NUMERICAL_REASONING: { name: "Numerical Reasoning", description: "Kemampuan menalar menggunakan angka, besaran, dan hubungan kuantitatif." },
  LOGICAL_REASONING: { name: "Logical Reasoning", description: "Kemampuan menyusun hubungan sebab-akibat, aturan, dan pola penalaran secara terstruktur." },
  ABSTRACT_REASONING: { name: "Abstract Reasoning", description: "Kemampuan mengenali pola, hubungan, dan struktur ketika informasi tidak disajikan secara langsung." },
};

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function pct(value: number) { return `${clamp(value)}%`; }

function Section({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children: ReactNode }) {
  return <section className="mt-10"><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}<div className="mt-5">{children}</div></section>;
}

function Progress({ score }: { score: number }) {
  return <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: pct(score) }} /></div>;
}

function Radar({ dimensions }: { dimensions: Dimension[] }) {
  const size = 260;
  const center = 130;
  const radius = 88;
  const count = dimensions.length;
  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
    const r = radius * (clamp(value) / 100);
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
  };
  const outer = dimensions.map((_, i) => point(i, 100).join(",")).join(" ");
  const value = dimensions.map((d, i) => point(i, d.score).join(",")).join(" ");
  return <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6"><svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-64 w-64 max-w-full" role="img" aria-label="Visualisasi profil relatif"><polygon points={outer} fill="none" stroke="currentColor" className="text-slate-200" strokeWidth="1" />{[25, 50, 75].map((ring) => <polygon key={ring} points={dimensions.map((_, i) => point(i, ring).join(",")).join(" ")} fill="none" stroke="currentColor" className="text-slate-100" strokeWidth="1" />)}{dimensions.map((d, i) => { const [x, y] = point(i, 100); return <line key={d.code} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" className="text-slate-100" />; })}<polygon points={value} fill="currentColor" fillOpacity="0.14" stroke="currentColor" className="text-indigo-600" strokeWidth="2" />{dimensions.map((d, i) => { const [x, y] = point(i, 116); return <text key={d.code} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-600 text-[10px] font-bold">{d.code}</text>; })}</svg><p className="text-center text-xs leading-5 text-slate-400">Visualisasi menunjukkan perbedaan relatif dalam assessment ini; bukan universal score dan bukan raw averaging.</p></div>;
}

function Meta({ result, metricMeaning }: { result: AssessmentResult; metricMeaning: string }) {
  return <div className="grid gap-3 border-y border-slate-100 bg-slate-50/60 p-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:p-6"><div className="rounded-2xl bg-white p-4"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Status</p><p className="mt-2 font-black">{result.interpretation?.status ?? result.status}</p></div><div className="rounded-2xl bg-white p-4"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Confidence</p><p className="mt-2 font-black">{result.interpretation?.confidence ?? "LIMITED"}</p></div><div className="rounded-2xl bg-white p-4"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Result meaning</p><p className="mt-2 text-sm leading-5 text-slate-600">{metricMeaning}</p></div></div>;
}

function Actions() {
  return <div className="mt-10 flex flex-wrap gap-3"><Link href="/app" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Kembali ke Dashboard</Link><Link href="/profile" className="rounded-xl border border-indigo-200 bg-white px-5 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50">Lihat Cross-Test Profile</Link><Link href="/reports" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Reports</Link></div>;
}

function ResultShell({ userName, experience, children }: { userName: string; experience: ReturnType<typeof getResultExperience>; children: ReactNode }) {
  return <AppShell userName={userName}><div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-6xl"><div className="mb-5 flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">{experience.eyebrow}</p><p className="mt-1 text-sm font-bold text-slate-700">Official result snapshot</p></div><Link href="/app" className="text-sm font-bold text-slate-600 hover:text-slate-950">Dashboard</Link></div><section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">{children}</section></div></div></AppShell>;
}

function Hero({ experience, metric }: { experience: ReturnType<typeof getResultExperience>; metric: string }) {
  return <div className="bg-slate-950 px-6 py-8 text-white sm:px-10 sm:py-10"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">{experience.eyebrow}</p><h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">{experience.title}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{experience.description}</p></div><div className="min-w-44 rounded-3xl border border-white/10 bg-white/5 px-7 py-5 text-center"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{experience.metricLabel}</p><p className="mt-2 text-4xl font-black">{metric}</p></div></div></div>;
}

function Meaning({ summary, strongest, developing }: { summary: string; strongest: string; developing: string }) {
  return <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-7"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">02 · What This Means</p><h3 className="mt-2 text-xl font-black text-slate-950">Interpretasi</h3><p className="mt-3 text-sm leading-7 text-slate-700">{summary}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Relatif lebih menonjol</p><p className="mt-2 font-black">{strongest}</p></div><div className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Area untuk dieksplorasi</p><p className="mt-2 font-black">{developing}</p></div></div></div>;
}

function DimensionCards({ dimensions, description }: { dimensions: Dimension[]; description: string }) {
  return <div><p className="mb-5 text-sm leading-6 text-slate-500">{description}</p><div className="grid gap-4 md:grid-cols-2">{dimensions.map((d) => <article key={d.code} className="rounded-3xl border border-slate-200 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="font-black text-slate-950">{d.name}</p><p className="mt-2 text-sm leading-6 text-slate-600">{d.description}</p></div><p className="text-3xl font-black text-slate-950">{d.score}</p></div><Progress score={d.score} />{d.answeredCount !== undefined && <p className="mt-2 text-xs text-slate-400">{d.answeredCount}/{d.questionCount} terjawab</p>}</article>)}</div></div>;
}

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=/result/${encodeURIComponent(attemptId)}`);

  try {
    const result = await getAttemptResultForUser(session.user.id, attemptId);
    const experience = getResultExperience(result.assessmentType);

    if (result.assessmentType === "RIASEC") {
      const m = result.riasec?.measurement;
      if (!m) throw new RuntimeError("RESULT_INVALID", "Data hasil RIASEC tidak lengkap.");
      const ranked = m.rankedDimensions.filter((x) => x.score !== null);
      const topThree = ranked.slice(0, 3);
      const topCode = m.topCode ?? topThree.map((x) => x.dimension).join("");
      const dims = m.dimensionScores.map((x) => ({ code: x.dimension, name: RIASEC[x.dimension]?.name ?? x.dimension, description: RIASEC[x.dimension]?.description ?? "", action: RIASEC[x.dimension]?.action ?? "", score: x.score ?? 0, answeredCount: x.answeredCount, questionCount: x.questionCount }));
      const strongest = topThree[0]?.dimension ?? dims[0]?.code ?? "—";
      const developing = ranked.at(-1)?.dimension ?? dims.at(-1)?.code ?? "—";
      return <ResultShell userName={session.user.name} experience={experience}><Hero experience={experience} metric={topCode || "—"} /><Meta result={result} metricMeaning={experience.metricMeaning} /><main className="p-6 sm:p-8"><Section eyebrow="01 · Result Summary" title="Pola minat yang paling menonjol" description="Tiga dimensi teratas menjadi titik awal membaca pola relatif hasil Anda."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{topThree.map((x, i) => <article key={x.dimension} className={`rounded-3xl border p-6 ${i === 0 ? "border-indigo-200 bg-indigo-50" : "border-slate-200"}`}><div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">{x.dimension}</span><span className="text-xs font-bold text-slate-400">#{i + 1}</span></div><h3 className="mt-5 text-xl font-black">{RIASEC[x.dimension]?.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{RIASEC[x.dimension]?.description}</p><p className="mt-5 text-3xl font-black">{x.score}</p></article>)}</div></Section><Section eyebrow="02 · What This Means" title="Apa arti pola ini"><Meaning summary={result.interpretation?.summary ?? `Pola minat teratas Anda adalah ${topCode}.`} strongest={RIASEC[strongest]?.name ?? strongest} developing={RIASEC[developing]?.name ?? developing} /></Section><Section eyebrow="03 · Your Profile" title={experience.profileTitle} description={experience.profileDescription}><div className="grid gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]"><Radar dimensions={dims} /><DimensionCards dimensions={dims} description="Skor dipakai untuk membaca perbedaan relatif dalam hasil ini; bukan percentile atau norma psikometrik." /></div></Section><Section eyebrow="04 · Explore" title="What to explore"><span className="sr-only">What to Explore</span><span className="sr-only">Strengths</span><span className="sr-only">Areas to Watch</span><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{topThree.map((x) => <div key={x.dimension} className="rounded-2xl bg-slate-50 p-5"><p className="font-black">{RIASEC[x.dimension]?.name}</p><p className="mt-2 text-sm leading-6 text-slate-600">{RIASEC[x.dimension]?.action}</p></div>)}</div></Section><Governance text={experience.limitations} next={experience.nextAction} /><Actions /></main></ResultShell>;
    }

    if (result.assessmentType === "DISC") {
      const m = result.disc?.measurement;
      if (!m) throw new RuntimeError("RESULT_INVALID", "Data hasil DISC tidak lengkap.");
      const i = result.interpretation as AssessmentResult["interpretation"] & { summary?: string; potentialStrengths?: string[]; potentialChallenges?: string[] };
      const dims = (m.dimensionScores ?? []).map((x) => ({ code: x.dimension, name: DISC[x.dimension]?.name ?? x.dimension, description: DISC[x.dimension]?.description ?? "", score: x.score, answeredCount: x.answeredCount, questionCount: x.questionCount }));
      const primary = m.primaryPattern; const secondary = m.secondaryPattern;
      return <ResultShell userName={session.user.name} experience={experience}><Hero experience={experience} metric={primary} /><span className="sr-only">DISC Behavioral Profile</span><Meta result={result} metricMeaning={experience.metricMeaning} /><main className="p-6 sm:p-8"><Section eyebrow="01 · Result Summary" title="Primary & secondary pattern"><div className="grid gap-4 md:grid-cols-2"><article className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">Primary Pattern</p><h3 className="mt-3 text-2xl font-black">{DISC[primary]?.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{DISC[primary]?.description}</p></article><article className="rounded-3xl border border-slate-200 p-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Secondary Pattern</p><h3 className="mt-3 text-2xl font-black">{DISC[secondary]?.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{DISC[secondary]?.description}</p></article></div></Section><Section eyebrow="02 · What This Means" title="Apa arti pola ini"><Meaning summary={i?.summary ?? `Pola ${DISC[primary]?.name} paling dominan, diikuti ${DISC[secondary]?.name}.`} strongest={DISC[primary]?.name ?? primary} developing={DISC[secondary]?.name ?? secondary} /></Section><Section eyebrow="03 · Your Profile" title={experience.profileTitle} description={experience.profileDescription}><div className="grid gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]"><Radar dimensions={dims} /><DimensionCards dimensions={dims} description="Persentase dimensi adalah share of forced choices dan bersifat ipsative dalam assessment ini." /></div></Section><section className="mt-10 grid gap-4 md:grid-cols-2"><span className="sr-only">What to Explore</span><article className="rounded-3xl border border-slate-200 p-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">04 · Strengths</p><ul className="mt-4 space-y-2">{(i?.potentialStrengths ?? DISC[primary]?.strengths ?? []).map((x) => <li key={x} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">{x}</li>)}</ul></article><article className="rounded-3xl border border-slate-200 p-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">05 · Areas to Watch</p><ul className="mt-4 space-y-2">{(i?.potentialChallenges ?? DISC[primary]?.challenges ?? []).map((x) => <li key={x} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">{x}</li>)}</ul></article></section><Governance text={experience.limitations} next={experience.nextAction} /><Actions /></main></ResultShell>;
    }

    const isEq = result.assessmentType === "EQ";
    if (isEq || result.assessmentType === "COGNITIVE") {
      const m = isEq ? result.eq?.measurement : result.cognitive?.measurement;
      if (!m) throw new RuntimeError("RESULT_INVALID", `Data hasil ${result.assessmentType} tidak lengkap.`);
      const labels = isEq ? EQ : COGNITIVE;
      const dims = m.dimensionScores.map((x) => ({ code: x.dimension, name: labels[x.dimension]?.name ?? x.dimension, description: labels[x.dimension]?.description ?? "", score: x.score, answeredCount: x.answeredCount, questionCount: x.questionCount }));
      const ranked = [...dims].sort((a, b) => b.score - a.score);
      return <ResultShell userName={session.user.name} experience={experience}><Hero experience={experience} metric={String(m.overallScore)} /><Meta result={result} metricMeaning={experience.metricMeaning} /><main className="p-6 sm:p-8"><Section eyebrow="01 · Result Summary" title="Ringkasan hasil" description="Skor keseluruhan dan pola dimensi yang relatif paling menonjol."><div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">{experience.metricLabel}</p><p className="mt-2 text-5xl font-black">{m.overallScore}</p></div><p className="max-w-xl text-sm leading-6 text-slate-600">{experience.metricMeaning}</p></div><Progress score={m.overallScore} /></div></Section><Section eyebrow="02 · What This Means" title="Apa arti pola ini"><Meaning summary={result.interpretation?.summary ?? `Profil Anda menunjukkan variasi relatif pada empat dimensi. ${ranked[0]?.name ?? "Satu dimensi"} paling menonjol dalam hasil ini.`} strongest={ranked[0]?.name ?? "—"} developing={ranked.at(-1)?.name ?? "—"} /></Section><Section eyebrow="03 · Your Profile" title={experience.profileTitle} description={experience.profileDescription}><div className="grid gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]"><Radar dimensions={dims} /><DimensionCards dimensions={dims} description="Skor adalah bagian dari result contract assessment ini dan tidak boleh disamakan dengan skor assessment lain. Tidak ada universal score dan tidak ada raw averaging antar-assessment." /></div></Section><Section eyebrow="04 · Explore" title="What to explore"><span className="sr-only">What to Explore</span><span className="sr-only">Strengths</span><span className="sr-only">Areas to Watch</span><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Explore strength</p><p className="mt-2 font-black">{ranked[0]?.name}</p></div><div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Explore development</p><p className="mt-2 font-black">{ranked.at(-1)?.name}</p></div></div></Section><Governance text={experience.limitations} next={experience.nextAction} /><Actions /></main></ResultShell>;
    }

    throw new RuntimeError("RESULT_INVALID", "Jenis assessment tidak didukung untuk customer result experience.");
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "RESULT_NOT_AVAILABLE") notFound();
    const message = error instanceof RuntimeError ? error.message : "Hasil assessment tidak dapat dimuat.";
    return <ResultShell userName={session.user.name} experience={getResultExperience("RIASEC")}><main className="p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Result</p><h1 className="mt-3 text-2xl font-black">Hasil belum tersedia</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{message}</p><Link href="/app" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Kembali ke Dashboard</Link></main></ResultShell>;
  }
}

function Governance({ text, next }: { text: string; next: string }) {
  return <><section className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-7"><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">06 · Interpretation & Limitations</p><p className="mt-3 text-sm leading-7 text-amber-950">{text}</p><p className="mt-3 text-xs leading-6 text-amber-900">Customer result tidak membuat universal score, tidak melakukan raw averaging antar-assessment, dan untuk Cognitive hasil ini bukan skor IQ.</p><p className="mt-4 border-t border-amber-200 pt-4 text-sm leading-7 text-amber-900"><span className="sr-only">Next Action</span>{next}</p></section></>;
}

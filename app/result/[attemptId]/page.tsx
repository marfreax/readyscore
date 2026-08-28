import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttemptResultForUser, RuntimeError } from "../../../lib/assessment/runtime-service";
import { getCurrentSession } from "../../../lib/auth/session";
import { AppShell } from "../../../components/app/AppShell";
import type { AssessmentResult } from "../../../lib/assessment/types";

type ResultData = AssessmentResult;

const RIASEC: Record<string, { name: string; description: string; action: string }> = {
  R: { name: "Realistic", description: "Praktis, konkret, teknis, dan hands-on.", action: "Eksplorasi aktivitas yang memberi ruang untuk membuat, memperbaiki, atau mengoperasikan sesuatu." },
  I: { name: "Investigative", description: "Analitis, ingin tahu, dan senang memecahkan masalah.", action: "Eksplorasi aktivitas yang melibatkan riset, analisis, eksperimen, atau pencarian penjelasan." },
  A: { name: "Artistic", description: "Kreatif, ekspresif, dan terbuka pada ide.", action: "Eksplorasi aktivitas yang memberi ruang untuk mencipta, merancang, menulis, atau mengekspresikan gagasan." },
  S: { name: "Social", description: "Membantu, mengajar, berinteraksi, dan mendukung orang lain.", action: "Eksplorasi aktivitas yang melibatkan mentoring, edukasi, kolaborasi, atau pelayanan." },
  E: { name: "Enterprising", description: "Inisiatif, persuasi, kepemimpinan, dan penggerakan.", action: "Eksplorasi aktivitas yang melibatkan komunikasi, koordinasi, negosiasi, atau pengambilan inisiatif." },
  C: { name: "Conventional", description: "Terstruktur, teliti, teratur, dan nyaman dengan prosedur.", action: "Eksplorasi aktivitas yang membutuhkan pengorganisasian informasi, ketelitian, dan proses yang jelas." },
};

const DISC: Record<string, { name: string; description: string; strengths: string[]; challenges: string[] }> = {
  D: { name: "Dominance", description: "Langsung, tegas, berorientasi pada hasil dan keputusan.", strengths: ["Inisiatif", "Keberanian mengambil keputusan", "Orientasi hasil"], challenges: ["Kesabaran terhadap proses", "Mendengarkan sebelum bertindak", "Menyesuaikan tempo dengan orang lain"] },
  I: { name: "Influence", description: "Ekspresif, persuasif, energik, dan berorientasi pada interaksi.", strengths: ["Komunikasi", "Membangun antusiasme", "Relasi sosial"], challenges: ["Konsistensi detail", "Menjaga fokus", "Menindaklanjuti komitmen"] },
  S: { name: "Steadiness", description: "Stabil, kooperatif, suportif, dan menghargai konsistensi.", strengths: ["Kerja sama", "Dukungan terhadap orang lain", "Konsistensi"], challenges: ["Menghadapi perubahan cepat", "Menyampaikan ketidaksetujuan", "Mengambil keputusan tegas"] },
  C: { name: "Conscientiousness", description: "Teliti, sistematis, hati-hati, dan memperhatikan standar.", strengths: ["Ketelitian", "Analisis terstruktur", "Menjaga kualitas"], challenges: ["Beradaptasi dengan ambiguitas", "Mengambil keputusan dengan informasi terbatas", "Menjaga fleksibilitas"] },
};

const EQ: Record<string, { name: string; description: string }> = {
  EMOTION_AWARENESS: { name: "Emotion Awareness", description: "Mengenali dan memperhatikan keadaan emosi diri dalam situasi sehari-hari." },
  EMOTION_REGULATION: { name: "Emotion Regulation", description: "Mengelola respons emosi agar tetap dapat bertindak secara terarah." },
  EMPATHY_SOCIAL_AWARENESS: { name: "Empathy / Social Awareness", description: "Memperhatikan dan memahami perspektif atau keadaan emosional orang lain." },
  RELATIONSHIP_SOCIAL_RESPONSE: { name: "Relationship / Social Response", description: "Merespons dan membangun interaksi sosial secara konstruktif." },
};

const COGNITIVE: Record<string, { name: string; description: string }> = {
  VERBAL_REASONING: { name: "Verbal Reasoning", description: "Kecenderungan menggunakan bahasa, makna, dan hubungan antar-gagasan untuk memahami informasi." },
  NUMERICAL_REASONING: { name: "Numerical Reasoning", description: "Kecenderungan menggunakan angka, besaran, dan hubungan kuantitatif saat memahami informasi." },
  LOGICAL_REASONING: { name: "Logical Reasoning", description: "Kecenderungan menyusun hubungan sebab-akibat, aturan, dan pola penalaran secara terstruktur." },
  ABSTRACT_REASONING: { name: "Abstract Reasoning", description: "Kecenderungan mengenali pola, hubungan, dan struktur ketika informasi tidak disajikan secara langsung." },
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function scoreBar(value: number) {
  return `${clampScore(value)}%`;
}

function Header({ label }: { label: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">ReadyScore</p>
          <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
        </div>
        <Link href="/app" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
          Dashboard
        </Link>
      </div>
    </header>
  );
}

function ProgressBar({ score }: { score: number }) {
  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: scoreBar(score) }} />
    </div>
  );
}

function FooterNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
      <h3 className="font-black text-amber-950">Catatan interpretasi</h3>
      <p className="mt-2 text-sm leading-7 text-amber-900">{children}</p>
    </div>
  );
}

function ResultActions() {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/app" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
        Kembali ke Dashboard
      </Link>
      <Link href="/" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
        Home
      </Link>
    </div>
  );
}

function Hero({
  eyebrow,
  title,
  description,
  metricLabel,
  metricValue,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
}) {
  return (
    <div className="bg-slate-950 px-7 py-8 text-white sm:px-10 sm:py-10">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">{eyebrow}</p>
      <div className="mt-5 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 px-7 py-5 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{metricLabel}</p>
          <p className="mt-1 text-4xl font-black">{metricValue}</p>
        </div>
      </div>
    </div>
  );
}

function MetaStrip({ result }: { result: ResultData }) {
  const interpretation = result.interpretation;
  return (
    <div className="grid gap-4 border-b border-slate-100 p-6 sm:grid-cols-3 sm:p-8">
      <div className="rounded-2xl bg-slate-50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Status</p>
        <p className="mt-2 text-xl font-black">{interpretation?.status ?? result.status}</p>
        <p className="mt-1 text-xs text-slate-500">status hasil</p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Confidence</p>
        <p className="mt-2 text-xl font-black">{interpretation?.confidence ?? "LIMITED"}</p>
        <p className="mt-1 text-xs text-slate-500">berdasarkan kelengkapan data</p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Completed</p>
        <p className="mt-2 text-sm font-black">{new Date(result.completedAt).toLocaleDateString("id-ID")}</p>
        <p className="mt-1 text-xs text-slate-500">official result snapshot</p>
      </div>
    </div>
  );
}

function ResultFrame({
  label,
  userName,
  children,
}: {
  label: string;
  userName: string;
  children: ReactNode;
}) {
  return (
    <AppShell userName={userName}>
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Customer result</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
          </header>
          <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">{children}</section>
        </div>
      </div>
    </AppShell>
  );
}

function SharedMeaning({
  summary,
  strongest,
  developing,
  strongestLabel = "Relatif lebih menonjol",
  developingLabel = "Area untuk dieksplorasi",
}: {
  summary: string;
  strongest?: string;
  developing?: string;
  strongestLabel?: string;
  developingLabel?: string;
}) {
  return (
    <section className="mt-10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">02 · What This Means</p>
      <div className="mt-4 rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-7">
        <h2 className="text-xl font-black">Interpretasi singkat</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">{summary}</p>
        {(strongest || developing) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {strongest && (
              <div className="rounded-2xl bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{strongestLabel}</p>
                <p className="mt-2 font-black">{strongest}</p>
              </div>
            )}
            {developing && (
              <div className="rounded-2xl bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{developingLabel}</p>
                <p className="mt-2 font-black">{developing}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeading({ number, title, description }: { number: string; title: string; description?: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">{number} · {title}</p>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
    </div>
  );
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const session = await getCurrentSession();

  if (!session) redirect(`/login?next=/result/${encodeURIComponent(attemptId)}`);

  try {
    const result = await getAttemptResultForUser(session.user.id, attemptId);

    if (result.assessmentType === "RIASEC") {
      const measurement = result.riasec?.measurement;
      if (!measurement) throw new RuntimeError("RESULT_INVALID", "Data hasil RIASEC tidak lengkap.");
      const interpretation = result.interpretation;
      const dimensions = measurement.dimensionScores;
      const ranked = measurement.rankedDimensions.filter((item) => item.score !== null);
      const topThree = ranked.slice(0, 3);
      const topCode = measurement.topCode ?? topThree.map((item) => item.dimension).join("");
      const topNames = topThree.map((item) => RIASEC[item.dimension]?.name ?? item.dimension).join(", ");

      return (
        <ResultFrame userName={session.user.name} label="RIASEC Interest Profile">
          <Hero
            eyebrow="Hasil Assessment"
            title="Profil minat Anda"
            description="Hasil ini menunjukkan pola relatif minat vokasional pada enam dimensi RIASEC. Gunakan sebagai bahan eksplorasi, bukan sebagai keputusan otomatis."
            metricLabel="Top Code"
            metricValue={topCode || "—"}
          />
          <MetaStrip result={result} />
          <div className="p-6 sm:p-8">
            <SectionHeading number="01" title="Result Summary" description="Tiga dimensi yang paling menonjol pada hasil Anda." />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {topThree.map((item, index) => {
                const def = RIASEC[item.dimension];
                return (
                  <article key={item.dimension} className={`rounded-3xl border p-6 ${index === 0 ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">{item.dimension}</span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">#{index + 1}</span>
                    </div>
                    <h2 className="mt-5 text-xl font-black">{def?.name ?? item.dimension}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{def?.description}</p>
                    <p className="mt-5 text-3xl font-black">{item.score}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">presentation score</p>
                  </article>
                );
              })}
            </div>

            <SharedMeaning
              summary={interpretation?.summary ?? `Pola minat teratas Anda adalah ${topCode}, dengan ${topNames} sebagai area yang paling menonjol dalam hasil ini.`}
              strongest={topThree[0] ? RIASEC[topThree[0].dimension]?.name : undefined}
              developing={ranked.length ? RIASEC[ranked[ranked.length - 1].dimension]?.name : undefined}
            />

            <section className="mt-10">
              <SectionHeading number="03" title="Your Profile" description="Peta lengkap enam dimensi. Skor dipakai untuk membaca perbedaan relatif dalam hasil ini." />
              <div className="mt-6 space-y-4">
                {dimensions.map((item) => {
                  const def = RIASEC[item.dimension];
                  return (
                    <article key={item.dimension} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-black">{item.dimension}</span>
                          <div>
                            <p className="font-black">{def?.name ?? item.dimension}</p>
                            <p className="text-xs text-slate-500">{def?.description}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-black">{item.score ?? "—"}</p>
                      </div>
                      {item.score !== null && <ProgressBar score={item.score} />}
                      <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                        <span>{item.answeredCount}/{item.questionCount} terjawab</span>
                        <span>{item.sufficient ? "cukup terukur" : "belum cukup terukur"}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-10 grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 p-6">
                <SectionHeading number="04" title="Strengths" />
                <p className="mt-3 text-sm leading-7 text-slate-600">Dimensi yang lebih menonjol dapat menjadi titik awal untuk mengeksplorasi aktivitas yang selaras dengan minat.</p>
                <div className="mt-4 space-y-3">
                  {topThree.map((item) => <div key={item.dimension} className="rounded-2xl bg-slate-50 p-4"><p className="font-black">{RIASEC[item.dimension]?.name}</p><p className="mt-1 text-sm text-slate-600">{RIASEC[item.dimension]?.action}</p></div>)}
                </div>
              </article>
              <article className="rounded-3xl border border-slate-200 p-6">
                <SectionHeading number="05" title="Areas to Watch" />
                <p className="mt-3 text-sm leading-7 text-slate-600">Dimensi yang relatif lebih rendah bukan kekurangan tetap. Jadikan sebagai area yang dapat dieksplorasi lebih lanjut.</p>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="font-black">{ranked.length ? RIASEC[ranked[ranked.length - 1].dimension]?.name : "Belum tersedia"}</p>
                  <p className="mt-1 text-sm text-slate-600">{ranked.length ? RIASEC[ranked[ranked.length - 1].dimension]?.action : "Data belum cukup."}</p>
                </div>
              </article>
            </section>

            <section className="mt-10 rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-7">
              <SectionHeading number="06" title="What to Explore" />
              <p className="mt-3 text-sm leading-7 text-slate-700">Gunakan tiga dimensi teratas sebagai bahan untuk memilih aktivitas, lingkungan belajar, atau topik yang layak Anda eksplorasi. Ini belum merupakan rekomendasi jurusan atau karier deterministik.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {topThree.map((item) => <div key={item.dimension} className="rounded-2xl bg-white p-5"><p className="font-black">{RIASEC[item.dimension]?.name}</p><p className="mt-2 text-sm leading-6 text-slate-600">{RIASEC[item.dimension]?.action}</p></div>)}
              </div>
            </section>

            <FooterNote>RIASEC menggambarkan kecenderungan minat vokasional, bukan ukuran kemampuan, kecerdasan, atau jaminan keberhasilan. Dimensi dan level di halaman ini adalah presentasi hasil assessment, bukan percentile atau norma psikometrik.</FooterNote>
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
              <SectionHeading number="07" title="Next Action" />
              <p className="mt-3 text-sm leading-7 text-slate-600">Simpan hasil ini sebagai snapshot dan gunakan Dashboard untuk melanjutkan eksplorasi yang tersedia bagi akun Anda.</p>
            </section>
            <ResultActions />
          </div>
        </ResultFrame>
      );
    }

    if (result.assessmentType === "DISC") {
      const measurement = result.disc?.measurement;
      if (!measurement) throw new RuntimeError("RESULT_INVALID", "Data hasil DISC tidak lengkap.");
      const interpretation = result.interpretation as AssessmentResult["interpretation"] & {
        primaryPattern?: { code?: string; name?: string; behavioralTendencies?: string };
        behavioralTendencies?: string[];
        potentialStrengths?: string[];
        potentialChallenges?: string[];
      };
      const primary = measurement.primaryPattern;
      const secondary = measurement.secondaryPattern;
      const primaryDef = DISC[primary];
      const secondaryDef = DISC[secondary];
      const strengths = interpretation?.potentialStrengths ?? primaryDef.strengths;
      const challenges = interpretation?.potentialChallenges ?? primaryDef.challenges;

      return (
        <ResultFrame userName={session.user.name} label="DISC Behavioral Profile">
          <Hero
            eyebrow="Hasil Assessment"
            title="Profil perilaku Anda"
            description="Hasil ini menggambarkan kecenderungan perilaku dalam konteks assessment. Gunakan sebagai bahan refleksi, bukan label tetap atau keputusan otomatis."
            metricLabel="Primary Pattern"
            metricValue={primary}
          />
          <MetaStrip result={result} />
          <div className="p-6 sm:p-8">
            <SectionHeading number="01" title="Result Summary" description="Pola utama dan pola sekunder yang muncul pada hasil assessment." />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Primary Pattern</p>
                <h2 className="mt-3 text-2xl font-black">{primaryDef.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{primaryDef.description}</p>
              </article>
              <article className="rounded-3xl border border-slate-200 p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Secondary Pattern</p>
                <h2 className="mt-3 text-2xl font-black">{secondaryDef.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{secondaryDef.description}</p>
              </article>
            </div>

            <SharedMeaning
              summary={interpretation?.summary ?? `Pola utama Anda adalah ${primaryDef.name}, dengan ${secondaryDef.name} sebagai pola sekunder.`}
              strongest={primaryDef.name}
              developing={secondaryDef.name}
              strongestLabel="Primary pattern"
              developingLabel="Secondary pattern"
            />

            <section className="mt-10">
              <SectionHeading number="03" title="Your Profile" description="Perbandingan relatif empat pola DISC pada assessment ini." />
              <div className="mt-6 space-y-4">
                {measurement.dimensionScores.map((item) => (
                  <article key={item.dimension} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div><p className="font-black">{item.dimension} · {DISC[item.dimension].name}</p><p className="text-xs text-slate-500">{item.answeredCount}/{item.questionCount} terjawab</p></div>
                      <p className="text-2xl font-black">{item.score}</p>
                    </div>
                    <ProgressBar score={item.score} />
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-10 grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 p-6">
                <SectionHeading number="04" title="Strengths" />
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">{strengths.map((item) => <li key={item} className="rounded-2xl bg-slate-50 p-4">• {item}</li>)}</ul>
              </article>
              <article className="rounded-3xl border border-slate-200 p-6">
                <SectionHeading number="05" title="Areas to Watch" />
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">{challenges.map((item) => <li key={item} className="rounded-2xl bg-slate-50 p-4">• {item}</li>)}</ul>
              </article>
            </section>

            <section className="mt-10 rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-7">
              <SectionHeading number="06" title="What to Explore" />
              <p className="mt-3 text-sm leading-7 text-slate-700">Perhatikan situasi kerja atau belajar yang memberi ruang bagi kecenderungan perilaku Anda, sambil tetap mempertimbangkan konteks dan preferensi pribadi.</p>
              <div className="mt-5 rounded-2xl bg-white p-5"><p className="font-black">{primaryDef.name}</p><p className="mt-2 text-sm leading-6 text-slate-600">{primaryDef.description}</p></div>
            </section>

            <FooterNote>DISC adalah behavioral/personality profile. Hasil ini bukan aptitude atau intelligence measure dan tidak digunakan secara otomatis untuk menentukan jurusan atau karier.</FooterNote>
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
              <SectionHeading number="07" title="Next Action" />
              <p className="mt-3 text-sm leading-7 text-slate-600">Gunakan hasil ini sebagai bahan refleksi terhadap pola interaksi dan cara bekerja yang terasa natural bagi Anda.</p>
            </section>
            <ResultActions />
          </div>
        </ResultFrame>
      );
    }

    if (result.assessmentType === "EQ" || result.assessmentType === "COGNITIVE") {
      const isEq = result.assessmentType === "EQ";
      const measurement = isEq ? result.eq?.measurement : result.cognitive?.measurement;
      if (!measurement) throw new RuntimeError("RESULT_INVALID", `Data hasil ${result.assessmentType} tidak lengkap.`);
      const labels = isEq ? EQ : COGNITIVE;
      const interpretation = result.interpretation;
      const dimensions = measurement.dimensionScores;
      const ranked = [...dimensions].sort((a, b) => b.score - a.score);
      const strongest = ranked[0];
      const developing = ranked[ranked.length - 1];
      const title = isEq ? "Profil EQ Anda" : "Cognitive Ability Profile";
      const label = isEq ? "EQ Profile" : "Cognitive Reasoning Profile";
      const description = isEq
        ? "Hasil menunjukkan pola relatif pada empat dimensi EQ yang digunakan dalam MVP ini. Gunakan sebagai bahan refleksi dan pengembangan."
        : "Hasil menunjukkan pola relatif pada empat dimensi penalaran. Gunakan sebagai bahan refleksi dan eksplorasi, bukan sebagai skor IQ.";
      const interpretationSummary = interpretation?.summary ??
        `Profil Anda menunjukkan variasi relatif pada empat dimensi. ${labels[strongest.dimension].name} merupakan dimensi yang paling menonjol dalam hasil ini.`;

      return (
        <ResultFrame userName={session.user.name} label={label}>
          <Hero
            eyebrow="Hasil Assessment"
            title={title}
            description={description}
            metricLabel="Overall"
            metricValue={String(measurement.overallScore)}
          />
          <MetaStrip result={result} />
          <div className="p-6 sm:p-8">
            <SectionHeading number="01" title="Result Summary" description="Ringkasan skor keseluruhan dan dimensi yang relatif paling menonjol." />
            <div className="mt-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Overall presentation score</p><p className="mt-2 text-5xl font-black">{measurement.overallScore}</p></div>
                <p className="max-w-xl text-sm leading-6 text-slate-600">Skor ini adalah skala presentasi untuk assessment ini. Jangan membacanya sebagai persentase kemampuan atau sebagai ukuran universal lintas test.</p>
              </div>
              <ProgressBar score={measurement.overallScore} />
            </div>

            <SharedMeaning
              summary={interpretationSummary}
              strongest={labels[strongest.dimension].name}
              developing={labels[developing.dimension].name}
            />

            <section className="mt-10">
              <SectionHeading number="03" title="Your Profile" description={`Peta lengkap empat dimensi ${isEq ? "EQ" : "cognitive reasoning"} pada hasil Anda.`} />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {dimensions.map((item) => (
                  <article key={item.dimension} className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="font-black">{labels[item.dimension].name}</p><p className="mt-2 text-sm leading-6 text-slate-600">{labels[item.dimension].description}</p></div>
                      <p className="text-3xl font-black">{item.score}</p>
                    </div>
                    <ProgressBar score={item.score} />
                    <p className="mt-2 text-xs text-slate-400">{item.answeredCount}/{item.questionCount} terjawab</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-10 grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 p-6">
                <SectionHeading number="04" title="Strengths" />
                <p className="mt-3 text-sm leading-7 text-slate-600">{labels[strongest.dimension].name} merupakan dimensi yang relatif lebih menonjol pada hasil ini.</p>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="font-black">{labels[strongest.dimension].name}</p><p className="mt-1 text-sm leading-6 text-slate-600">{labels[strongest.dimension].description}</p></div>
              </article>
              <article className="rounded-3xl border border-slate-200 p-6">
                <SectionHeading number="05" title="Areas to Watch" />
                <p className="mt-3 text-sm leading-7 text-slate-600">{labels[developing.dimension].name} merupakan dimensi dengan skor relatif paling rendah pada hasil ini. Ini bukan label kekurangan tetap.</p>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="font-black">{labels[developing.dimension].name}</p><p className="mt-1 text-sm leading-6 text-slate-600">{labels[developing.dimension].description}</p></div>
              </article>
            </section>

            <section className="mt-10 rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-7">
              <SectionHeading number="06" title="What to Explore" />
              <p className="mt-3 text-sm leading-7 text-slate-700">Gunakan dimensi yang menonjol dan area yang ingin dikembangkan untuk memilih aktivitas refleksi atau pengembangan yang relevan dengan konteks Anda.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Explore strength</p><p className="mt-2 font-black">{labels[strongest.dimension].name}</p></div>
                <div className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Explore development</p><p className="mt-2 font-black">{labels[developing.dimension].name}</p></div>
              </div>
            </section>

            <FooterNote>
              {isEq
                ? "EQ pada tahap ini adalah assessment MVP dengan empat dimensi konseptual. Hasil runtime bukan bukti validasi psikometrik, diagnosis klinis, atau dasar tunggal untuk menentukan jurusan maupun karier."
                : "Cognitive Ability Profile menggambarkan pola relatif pada empat dimensi penalaran dalam assessment ini. Hasil ini bukan skor IQ, diagnosis, atau bukti validasi psikometrik dan tidak digunakan secara otomatis untuk menentukan jurusan maupun karier."}
            </FooterNote>
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
              <SectionHeading number="07" title="Next Action" />
              <p className="mt-3 text-sm leading-7 text-slate-600">{isEq ? "Gunakan hasil sebagai bahan refleksi dan pengembangan kemampuan emosional dalam konteks nyata." : "Gunakan hasil sebagai bahan refleksi terhadap cara Anda menghadapi informasi, pola, dan masalah penalaran dalam konteks nyata."}</p>
            </section>
            <ResultActions />
          </div>
        </ResultFrame>
      );
    }

    return (
      <ResultFrame userName={session.user.name} label={result.assessmentType}>
        <Hero
          eyebrow="Hasil Assessment"
          title="Hasil Assessment"
          description="Snapshot hasil assessment tersedia untuk ditinjau."
          metricLabel="Overall"
          metricValue={String(result.overallScore)}
        />
        <MetaStrip result={result} />
        <div className="p-6 sm:p-8">
          <SectionHeading number="01" title="Result Summary" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold text-slate-500">Overall Score</p><p className="mt-2 text-3xl font-black">{result.overallScore}</p></div>
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold text-slate-500">Band</p><p className="mt-2 text-xl font-black">{result.band}</p></div>
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold text-slate-500">Coverage</p><p className="mt-2 text-3xl font-black">{result.dataSufficiency.percentage}%</p></div>
          </div>
          <FooterNote>Gunakan hasil sesuai semantics assessment yang menghasilkan snapshot ini. Jangan menarik klaim di luar measurement dan interpretation contract.</FooterNote>
          <ResultActions />
        </div>
      </ResultFrame>
    );
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "RESULT_NOT_AVAILABLE") notFound();
    const message = error instanceof RuntimeError ? error.message : "Hasil assessment tidak dapat dimuat.";
    return (
      <ResultFrame userName={session.user.name} label="Result">
        <div className="p-7 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Result</p>
          <h1 className="mt-3 text-2xl font-black">Hasil belum tersedia</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{message}</p>
          <Link href="/app" className="rs-button rs-button-primary mt-6">Kembali ke Dashboard</Link>
        </div>
      </ResultFrame>
    );
  }
}

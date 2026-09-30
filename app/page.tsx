import FunnelPageTracker from "../components/free/FunnelPageTracker";
import Image from "next/image";
import Link from "next/link";
import { PublicFooter } from "../components/public/PublicFooter";

const assessments = [
  ["Cognitive", "Pola penalaran dan cara Anda memproses informasi."],
  ["Emotional Intelligence", "Pola kesadaran, regulasi, empati, dan respons sosial."],
  ["DISC", "Kecenderungan pola perilaku dalam berbagai situasi."],
  ["RIASEC", "Pola minat dan area eksplorasi pendidikan atau karier."],
  ["Work Attitude", "Pola sikap dan kecenderungan menghadapi pekerjaan."],
  ["Learning Preference", "Preferensi belajar yang relatif lebih menonjol."],
];

export default function HomePage() {
  return <>
    <FunnelPageTracker event="landing_view" />
    <main className="min-h-screen bg-[#F5F7FF] text-[#111827] antialiased">
      <header className="sticky top-0 z-50 border-b border-[#EDEEF6] bg-[#F5F7FF]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6 md:px-8">
          <Link href="/" className="inline-flex items-center" aria-label="ReadyScore home"><Image src="/readyscore-logo.png" alt="ReadyScore Personality Assessment" width={2048} height={673} priority className="h-10 w-auto object-contain sm:h-11" /></Link>
          <nav className="hidden items-center gap-7 text-[14px] font-medium text-[#4B5563] md:flex"><a href="#tentang">Tentang</a><a href="#cara-kerja">Cara Kerja</a><a href="#assessments">Assessment</a><a href="#faq">FAQ</a></nav>
          <div className="flex items-center gap-2"><Link href="/login" className="hidden rounded-full px-5 py-2.5 text-[14px] font-semibold text-[#111827] md:inline-flex">Masuk</Link><Link href="/free" className="inline-flex rounded-full bg-[#0F172A] px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg">Mulai Tes</Link></div>
        </div>
      </header>

      <section id="tentang" className="mx-auto max-w-[1200px] px-6 pb-20 md:px-8 md:pb-24">
        <div className="grid items-center gap-10 pt-8 md:grid-cols-[1.05fr_0.95fr] md:gap-6 md:pt-12">
          <div>
            <div className="inline-flex rounded-full bg-[#FFEB3B] px-3.5 py-1.5 text-[11px] font-bold tracking-widest">PERSONALITY ASSESSMENT</div>
            <h1 className="mt-6 text-[42px] font-[800] leading-[0.96] tracking-[-0.03em] md:text-[60px]">Kenali dirimu.<br />Pahami polamu.<br /><span className="relative inline-block"><span className="relative z-10">Temukan arahnya.</span><span className="absolute bottom-1 left-0 right-0 z-0 h-3 -rotate-1 bg-[#E8E9FF]" /></span></h1>
            <p className="mt-6 max-w-[560px] text-[16px] leading-[1.7] text-[#4B5563] md:text-[18px]">ReadyScore membantu Anda memahami pola diri melalui enam assessment: Cognitive, Emotional Intelligence, DISC, RIASEC, Work Attitude, dan Learning Preference.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/free" className="inline-flex items-center gap-3 rounded-full bg-[#0F172A] px-7 py-[15px] text-[15px] font-semibold text-white shadow-lg">Mulai Tes Gratis <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0F172A]">→</span></Link><Link href="/register" className="inline-flex rounded-full border border-[#DDE1EE] bg-white px-6 py-[15px] text-[15px] font-semibold">Buat Akun</Link></div>
          </div>
          <div className="relative flex min-h-[470px] items-end justify-center md:h-[560px]"><div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8E9FF] blur-3xl" /><Image src="/gina-counselor.png" alt="ReadyScore guide" width={608} height={1080} priority className="relative z-10 h-[440px] w-auto object-contain md:h-[520px]" /></div>
        </div>
      </section>

      <section id="cara-kerja" className="border-y border-[#EDEEF6] bg-white"><div className="mx-auto max-w-[1200px] px-6 py-14 md:px-8 md:py-20"><div className="max-w-2xl"><p className="text-[11px] font-bold tracking-widest text-[#6366F1]">CARA KERJA</p><h2 className="mt-3 text-3xl font-[800] tracking-tight md:text-4xl">Assessment → Result → Profile → Exploration</h2><p className="mt-4 text-[15px] leading-7 text-[#6B7280]">Pilih assessment yang ingin Anda kerjakan, jawab sesuai pengalaman Anda, lalu gunakan result sebagai bahan refleksi dan eksplorasi.</p></div><div className="mt-8 grid gap-4 md:grid-cols-4">{[["01","Pilih","Pilih assessment sesuai kebutuhan."],["02","Jawab","Ikuti pertanyaan dan selesaikan assessment."],["03","Pahami","Baca result sesuai makna assessment."],["04","Eksplorasi","Gunakan evidence untuk memahami diri." ]].map(([n,t,d])=><div key={n} className="rounded-2xl border border-[#EDEEF6] bg-[#F8F8FF] p-5"><div className="text-xs font-black tracking-widest text-[#9CA3AF]">{n}</div><h3 className="mt-2 text-lg font-black">{t}</h3><p className="mt-2 text-sm leading-6 text-[#6B7280]">{d}</p></div>)}</div></div></section>

      <section id="assessments" className="bg-[#F5F7FF]"><div className="mx-auto max-w-[1200px] px-6 py-14 md:px-8 md:py-20"><p className="text-[11px] font-bold tracking-widest text-[#6366F1]">6 CORE ASSESSMENTS</p><h2 className="mt-3 text-3xl font-[800] tracking-tight md:text-4xl">Satu platform, enam perspektif.</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{assessments.map(([title,desc],i)=><article key={title} className="rounded-3xl border border-[#EDEEF6] bg-white p-6 shadow-sm"><div className="text-xs font-black text-[#6366F1]">0{i+1}</div><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6B7280]">{desc}</p></article>)}</div></div></section>

      <section id="faq" className="border-t border-[#EDEEF6] bg-white"><div className="mx-auto max-w-[1200px] px-6 py-14 md:px-8 md:py-20"><div className="grid gap-8 md:grid-cols-3"><div><p className="text-[11px] font-bold tracking-widest text-[#6366F1]">FAQ</p><h2 className="mt-3 text-3xl font-[800]">Yang perlu Anda tahu.</h2></div><div className="grid gap-4 md:col-span-2 md:grid-cols-2"><div className="rounded-2xl border border-[#EDEEF6] bg-[#F8F8FF] p-5"><h3 className="font-bold">Apakah result menentukan masa depan?</h3><p className="mt-2 text-sm leading-6 text-[#6B7280]">Tidak. Result adalah bahan refleksi dan eksplorasi, bukan keputusan final tentang pendidikan atau karier.</p></div><div className="rounded-2xl border border-[#EDEEF6] bg-[#F8F8FF] p-5"><h3 className="font-bold">Harus punya akun untuk mulai?</h3><p className="mt-2 text-sm leading-6 text-[#6B7280]">Tidak untuk Free Test. Anda dapat mencoba assessment gratis terlebih dahulu.</p></div><div className="rounded-2xl border border-[#EDEEF6] bg-[#F8F8FF] p-5"><h3 className="font-bold">Apakah bisa memiliki beberapa profile?</h3><p className="mt-2 text-sm leading-6 text-[#6B7280]">Ya. Account dapat memiliki beberapa subject/profile dengan data assessment yang tetap terisolasi.</p></div><div className="rounded-2xl border border-[#EDEEF6] bg-[#F8F8FF] p-5"><h3 className="font-bold">Bagaimana dengan data saya?</h3><p className="mt-2 text-sm leading-6 text-[#6B7280]">Lihat <Link href="/privacy-policy" className="font-bold text-indigo-600">Privacy Policy</Link> dan <Link href="/data-deletion" className="font-bold text-indigo-600">Data Deletion</Link>.</p></div></div></div><div className="mt-10 rounded-3xl bg-[#0F172A] p-7 text-white md:p-9"><h2 className="text-2xl font-black">Siap mulai mengenal pola dirimu?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Mulai dari Free Test, lalu lanjutkan ke assessment lain sesuai kebutuhan.</p><Link href="/free" className="mt-5 inline-flex rounded-full bg-white px-6 py-3 text-sm font-black text-[#0F172A]">Mulai Tes Gratis →</Link></div></div></section>
      <PublicFooter />
    </main>
  </>;
}

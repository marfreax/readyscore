import Link from "next/link";
import { Badge } from "../components/ui/DesignSystem";

const cards = [
  { href: "/trial/riasec", label: "RIASEC", title: "Temukan profil minat Anda", description: "60 pertanyaan dengan enam dimensi RIASEC." },
  { href: "/trial/eq", label: "EQ", title: "Eksplorasi profil EQ Anda", description: "24 pertanyaan pada empat dimensi EQ." },
  { href: "/trial/disc", label: "DISC", title: "Kenali kecenderungan perilaku Anda", description: "24 pertanyaan pada empat dimensi DISC." },
  { href: "/trial/free", label: "FREE", title: "Assessment gratis", description: "Assessment singkat untuk gambaran awal kesiapan." },
  { href: "/trial/premium", label: "PREMIUM", title: "Assessment Premium", description: "Cakupan assessment yang lebih lengkap." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <a className="rs-skip-link" href="#public-content">Lewati ke konten utama</a>
      <header className="border-b border-white/10"><div className="rs-container flex h-16 items-center justify-between"><Link href="/" className="rs-brand"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-black text-slate-950">R</span><span className="rs-brand-name text-white">ReadyScore</span></Link><nav className="rs-nav"><Link href="/login" className="rs-nav-link text-slate-300 hover:text-white">Masuk</Link><Link href="/register" className="rs-button rs-button-secondary">Daftar</Link></nav></div></header>
      <section id="public-content" className="rs-container py-16 sm:py-24">
        <div className="max-w-3xl"><p className="rs-eyebrow text-indigo-300">ReadyScore</p><h1 className="rs-title mt-5 text-white">Assessment yang siap dipakai.</h1><p className="mt-6 text-lg leading-8 text-slate-300">Application shell dan runtime assessment terhubung langsung ke PostgreSQL. Pilih assessment untuk memulai.</p></div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">{cards.map((card) => <Link key={card.href} href={card.href} className="group rounded-[20px] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"><Badge tone="accent">{card.label}</Badge><h2 className="mt-6 text-xl font-bold">{card.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{card.description}</p><span className="mt-7 inline-block text-sm font-bold text-indigo-300">Mulai →</span></Link>)}</div>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/login" className="rs-button rs-button-secondary">Login</Link><Link href="/register" className="rs-button rs-button-ghost border border-white/20 text-white hover:bg-white/10">Register</Link><Link href="/admin/question-bank" className="rs-button rs-button-ghost border border-white/20 text-white hover:bg-white/10">Admin Question Bank</Link></div>
      </section>
    </main>
  );
}

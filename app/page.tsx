import Link from "next/link";

const cards = [
  {
    href: "/trial/riasec",
    label: "RIASEC",
    title: "Temukan profil minat Anda",
    description: "60 pertanyaan dengan enam dimensi RIASEC.",
  },
  {
    href: "/trial/free",
    label: "FREE",
    title: "Assessment gratis",
    description: "Assessment singkat untuk gambaran awal kesiapan.",
  },
  {
    href: "/trial/premium",
    label: "PREMIUM",
    title: "Assessment Premium",
    description: "Cakupan assessment yang lebih lengkap.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">ReadyScore</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            Assessment yang siap dipakai.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Application shell dan runtime assessment terhubung langsung ke PostgreSQL.
            Pilih assessment untuk memulai.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-200">
                {card.label}
              </span>
              <h2 className="mt-6 text-xl font-bold">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{card.description}</p>
              <span className="mt-7 inline-block text-sm font-bold text-indigo-300">Mulai →</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950">
            Application
          </Link>
          <Link href="/admin/question-bank" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white">
            Admin Question Bank
          </Link>
        </div>
      </section>
    </main>
  );
}

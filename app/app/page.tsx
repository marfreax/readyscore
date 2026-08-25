import Link from "next/link";

export default function AppHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">ReadyScore App</p>
          <h1 className="mt-3 text-3xl font-black">Assessment Workspace</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Pilih assessment yang ingin dijalankan. Attempt, answer, scoring, dan result
            dipersist ke PostgreSQL.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Link href="/trial/riasec" className="rounded-2xl border border-slate-200 p-5 hover:border-indigo-400 hover:bg-indigo-50">
              <p className="text-xs font-bold text-indigo-600">RIASEC</p>
              <h2 className="mt-2 font-bold">60 questions</h2>
              <p className="mt-1 text-xs text-slate-500">R · I · A · S · E · C</p>
            </Link>
            <Link href="/trial/free" className="rounded-2xl border border-slate-200 p-5 hover:border-indigo-400 hover:bg-indigo-50">
              <p className="text-xs font-bold text-indigo-600">FREE</p>
              <h2 className="mt-2 font-bold">20 questions</h2>
              <p className="mt-1 text-xs text-slate-500">Assessment awal</p>
            </Link>
            <Link href="/trial/premium" className="rounded-2xl border border-slate-200 p-5 hover:border-indigo-400 hover:bg-indigo-50">
              <p className="text-xs font-bold text-indigo-600">PREMIUM</p>
              <h2 className="mt-2 font-bold">100 questions</h2>
              <p className="mt-1 text-xs text-slate-500">Assessment lengkap</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

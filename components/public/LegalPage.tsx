import Link from "next/link";
import type { ReactNode } from "react";
import { PublicFooter } from "./PublicFooter";

export function LegalPage({ title, eyebrow, updatedAt, children }: { title: string; eyebrow: string; updatedAt: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="inline-flex items-center" aria-label="ReadyScore home">
            <img src="/readyscore-logo.png" alt="ReadyScore Personality Assessment" className="h-10 w-auto object-contain" />
          </Link>
          <Link href="/" className="text-sm font-bold text-slate-600 hover:text-slate-950">Kembali ke Beranda</Link>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {updatedAt}</p>
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="rs-legal-content max-w-none">{children}</div>
        </div>
      </article>
      <PublicFooter />
    </main>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck } from "lucide-react";
import { trackFunnelEvent } from "../../lib/client-funnel";

type Question = { id: string; text: string; answerType: string; options?: string[]; answer?: number | null };
type Progress = { answered: number; total: number; remaining: number; percentage: number };

const OPTIONS = [
  [1, "Sangat Tidak Sesuai"],
  [2, "Tidak Sesuai"],
  [3, "Netral / Kadang Sesuai"],
  [4, "Sesuai"],
  [5, "Sangat Sesuai"],
] as const;
const STORAGE_KEY = "readyscore:v16:free-attempt";

export default function FreeTestRunner() {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState<Progress>({ answered: 0, total: 10, remaining: 10, percentage: 0 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resuming, setResuming] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) { setResuming(false); return; }
    fetch(`/api/assessment/${saved}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ok || !data.attempt || data.attempt.assessmentType !== "free" || data.attempt.status !== "IN_PROGRESS") throw new Error();
        const next: Record<string, number> = {};
        for (const q of data.questions as Question[]) if (typeof q.answer === "number") next[q.id] = q.answer;
        setAttemptId(saved); setQuestions(data.questions); setAnswers(next); setProgress(data.progress); setCurrent(Math.min(next ? Object.keys(next).length : 0, data.questions.length - 1));
      })
      .catch(() => window.localStorage.removeItem(STORAGE_KEY))
      .finally(() => setResuming(false));
  }, []);

  async function start() {
    trackFunnelEvent("free_test_start");
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/assessment/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "free" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Gagal memulai tes.");
      setAttemptId(data.attemptId); setQuestions(data.questions); setAnswers({}); setProgress(data.progress); setCurrent(0);
      window.localStorage.setItem(STORAGE_KEY, data.attemptId);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Gagal memulai tes."); }
    finally { setBusy(false); }
  }

  async function choose(value: number) {
    const question = questions[current];
    if (!question || !attemptId || busy) return;
    setBusy(true); setMessage("");
    setAnswers((old) => ({ ...old, [question.id]: value }));
    try {
      const response = await fetch(`/api/assessment/${attemptId}/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: question.id, value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Jawaban gagal disimpan.");
      setProgress(data.progress);
      if (current < questions.length - 1) setCurrent((v) => v + 1);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Jawaban gagal disimpan."); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!attemptId || Object.keys(answers).length !== questions.length || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/assessment/${attemptId}/submit`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Tes gagal diselesaikan.");
      trackFunnelEvent("free_test_complete", attemptId);
      router.push(`/free/result/${attemptId}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Tes gagal diselesaikan."); }
    finally { setBusy(false); }
  }

  if (resuming) return <main className="min-h-screen grid place-items-center bg-[#F8FAFF] text-slate-900"><p className="text-sm font-semibold text-slate-500">Memeriksa sesi tes…</p></main>;
  if (!attemptId) return <main className="min-h-screen bg-[#F8FAFF] px-4 py-8 text-[#0B1D3A]"><div className="mx-auto max-w-2xl"><header className="flex items-center justify-between"><div className="flex items-center"><Image src="/readyscore-logo.png" alt="ReadyScore Personality Assessment" width={2048} height={673} priority className="h-9 w-auto object-contain sm:h-10" /></div><span className="rounded-full bg-[#FFC300] px-3 py-1 text-[11px] font-black">FREE • ±1 MENIT</span></header><section className="mt-10 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10"><p className="text-xs font-black uppercase tracking-[.18em] text-[#0A4C9A]">Free RIASEC</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Cek Tipe Jurusanmu</h1><p className="mt-4 text-sm leading-7 text-slate-600">Jawab 10 pertanyaan singkat berdasarkan hal yang paling sesuai dengan dirimu. Tidak ada jawaban benar atau salah.</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><strong>10</strong><p className="mt-1 text-xs text-slate-500">soal</p></div><div className="rounded-2xl bg-slate-50 p-4"><strong>±1 menit</strong><p className="mt-1 text-xs text-slate-500">durasi</p></div><div className="rounded-2xl bg-slate-50 p-4"><strong>Gratis</strong><p className="mt-1 text-xs text-slate-500">hasil awal</p></div></div><button onClick={start} disabled={busy} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0B1D3A] px-7 py-3.5 text-sm font-black text-white disabled:opacity-50">{busy ? "Menyiapkan…" : "Mulai Tes Gratis"}<ArrowRight className="h-4 w-4" /></button>{message && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}<p className="mt-5 flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4" />Jawaban diproses melalui runtime ReadyScore.</p></section></div></main>;

  const question = questions[current];
  const selected = question ? answers[question.id] ?? null : null;
  const isLast = current === questions.length - 1;
  return <main className="min-h-screen bg-[#F8FAFF] px-4 py-6 text-[#0B1D3A]"><div className="mx-auto max-w-2xl"><header className="flex items-center justify-between"><div className="flex items-center"><Image src="/readyscore-logo.png" alt="ReadyScore Personality Assessment" width={2048} height={673} priority className="h-8 w-auto object-contain sm:h-9" /></div><span className="text-[11px] font-black text-slate-400">{current + 1} / {questions.length}</span></header><section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0A4C9A] transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div><p className="mt-7 text-xs font-black uppercase tracking-[.16em] text-slate-400">Pertanyaan {current + 1}</p><h1 className="mt-3 text-xl font-black leading-8 sm:text-2xl">{question?.text}</h1><p className="mt-2 text-xs leading-5 text-slate-400">Pilih yang paling menggambarkan ketertarikanmu.</p><div className="mt-7 grid gap-3">{OPTIONS.map(([value, label]) => <button key={value} onClick={() => choose(value)} disabled={busy} aria-pressed={selected === value} className={`flex min-h-14 items-center gap-3 rounded-2xl border p-4 text-left transition ${selected === value ? "border-[#0A4C9A] bg-blue-50 text-[#0A4C9A]" : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/40"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${selected === value ? "bg-[#0A4C9A] text-white" : "bg-slate-100 text-slate-600"}`}>{value}</span><span className="text-sm font-bold">{label}</span>{selected === value && <Check className="ml-auto h-5 w-5" />}</button>)}</div>{message && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}<div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5"><button onClick={() => setCurrent((v) => Math.max(0, v - 1))} disabled={busy || current === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Sebelumnya</button>{isLast ? <button onClick={submit} disabled={busy || Object.keys(answers).length !== questions.length} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B1D3A] px-5 text-sm font-black text-white disabled:opacity-30">Lihat Hasil <ArrowRight className="h-4 w-4" /></button> : <button onClick={() => setCurrent((v) => Math.min(questions.length - 1, v + 1))} disabled={busy || selected === null} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B1D3A] px-5 text-sm font-black text-white disabled:opacity-30">Berikutnya <ChevronRight className="h-4 w-4" /></button>}</div></section><p className="mt-4 text-center text-[11px] text-slate-400">Tes gratis • RIASEC • 10 soal</p></div></main>;
}

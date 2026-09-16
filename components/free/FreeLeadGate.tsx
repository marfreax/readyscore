"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { trackFunnelEvent } from "../../lib/client-funnel";

export default function FreeLeadGate({ attemptId }: { attemptId: string }) {
  // Analytics are best-effort and never block the unlock flow.

  const router = useRouter();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { trackFunnelEvent("lead_form_view", attemptId); }, [attemptId]);

  async function submit() {
    trackFunnelEvent("free_report_cta", attemptId);
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/free/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId, name, whatsapp, email: email || undefined, consent }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Free Report gagal dibuka.");
      trackFunnelEvent("lead_submitted", attemptId);
      trackFunnelEvent("free_report_unlocked", attemptId);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Free Report gagal dibuka.");
    } finally { setBusy(false); }
  }

  return <section className="mt-8 rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
    <p className="text-xs font-black uppercase tracking-[.16em] text-[#0A4C9A]">Free Report</p>
    <h2 className="mt-2 text-2xl font-black">Buka insight lengkap versi gratis</h2>
    <p className="mt-3 text-sm leading-6 text-slate-600">Masukkan nama dan WhatsApp untuk membuka Free Report. Email bersifat opsional.</p>
    <div className="mt-6 grid gap-4">
      <label className="text-sm font-bold">Nama lengkap<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 font-medium outline-none focus:border-[#0A4C9A]" placeholder="Nama kamu" /></label>
      <label className="text-sm font-bold">Nomor WhatsApp<input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" autoComplete="tel" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 font-medium outline-none focus:border-[#0A4C9A]" placeholder="08xxxxxxxxxx" /></label>
      <label className="text-sm font-bold">Email <span className="font-normal text-slate-400">(opsional)</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 font-medium outline-none focus:border-[#0A4C9A]" placeholder="nama@email.com" /></label>
      <label className="flex gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" /><span>Saya setuju menerima Free Report dan komunikasi relevan ReadyScore melalui WhatsApp.</span></label>
    </div>
    {message && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}
    <button onClick={submit} disabled={busy || !name.trim() || !whatsapp.trim() || !consent} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1D3A] px-6 py-3.5 text-sm font-black text-white disabled:opacity-40">{busy ? "Membuka…" : "Buka Free Report"}<ArrowRight className="h-4 w-4" /></button>
    <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-400"><ShieldCheck className="h-4 w-4" />Data digunakan untuk kebutuhan Free Report dan komunikasi yang kamu setujui.</p>
  </section>;
}

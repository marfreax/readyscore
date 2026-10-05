"use client";

import { FormEvent, useEffect, useState } from "react";
import AssessmentRunner from "../../../components/assessment/AssessmentRunner";

type InvitationData = {
  status: string;
  resultEmailStatus: string;
  category: "CANDIDATE" | "EMPLOYEE" | "ALUMNI";
  maskedEmail: string;
  organization: { id: string; name: string; logoUrl: string | null };
  assessment: { questionCount: number; timeLimitSeconds: number };
  attempt: { id: string; status: string; completedAt: string | null } | null;
  participant: { fullName: string | null; email: string; whatsapp: string | null } | null;
};

type RuntimePayload = {
  attemptId: string;
  timer: { startedAt: string; expiresAt: string; timeLimitSeconds: number; remainingSeconds: number; serverNow: string } | null;
  questions: Array<{ id: string; code: string; text: string; domain: string; subdomain: string | null; indicator: string | null; sequence: number; answerType?: string; options?: string[]; answered?: boolean; answer?: number | null }>;
  progress: { answered: number; total: number; remaining: number; percentage: number };
};

export default function InvitationExperience({ token }: { token: string }) {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [runtime, setRuntime] = useState<RuntimePayload | null>(null);
  const [completed, setCompleted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [whatsappMarketing, setWhatsappMarketing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/invite/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error("Undangan tidak tersedia atau sudah kedaluwarsa.");
        if (cancelled) return;
        setInvitation(data.invitation);
        if (data.invitation.participant) {
          setFullName(data.invitation.participant.fullName ?? "");
          setEmail(data.invitation.participant.email);
          setWhatsapp(data.invitation.participant.whatsapp ?? "");
        }
        if (data.invitation.status === "COMPLETED") setCompleted(true);
      })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Undangan tidak tersedia."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/invite/${encodeURIComponent(token)}/start`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, email, whatsapp, noticeAccepted, emailMarketing, whatsappMarketing }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data?.error?.message ?? "Assessment belum dapat dimulai.");
      setRuntime(data as RuntimePayload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assessment belum dapat dimulai.");
    } finally {
      setBusy(false);
    }
  }

  if (runtime) return <BrandedRunner organization={invitation?.organization} token={token} initialRuntime={runtime} />;
  if (invitation?.attempt?.status === "IN_PROGRESS") {
    return <BrandedRunner organization={invitation?.organization} token={token} />;
  }

  const logoUrl = invitation?.organization.logoUrl;
  const safeLogoUrl = logoUrl?.startsWith("https://") ? logoUrl : null;
  const durationMinutes = invitation ? Math.ceil(invitation.assessment.timeLimitSeconds / 60) : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          {loading ? (
            <p className="text-sm text-slate-600">Memeriksa undangan...</p>
          ) : completed ? (
            <>
              <Brand organization={invitation?.organization} logoUrl={safeLogoUrl} />
              <h1 className="mt-8 text-3xl font-black">Assessment selesai</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">Hasil DISC dikirim melalui email dalam bentuk PDF. Client pengundang juga dapat melihat hasil Anda di portal mereka.</p>
              {invitation?.resultEmailStatus === "FAILED" && <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Pengiriman email hasil belum berhasil. Silakan hubungi client pengundang untuk meminta pengiriman ulang.</p>}
              <p className="mt-7 text-xs font-bold text-slate-500">Assessment provided by ReadyScore</p>
            </>
          ) : !invitation ? (
            <>
              <p className="rs-eyebrow">ReadyScore · Client Assessment</p>
              <h1 className="mt-3 text-2xl font-black">Undangan tidak tersedia</h1>
              <p className="mt-2 text-sm text-slate-600">Tautan mungkin sudah kedaluwarsa atau dibatalkan. Hubungi client pengundang.</p>
            </>
          ) : (
            <>
              <Brand organization={invitation.organization} logoUrl={safeLogoUrl} />
              <p className="mt-8 text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Invitation DISC · {invitation.category === "CANDIDATE" ? "Candidate" : "Karyawan"}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Sebelum memulai assessment</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600"><strong>{invitation.organization.name}</strong> mengundang Anda. Assessment berisi {invitation.assessment.questionCount} soal dan diperkirakan memerlukan sekitar {durationMinutes} menit.</p>
              <p className="mt-3 text-xs font-bold text-slate-500">Assessment provided by ReadyScore</p>

              <form onSubmit={start} className="mt-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold">Nama lengkap
                    <input required minLength={2} maxLength={160} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="rs-input mt-2 w-full" />
                  </label>
                  <label className="block text-sm font-bold">Email undangan
                    <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rs-input mt-2 w-full" />
                    <span className="mt-1 block text-xs font-normal text-slate-500">Undangan dikirim ke {invitation.maskedEmail}.</span>
                  </label>
                </div>
                <label className="block text-sm font-bold">Nomor WhatsApp
                  <input required type="tel" autoComplete="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className="rs-input mt-2 w-full" placeholder="Contoh: +62 812 3456 7890" />
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <p><strong>Penggunaan informasi:</strong> {invitation.organization.name} mengundang Anda dan dapat melihat hasil assessment DISC Anda. Nama, email, dan WhatsApp digunakan untuk mengelola assessment serta mengirim hasil ke email Anda.</p>
                </div>
                <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <input required type="checkbox" checked={noticeAccepted} onChange={(event) => setNoticeAccepted(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                  <span>Saya memahami tujuan assessment dan bahwa client pengundang dapat melihat hasil DISC saya.</span>
                </label>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <p className="text-sm font-bold">Ingin menerima informasi ReadyScore?</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Pilihan ini opsional dan tidak memengaruhi assessment atau pengiriman hasil.</p>
                  <label className="mt-3 flex items-start gap-3 text-sm leading-5 text-slate-700"><input type="checkbox" checked={emailMarketing} onChange={(event) => setEmailMarketing(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300" />Saya ingin menerima informasi ReadyScore melalui email.</label>
                  <label className="mt-2 flex items-start gap-3 text-sm leading-5 text-slate-700"><input type="checkbox" checked={whatsappMarketing} onChange={(event) => setWhatsappMarketing(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300" />Saya ingin menerima informasi ReadyScore melalui WhatsApp.</label>
                </div>
                {error && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
                <button disabled={busy || !noticeAccepted} className="rs-button rs-button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Menyiapkan assessment..." : "Lanjut ke Assessment DISC"}</button>
              </form>
              <p className="mt-6 text-center text-xs text-slate-400">Hasil DISC adalah bahan refleksi dan diskusi, bukan keputusan otomatis tentang kelayakan kerja.</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function BrandedRunner({ organization, token, initialRuntime }: { organization?: InvitationData["organization"]; token: string; initialRuntime?: RuntimePayload }) {
  const logoUrl = organization?.logoUrl?.startsWith("https://") ? organization.logoUrl : null;
  return <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 sm:px-6"><div className="mx-auto max-w-5xl"><div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">{organization && <Brand organization={organization} logoUrl={logoUrl} />}<span className="ml-auto text-[10px] font-bold text-slate-500">Assessment provided by ReadyScore</span></div><AssessmentRunner type="disc" clientToken={token} initialRuntime={initialRuntime} /></div></main>;
}

function Brand({ organization, logoUrl }: { organization?: InvitationData["organization"]; logoUrl: string | null }) {
  if (!organization) return null;
  return <div className="flex items-center gap-4">
    {logoUrl ? <img src={logoUrl} alt={`Logo ${organization.name}`} className="h-14 w-14 rounded-xl border border-slate-200 object-contain p-1" /> : <div aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-lg font-black text-indigo-700">{organization.name.slice(0, 1).toUpperCase()}</div>}
    <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Diundang oleh</p><p className="mt-1 text-lg font-black">{organization.name}</p></div>
  </div>;
}

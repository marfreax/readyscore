"use client";

import { useState } from "react";

type Data = { profiles: Array<{ id: string; referralCode: string; commissionRateBps: number; status: string; user: { name: string; email: string }; _count: { attributions: number } }>; payouts: Array<{ id: string; amountIdr: number; status: string; transferReference: string | null; affiliate: { user: { name: string; email: string } } }> };
const money = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

export default function AffiliateOperations({ initial }: { initial: Data }) {
  const [data, setData] = useState(initial);
  const [userEmail, setUserEmail] = useState("");
  const [rate, setRate] = useState("10");
  const [affiliateStatus, setAffiliateStatus] = useState("ACTIVE");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function call(method: string, body: Record<string, unknown>) {
    const response = await fetch("/api/admin/affiliates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error?.code || "Permintaan gagal.");
    return result;
  }

  async function saveRate(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      await call("POST", { userEmail, ratePercent: Number(rate), status: affiliateStatus });
      const response = await fetch("/api/admin/affiliates"); const result = await response.json();
      if (result.ok) setData({ profiles: result.profiles, payouts: result.payouts });
      setUserEmail(""); setMessage("Affiliate tersimpan. Rate baru berlaku untuk order berikutnya.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Affiliate gagal disimpan."); }
    setBusy(false);
  }

  async function processPayout(payoutId: string, action: "MARK_PAID" | "REJECT") {
    const transferReference = action === "MARK_PAID" ? window.prompt("Masukkan nomor referensi transfer") : undefined;
    if (action === "MARK_PAID" && !transferReference?.trim()) return;
    const note = action === "REJECT" ? window.prompt("Catatan penolakan (opsional)") || "" : "";
    setBusy(true); setError(""); setMessage("");
    try {
      await call("PATCH", { payoutId, action, transferReference, note });
      const response = await fetch("/api/admin/affiliates"); const result = await response.json();
      if (result.ok) setData({ profiles: result.profiles, payouts: result.payouts });
      setMessage(action === "MARK_PAID" ? "Transfer pencairan tercatat." : "Permintaan ditolak dan saldo affiliate dipulihkan.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Pencairan gagal diproses."); }
    setBusy(false);
  }

  return <div className="space-y-6">
    <form onSubmit={saveRate} className="rs-card grid gap-3 p-5 sm:grid-cols-[1fr_160px_160px_auto] sm:items-end"><label className="text-sm font-semibold">Email akun ReadyScore<input type="email" required value={userEmail} onChange={(event) => setUserEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><label className="text-sm font-semibold">Rate komisi (%)<input type="number" min="0.01" max="100" step="0.01" required value={rate} onChange={(event) => setRate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><label className="text-sm font-semibold">Status<select value={affiliateStatus} onChange={(event) => setAffiliateStatus(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="ACTIVE">Aktif</option><option value="SUSPENDED">Ditangguhkan</option></select></label><button disabled={busy} className="rs-button rs-button-primary">Buat / perbarui affiliate</button></form>
    {(message || error) && <p role={error ? "alert" : "status"} className={`rounded-xl p-3 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{error || message}</p>}
    <section className="rs-card overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-black">Affiliate aktif dan referral</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Affiliate</th><th className="px-5 py-3">Kode</th><th className="px-5 py-3">Rate</th><th className="px-5 py-3">Pembeli teratribusi</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{data.profiles.map((profile) => <tr key={profile.id} className="border-t border-slate-100"><td className="px-5 py-3"><strong className="block">{profile.user.name}</strong><span className="text-xs text-slate-500">{profile.user.email}</span></td><td className="px-5 py-3 font-mono">{profile.referralCode}</td><td className="px-5 py-3">{(profile.commissionRateBps / 100).toFixed(2)}%</td><td className="px-5 py-3">{profile._count.attributions}</td><td className="px-5 py-3">{profile.status}</td></tr>)}</tbody></table>{data.profiles.length === 0 && <p className="p-5 text-sm text-slate-500">Belum ada affiliate.</p>}</div></section>
    <section className="rs-card overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-black">Permintaan pencairan</h2></div><div className="divide-y divide-slate-100">{data.payouts.map((payout) => <article key={payout.id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><p className="font-black">{payout.affiliate.user.name} · {money(payout.amountIdr)}</p><p className="text-xs text-slate-500">{payout.affiliate.user.email} · {payout.status}{payout.transferReference ? ` · ${payout.transferReference}` : ""}</p></div>{payout.status === "REQUESTED" || payout.status === "PROCESSING" ? <div className="flex gap-2"><button disabled={busy} onClick={() => processPayout(payout.id, "MARK_PAID")} className="rs-button rs-button-primary">Catat sudah transfer</button><button disabled={busy} onClick={() => processPayout(payout.id, "REJECT")} className="rs-button rs-button-secondary">Tolak</button></div> : null}</article>)}{data.payouts.length === 0 && <p className="p-5 text-sm text-slate-500">Belum ada permintaan pencairan.</p>}</div></section>
  </div>;
}

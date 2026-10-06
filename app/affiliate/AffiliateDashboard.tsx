"use client";

import { useEffect, useState } from "react";

type Summary = NonNullable<Awaited<ReturnType<typeof import("../../lib/affiliate/service").getAffiliateSummary>>>;
const money = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

export default function AffiliateDashboard({ initial }: { initial: Summary | null }) {
  const [summary, setSummary] = useState(initial);
  const [bankName, setBankName] = useState(initial?.profile.payoutBankName ?? "");
  const [accountName, setAccountName] = useState(initial?.profile.payoutAccountName ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.profile.payoutAccountNumber ?? "");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [referralUrl, setReferralUrl] = useState("");

  useEffect(() => {
    if (summary) setReferralUrl(`${window.location.origin}/r/${summary.profile.referralCode}`);
  }, [summary]);

  async function post(path: string, method: string, body?: Record<string, unknown>) {
    const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error?.message || data.error?.code || "Permintaan gagal.");
    return data;
  }

  async function enroll() {
    setBusy(true); setError("");
    try { await post("/api/affiliate", "POST"); window.location.reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Pendaftaran affiliate gagal."); setBusy(false); }
  }

  async function savePayoutDetails(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      await post("/api/affiliate", "PATCH", { bankName, accountName, accountNumber });
      setMessage("Informasi rekening pencairan tersimpan.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Data rekening belum dapat disimpan."); }
    setBusy(false);
  }

  async function requestPayout(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      await post("/api/affiliate/payouts", "POST", { amountIdr: Number(amount) });
      const data = await post("/api/affiliate", "GET"); setSummary(data.summary); setAmount(""); setMessage("Permintaan pencairan tercatat dan menunggu diproses.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Permintaan pencairan gagal."); }
    setBusy(false);
  }

  if (!summary) return <section className="rs-card max-w-2xl p-7"><p className="rs-eyebrow">ReadyScore Affiliate</p><h1 className="mt-2 text-3xl font-black">Mulai menjadi affiliate</h1><p className="mt-3 text-sm leading-6 text-slate-600">Bagikan link ReadyScore. Jika pembeli baru menyelesaikan transaksi dalam 30 hari, pembelian umum dan paket Corporate dapat dikaitkan ke referral Anda.</p><button disabled={busy} onClick={enroll} className="rs-button rs-button-primary mt-6">{busy ? "Menyiapkan akun…" : "Aktifkan akun affiliate"}</button>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}</section>;

  return <div className="space-y-5">
    <header className="rs-card p-6 sm:p-8"><p className="rs-eyebrow">ReadyScore Affiliate</p><h1 className="mt-2 text-3xl font-black">Dashboard affiliate</h1><p className="mt-2 text-sm text-slate-600">Bagikan referral untuk produk ReadyScore umum dan paket Corporate.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Rate komisi</p><p className="mt-1 text-xl font-black">{(summary.profile.commissionRateBps / 100).toFixed(2)}%</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Pembeli teratribusi</p><p className="mt-1 text-xl font-black">{summary.referrals}</p></div><div className="rounded-2xl bg-indigo-50 p-4"><p className="text-xs text-indigo-700">Saldo tersedia</p><p className="mt-1 text-xl font-black">{money(summary.availableBalanceIdr)}</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs text-amber-700">Menunggu H+1</p><p className="mt-1 text-xl font-black">{money(summary.pendingBalanceIdr)}</p></div></div></header>
    <section className="rs-card p-6"><p className="rs-eyebrow">Link referral</p><p className="mt-2 font-bold">Kode: {summary.profile.referralCode}</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input readOnly value={referralUrl} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" aria-label="Link referral" /><button type="button" onClick={() => navigator.clipboard.writeText(referralUrl)} className="rs-button rs-button-secondary">Salin link</button></div><p className="mt-2 text-xs text-slate-500">Referral pertama berlaku 30 hari dan dikunci pada order pembeli.</p></section>
    <section className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={savePayoutDetails} className="rs-card space-y-3 p-6"><h2 className="text-xl font-black">Rekening pencairan</h2><label className="block text-sm font-semibold">Bank<input required value={bankName} onChange={(event) => setBankName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><label className="block text-sm font-semibold">Nama pemilik rekening<input required value={accountName} onChange={(event) => setAccountName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><label className="block text-sm font-semibold">Nomor rekening<input required inputMode="numeric" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><button disabled={busy} className="rs-button rs-button-secondary">Simpan rekening</button></form>
      <form onSubmit={requestPayout} className="rs-card space-y-3 p-6"><h2 className="text-xl font-black">Ajukan pencairan</h2><p className="text-sm text-slate-600">Admin melakukan transfer manual dan mencatat referensi transfer. Tidak ada batas minimum.</p><label className="block text-sm font-semibold">Jumlah (Rupiah)<input required type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><button disabled={busy || !summary.availableBalanceIdr} className="rs-button rs-button-primary">Ajukan pencairan</button></form>
    </section>
    {(message || error) && <p role={error ? "alert" : "status"} className={`rounded-xl p-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{error || message}</p>}
    <section className="rs-card overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-black">Aktivitas komisi</h2></div>{summary.entries.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3">Order</th><th className="px-5 py-3">Jenis</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Jumlah</th></tr></thead><tbody>{summary.entries.map((entry) => <tr key={entry.id} className="border-t border-slate-100"><td className="px-5 py-3">{new Date(entry.createdAt).toLocaleDateString("id-ID")}</td><td className="px-5 py-3">{entry.order ? <><span className="block font-semibold">{entry.order.productNameSnapshot}</span><span className="text-xs text-slate-400">{entry.order.orderNumber}</span></> : entry.payout ? `Pencairan ${entry.payout.id.slice(-8)}` : "—"}</td><td className="px-5 py-3">{entry.entryType.replaceAll("_", " ")}</td><td className="px-5 py-3">{entry.status}</td><td className={`px-5 py-3 font-bold ${entry.amountIdr < 0 ? "text-rose-700" : "text-slate-900"}`}>{money(entry.amountIdr)}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-slate-500">Belum ada transaksi komisi.</p>}</section>
    <section className="rs-card overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-black">Permintaan pencairan</h2></div>{summary.payouts.length ? <div className="divide-y divide-slate-100">{summary.payouts.map((payout) => <div key={payout.id} className="flex justify-between gap-3 p-4 text-sm"><span>{new Date(payout.requestedAt).toLocaleDateString("id-ID")}</span><span>{money(payout.amountIdr)}</span><strong>{payout.status}</strong></div>)}</div> : <p className="p-5 text-sm text-slate-500">Belum ada permintaan pencairan.</p>}</section>
  </div>;
}

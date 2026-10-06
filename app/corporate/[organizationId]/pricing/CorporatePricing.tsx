"use client";

import { useState } from "react";

type Package = { id: string; name: string; creditQuantity: number; priceIdr: number };
type Summary = { availableCredits: number; reservedCredits: number; lots: Array<{ id: string; remainingCredits: number; expiresAt: Date | string; package: { name: string } }>; orders: Array<{ id: string; orderNumber: string; productNameSnapshot: string; totalAmountIdr: number; paymentStatus: string; fulfillmentStatus: string; createdAt: Date | string }>; ledger: Array<{ id: string; entryType: string; creditsDelta: number; createdAt: Date | string }> };

const rupiah = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

export default function CorporatePricing({ organizationId, packages, summary, canPurchase }: { organizationId: string; packages: Package[]; summary: Summary; canPurchase: boolean }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function purchase(packageId: string) {
    setBusy(packageId);
    setError("");
    try {
      const response = await fetch(`/api/client/${encodeURIComponent(organizationId)}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId }) });
      const body = await response.json();
      if (!response.ok || !body.ok || !body.order?.id) throw new Error(body?.error?.message || "Paket belum dapat dibeli.");
      const paymentResponse = await fetch("/api/commercial/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: body.order.id }) });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok || !payment.ok || !payment.payment?.redirectUrl) throw new Error("Halaman pembayaran belum dapat dibuka.");
      window.location.assign(payment.payment.redirectUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout gagal.");
      setBusy("");
    }
  }

  return <div className="space-y-6">
    <section className="rs-card p-6 sm:p-8">
      <p className="rs-eyebrow">ReadyScore Corporate</p>
      <h2 className="mt-2 text-3xl font-black">Paket tes DISC</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Beli kredit sesuai kebutuhan tim. Kredit berlaku 12 bulan dan dialokasikan saat undangan dibuat. Kredit baru terpakai ketika peserta memulai tes.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {packages.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[.14em] text-indigo-700">{item.name}</p>
          <p className="mt-3 text-3xl font-black">{item.creditQuantity} <span className="text-base font-bold text-slate-500">tes</span></p>
          <p className="mt-3 text-2xl font-black">{rupiah(item.priceIdr)}</p>
          <p className="mt-1 text-sm text-slate-500">{rupiah(Math.round(item.priceIdr / item.creditQuantity))} per tes</p>
          {canPurchase && <button type="button" disabled={Boolean(busy)} onClick={() => purchase(item.id)} className="rs-button rs-button-primary mt-5 w-full">{busy === item.id ? "Membuka pembayaran…" : "Beli paket"}</button>}
        </article>)}
      </div>
      {!canPurchase && <p className="mt-4 text-sm text-slate-500">Hubungi administrator organisasi untuk membeli paket kredit.</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
    </section>

    <section className="grid gap-4 sm:grid-cols-2">
      <div className="rs-card p-6"><p className="rs-eyebrow">Kredit tersedia</p><p className="mt-2 text-3xl font-black">{summary.availableCredits}</p><p className="mt-1 text-sm text-slate-500">{summary.reservedCredits} kredit sedang dialokasikan pada undangan aktif.</p></div>
      <div className="rs-card p-6"><p className="rs-eyebrow">Ketentuan kredit</p><p className="mt-2 text-sm leading-6 text-slate-600">Kredit dialokasikan ketika undangan dibuat. Jika undangan dibatalkan atau kedaluwarsa sebelum tes dimulai, kredit kembali ke saldo.</p></div>
    </section>

    <section className="rs-card overflow-hidden">
      <div className="border-b border-slate-100 p-5"><p className="rs-eyebrow">Riwayat</p><h3 className="mt-1 text-xl font-black">Pembelian paket</h3></div>
      {summary.orders.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Paket</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Pembayaran</th><th className="px-5 py-3">Kredit</th></tr></thead><tbody>{summary.orders.map((order) => <tr key={order.id} className="border-t border-slate-100"><td className="px-5 py-4"><span className="font-bold">{order.productNameSnapshot}</span><span className="mt-1 block text-xs text-slate-400">{order.orderNumber}</span></td><td className="px-5 py-4 font-semibold">{rupiah(order.totalAmountIdr)}</td><td className="px-5 py-4">{order.paymentStatus}</td><td className="px-5 py-4">{order.fulfillmentStatus === "FULFILLED" ? "Ditambahkan" : "Menunggu"}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-slate-500">Belum ada pembelian paket.</p>}
    </section>

    <section className="rs-card p-5"><h3 className="font-black">Kredit yang aktif</h3><div className="mt-3 divide-y divide-slate-100">{summary.lots.length ? summary.lots.map((lot) => <div key={lot.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{lot.package.name}</span><span className="font-bold">{lot.remainingCredits} tersisa · berlaku sampai {new Date(lot.expiresAt).toLocaleDateString("id-ID")}</span></div>) : <p className="py-3 text-sm text-slate-500">Belum ada kredit aktif.</p>}</div></section>
    <section className="rs-card overflow-hidden"><div className="border-b border-slate-100 p-5"><h3 className="text-xl font-black">Riwayat perubahan kredit</h3></div>{summary.ledger.length ? <div className="divide-y divide-slate-100">{summary.ledger.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><div><span className="font-semibold">{entry.entryType.replaceAll("_", " ")}</span><span className="ml-2 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleDateString("id-ID")}</span></div><strong className={entry.creditsDelta < 0 ? "text-rose-700" : "text-emerald-700"}>{entry.creditsDelta > 0 ? "+" : ""}{entry.creditsDelta}</strong></div>)}</div> : <p className="p-5 text-sm text-slate-500">Belum ada perubahan kredit.</p>}</section>
  </div>;
}

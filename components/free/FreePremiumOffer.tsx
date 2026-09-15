import FunnelPageTracker from "./FunnelPageTracker";
import Link from "next/link";
import { getCurrentSession } from "../../lib/auth/session";
import { getCommercialCatalog } from "../../lib/commercial/catalog";
import { V16_OFFER_CODE, V16_OFFER_PERCENT, validateV16Offer } from "../../lib/commercial/offer";

function rupiah(value: number | null) { return value == null ? "Harga mengikuti katalog" : `Rp${value.toLocaleString("id-ID")}`; }

export default async function FreePremiumOffer() {
  const session = await getCurrentSession();
  const products = await getCommercialCatalog();
  const medium = products.find((p) => p.tier === "MEDIUM");
  const advance = products.find((p) => p.tier === "ADVANCE");
  const offer = validateV16Offer(V16_OFFER_CODE);
  const coupon = offer.valid ? `?coupon=${encodeURIComponent(V16_OFFER_CODE)}` : "";
  const mediumPath = `/checkout/product-medium${coupon}`;
  const advancePath = `/checkout/product-advance${coupon}`;
  const mediumHref = session ? mediumPath : `/login?next=${encodeURIComponent(mediumPath)}`;
  const advanceHref = session ? advancePath : `/login?next=${encodeURIComponent(advancePath)}`;
  return <><FunnelPageTracker event="premium_offer_view" /><section className="mt-8 rounded-[28px] bg-[#0B1D3A] p-6 text-white shadow-sm sm:p-8">
    <p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Premium</p>
    <h2 className="mt-2 text-2xl font-black">Kalau ingin melihat gambaran yang lebih lengkap</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Free Report adalah titik awal. Premium membuka cakupan assessment dan insight yang lebih luas.</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 text-[#0B1D3A]"><p className="text-xs font-black uppercase tracking-widest text-slate-400">{medium?.name ?? "All Tests"}</p><p className="mt-2 text-xl font-black">{rupiah(medium?.priceIdr ?? null)}</p><p className="mt-2 text-sm text-slate-600">Cognitive + EQ + DISC + RIASEC.</p><Link href={mediumHref} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0B1D3A] px-5 text-sm font-black text-white">Lanjut ke Premium</Link></div>
      <div className="rounded-2xl border border-white/15 bg-white/10 p-5"><p className="text-xs font-black uppercase tracking-widest text-blue-200">{advance?.name ?? "Full Insight"}</p><p className="mt-2 text-xl font-black">{rupiah(advance?.priceIdr ?? null)}</p><p className="mt-2 text-sm text-slate-300">Semua assessment + Cross-Test Profile + personalized report.</p><Link href={advanceHref} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-black text-white">Lihat Full Insight</Link></div>
    </div>
    {offer.valid ? <p className="mt-5 rounded-xl border border-white/15 bg-white/10 p-3 text-xs leading-5 text-blue-100">Penawaran aktif: <strong>{V16_OFFER_CODE}</strong> · diskon {V16_OFFER_PERCENT}% sampai {offer.expiresAt.toLocaleString("id-ID")}.</p> : null}
    <p className="mt-5 text-[11px] leading-5 text-slate-400">Harga dan entitlement divalidasi server-side saat checkout. Penawaran diskon hanya berlaku jika dikonfigurasi dan belum kedaluwarsa.</p>
  </section>
  </>;
}

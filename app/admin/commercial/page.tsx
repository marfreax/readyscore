import { requireAdmin } from "../../../lib/auth/admin";
import { getCommercialCatalog, getCommercialEntitlementMatrix } from "../../../lib/commercial/catalog";

export default async function AdminCommercialPage() {
  await requireAdmin();
  const [catalog, matrix] = await Promise.all([getCommercialCatalog(), Promise.resolve(getCommercialEntitlementMatrix())]);
  return (
    <section className="rs-container py-8 sm:py-10">
      <div className="mb-8">
        <p className="rs-eyebrow">Commercial</p>
        <h1 className="rs-section-title mt-1 text-3xl">Commercial Catalog</h1>
        <p className="rs-subtitle mt-2">V19.5 pricing, package composition, and entitlement matrix. Runtime access remains entitlement-driven.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {catalog.map((product) => (
          <div key={product.id} className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="rs-eyebrow">{product.tier}</p>
            <h2 className="mt-1 text-xl font-black">{product.name}</h2>
            <p className="mt-2 text-2xl font-black">{product.priceIdr == null ? "—" : `Rp${product.priceIdr.toLocaleString("id-ID")}`}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{product.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-3xl border bg-white p-5 shadow-sm">
        <p className="rs-eyebrow">Canonical package matrix</p>
        <div className="mt-4 space-y-5">
          {Object.entries(matrix).filter(([tier]) => tier !== "FREE").map(([tier, entitlements]) => (
            <div key={tier}>
              <h2 className="font-black">{tier}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {entitlements.map((item) => (
                  <span key={`${item.type}:${item.resourceType}:${item.resourceKey}`} className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {item.type} · {item.resourceKey}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

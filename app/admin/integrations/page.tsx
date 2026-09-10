import { prisma } from "../../../lib/db/prisma";
import { requireAdmin } from "../../../lib/auth/admin";

export default async function AdminIntegrationsPage() {
  await requireAdmin();

  const [webhookTotal, processed, failed, received, purchases, addOnPurchases, handoffs] =
    await Promise.all([
      prisma.scalevWebhookEvent.count(),
      prisma.scalevWebhookEvent.count({ where: { status: "PROCESSED" } }),
      prisma.scalevWebhookEvent.count({ where: { status: "FAILED" } }),
      prisma.scalevWebhookEvent.count({ where: { status: "RECEIVED" } }),
      prisma.scalevPurchase.count(),
      prisma.scalevAddOnPurchase.count(),
      prisma.scalevHandoff.count(),
    ]);

  const secretConfigured = Boolean(process.env.SCALEV_WEBHOOK_SIGNING_SECRET);
  const apiConfigured = Boolean(process.env.SCALEV_API_KEY);

  return (
    <section className="rs-container py-8 sm:py-10">
      <div className="mb-8">
        <p className="rs-eyebrow">Integrations</p>
        <h1 className="rs-section-title mt-1 text-3xl">Integration Operations</h1>
        <p className="rs-subtitle mt-2 max-w-2xl">
          Administrative visibility for active integration boundaries. Credential values are never rendered.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="rs-eyebrow">PAYMENT / COMMERCE</p>
              <h2 className="mt-1 text-xl font-black">Scalev</h2>
            </div>
            <span className="rounded-full border px-3 py-1 text-xs font-black">
              {secretConfigured ? "Webhook configured" : "Webhook secret not configured"}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Scalev tetap menjadi commerce/order boundary. ReadyScore hanya menampilkan operational
            evidence yang sudah tersimpan di runtime.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs text-slate-500">API credential</dt>
              <dd className="mt-1 font-black">{apiConfigured ? "Configured" : "Not configured"}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs text-slate-500">Webhook events</dt>
              <dd className="mt-1 font-black">{webhookTotal}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="rs-eyebrow">RUNTIME HEALTH</p>
          <h2 className="mt-1 text-xl font-black">Webhook processing</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["Processed", processed],
              ["Failed", failed],
              ["Received", received],
              ["Purchases", purchases],
              ["Add-on purchases", addOnPurchases],
              ["Handoffs", handoffs],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">Integration boundaries</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="font-black">Scalev handoff</p>
            <p className="mt-1 text-sm text-slate-600">
              Tokenized handoff remains protected and single-use according to the existing runtime.
            </p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="font-black">Webhook security</p>
            <p className="mt-1 text-sm text-slate-600">
              Signature verification remains in the integration boundary; secrets are not exposed here.
            </p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="font-black">Commercial semantics</p>
            <p className="mt-1 text-sm text-slate-600">
              This IA surface does not create, revoke, or alter customer entitlement.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}

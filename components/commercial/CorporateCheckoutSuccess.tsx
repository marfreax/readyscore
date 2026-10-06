import Link from "next/link";
import { Badge, Card } from "../ui/DesignSystem";
import { PaymentSuccessRefresh } from "./PaymentSuccessRefresh";

function formatRupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type CorporateOrder = {
  orderNumber: string;
  productNameSnapshot: string;
  totalAmountIdr: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  clientOrganizationId: string | null;
  clientOrganization: { name: string; logoUrl: string | null } | null;
  clientDiscPackage: { name: string; creditQuantity: number } | null;
  creditLot: { remainingCredits: number; expiresAt: Date } | null;
};

export function CorporateCheckoutSuccess({
  order,
  orderNumber,
  providerStatus,
  reconciliationError,
}: {
  order: CorporateOrder | null;
  orderNumber: string | undefined;
  providerStatus: string;
  reconciliationError: string | null;
}) {
  const organizationId = order?.clientOrganizationId;
  const workspaceUrl = organizationId ? `/corporate/${encodeURIComponent(organizationId)}` : "/corporate";
  const creditsUrl = organizationId ? `${workspaceUrl}/pricing` : "/corporate";
  const paid = order?.paymentStatus === "PAID";
  const failed = ["FAILED", "EXPIRED", "CANCELLED", "REFUNDED"].includes(order?.paymentStatus ?? "");
  const ready = order?.fulfillmentStatus === "FULFILLED";
  const title = paid
    ? ready ? "Kredit DISC sudah masuk" : "Pembayaran terverifikasi"
    : failed ? "Pembayaran belum berhasil" : "Pembayaran sedang diproses";
  const description = paid
    ? ready
      ? `Pembelian untuk ${order?.clientOrganization?.name ?? "organisasi Corporate Anda"} telah selesai.`
      : "Pembayaran diterima. Kami sedang menambahkan kredit ke saldo organisasi."
    : failed
      ? "Pembayaran belum menghasilkan kredit. Anda dapat memeriksa saldo organisasi atau menghubungi ReadyScore jika dana sudah terpotong."
      : "Kami sedang menunggu konfirmasi pembayaran dari Midtrans. Saldo kredit baru diperbarui setelah pembayaran terverifikasi.";

  return (
    <main className="rs-page min-h-screen text-slate-950">
      <a className="rs-skip-link" href="#main-content">Lewati ke konten utama</a>
      <header className="border-b border-slate-200 bg-white">
        <div className="rs-container flex min-h-16 items-center justify-between gap-4 py-3">
          <Link href={workspaceUrl} className="flex items-center gap-3" aria-label="Buka workspace Corporate">
            <img src="/readyscore-logo.png" alt="ReadyScore" className="h-9 w-auto" />
            <span className="border-l border-slate-200 pl-3 text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Corporate</span>
          </Link>
          <p className="hidden text-xs font-semibold text-slate-500 sm:block">Pembayaran dan kredit dikelola oleh ReadyScore</p>
        </div>
      </header>

      <div id="main-content" className="rs-container max-w-4xl py-8 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {order?.clientOrganization?.logoUrl ? (
              <img src={order.clientOrganization.logoUrl} alt={`Logo ${order.clientOrganization.name}`} className="h-12 w-12 rounded-xl border border-slate-200 bg-white object-contain p-1" />
            ) : null}
            <div>
              <p className="rs-eyebrow">{order?.clientOrganization?.name ?? "Workspace Corporate"}</p>
              <p className="mt-1 text-sm text-slate-500">Konfirmasi pembelian DISC</p>
            </div>
          </div>
          <Link href={workspaceUrl} className="rs-button rs-button-secondary">Kembali ke workspace</Link>
        </div>

        <Card tone={paid && ready ? "accent" : failed ? "danger" : "default"} className="p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="rs-eyebrow">Pembelian Corporate</p>
              <h1 className="rs-title mt-2">{title}</h1>
              <p className="rs-subtitle mt-3 max-w-2xl">{description}</p>
            </div>
            {order ? <Badge tone={paid && ready ? "success" : failed ? "danger" : "warning"}>{ready ? "KREDIT TERSEDIA" : order.paymentStatus}</Badge> : null}
          </div>

          {order ? (
            <dl className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5">
              <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Nomor order</dt><dd className="mt-1 break-all text-sm font-black">{order.orderNumber}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Paket</dt><dd className="mt-1 text-sm font-black">{order.clientDiscPackage?.name ?? order.productNameSnapshot}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Total pembayaran</dt><dd className="mt-1 text-sm font-black">{formatRupiah(order.totalAmountIdr)}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Kredit paket</dt><dd className="mt-1 text-sm font-black">{order.clientDiscPackage ? `${order.clientDiscPackage.creditQuantity} tes DISC` : "—"}</dd></div>
              {ready && order.creditLot ? <>
                <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Saldo dari pembelian ini</dt><dd className="mt-1 text-sm font-black">{order.creditLot.remainingCredits} kredit</dd></div>
                <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Berlaku sampai</dt><dd className="mt-1 text-sm font-black">{formatDate(order.creditLot.expiresAt)}</dd></div>
              </> : null}
            </dl>
          ) : (
            <p role="alert" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              {reconciliationError === "ORDER_NOT_FOUND"
                ? "Order tidak ditemukan pada akun ini. Pastikan Anda masuk dengan akun yang digunakan saat checkout."
                : orderNumber
                  ? "Status order belum dapat dikonfirmasi. Coba periksa status lagi beberapa saat."
                  : "Nomor order dari Midtrans tidak ditemukan pada halaman ini."}
            </p>
          )}

          {providerStatus ? <p className="mt-4 text-xs text-slate-500">Status dari Midtrans: {providerStatus}. Status final selalu diverifikasi oleh server ReadyScore.</p> : null}

          {orderNumber && (!paid || !ready) && !failed ? <PaymentSuccessRefresh audience="corporate" /> : null}

          <div className="mt-7 flex flex-wrap gap-3">
            {orderNumber && (!paid || !ready) && !failed ? (
              <Link href={`/checkout/success?order_id=${encodeURIComponent(orderNumber)}`} className="rs-button rs-button-primary">Periksa status pembayaran</Link>
            ) : null}
            {organizationId && paid && ready ? <Link href={creditsUrl} className="rs-button rs-button-primary">Lihat saldo kredit</Link> : null}
            {organizationId && failed ? <Link href={creditsUrl} className="rs-button rs-button-primary">Pilih paket Corporate</Link> : null}
            <Link href={workspaceUrl} className={organizationId && (paid && ready || failed) ? "rs-button rs-button-secondary" : "rs-button rs-button-primary"}>{organizationId ? "Buka workspace Corporate" : "Kunjungi workspace Corporate"}</Link>
          </div>
        </Card>
        <p className="mt-6 text-center text-xs text-slate-500">Assessment provided by ReadyScore</p>
      </div>
    </main>
  );
}

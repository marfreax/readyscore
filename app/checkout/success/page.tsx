import Link from "next/link";
import { PaymentSuccessRefresh } from "../../../components/commercial/PaymentSuccessRefresh";
import { redirect } from "next/navigation";
import { CustomerPageShell } from "../../../components/app/CustomerPageShell";
import { Badge, Card } from "../../../components/ui/DesignSystem";
import { getCurrentSession } from "../../../lib/auth/session";
import { reconcileCommercialOrderReturn } from "../../../lib/commercial/v14-2";

function formatRupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function assessmentPath(type: string | null) {
  switch (type) {
    case "COGNITIVE": return "/assessments/cognitive/pre-test";
    case "EQ": return "/assessments/eq/pre-test";
    case "DISC": return "/assessments/disc/pre-test";
    case "RIASEC": return "/assessments/riasec/pre-test";
    default: return null;
  }
}

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/checkout/success");

  const params = await searchParams;
  const rawOrderNumber = params.order_id ?? params.order;
  const orderNumber = Array.isArray(rawOrderNumber) ? rawOrderNumber[0] : rawOrderNumber;
  const providerStatus = typeof params.transaction_status === "string"
    ? params.transaction_status.trim().toLowerCase()
    : "";

  let order: Awaited<ReturnType<typeof reconcileCommercialOrderReturn>> | null = null;
  let reconciliationError: string | null = null;

  if (orderNumber) {
    try {
      order = await reconcileCommercialOrderReturn(orderNumber);
    } catch (error) {
      reconciliationError = error instanceof Error ? error.message : "PAYMENT_RETURN_RECONCILIATION_FAILED";
      console.error("V14.4_PAYMENT_RETURN_RECONCILIATION_FAILED", {
        orderNumber,
        error: reconciliationError,
      });
    }
  }

  const paymentStatus = order?.paymentStatus ?? "PENDING";
  const paymentPaid = paymentStatus === "PAID";
  const paymentFailed = ["FAILED", "EXPIRED", "CANCELLED"].includes(paymentStatus);
  const accessReady = order?.fulfillmentStatus === "FULFILLED";
  const startPath = assessmentPath(order?.assessmentTypeSnapshot ?? null);
  const pageTitle = paymentPaid
    ? "Pembayaran berhasil"
    : paymentFailed
      ? "Pembayaran belum berhasil"
      : "Pembayaran sedang diproses";
  const pageDescription = paymentPaid
    ? accessReady
      ? "Pembayaran sudah terverifikasi dan akses pembelian sudah tersedia pada akun Anda."
      : "Pembayaran sudah terverifikasi. ReadyScore sedang memastikan akses pembelian tersedia."
    : paymentFailed
      ? "Pembayaran belum menghasilkan akses. Anda dapat kembali ke Access & Plans untuk mencoba lagi."
      : "ReadyScore belum menerima status pembayaran final. Status akan diverifikasi dari Midtrans.";

  return (
    <CustomerPageShell
      userName={session.user.name}
      eyebrow="Payment"
      title={pageTitle}
      description={pageDescription}
    >
      <div className="mx-auto max-w-2xl space-y-5 pb-10">
        <Card tone={paymentPaid ? "accent" : paymentFailed ? "danger" : "default"} className="px-5 py-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="rs-eyebrow">ReadyScore payment</p>
              <h2 className="mt-2 text-2xl font-black">
                {paymentPaid
                  ? "Pembayaran terverifikasi"
                  : paymentFailed
                    ? "Pembayaran belum berhasil"
                    : "Menunggu konfirmasi pembayaran"}
              </h2>
            </div>
            <Badge tone={paymentPaid ? "success" : paymentFailed ? "danger" : "neutral"}>
              {paymentStatus}
            </Badge>
          </div>

          {order ? (
            <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Order</p>
                <p className="mt-1 break-all text-sm font-black text-slate-800">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Produk</p>
                <p className="mt-1 text-sm font-black text-slate-800">{order.productNameSnapshot}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Total</p>
                <p className="mt-1 text-sm font-black text-slate-800">{formatRupiah(order.totalAmountIdr)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Akses</p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {accessReady ? "Sudah tersedia" : "Sedang diproses"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              {reconciliationError === "ORDER_NOT_FOUND"
                ? "Order tidak ditemukan pada akun ini. Silakan kembali ke Access & Plans."
                : orderNumber
                  ? "Status pembayaran belum dapat dikonfirmasi. Silakan coba lagi beberapa saat lagi."
                  : "Order ID dari Midtrans tidak ditemukan pada halaman ini."}
            </p>
          )}

          {providerStatus ? (
            <p className="mt-4 text-xs text-slate-400">
              Status dari redirect Midtrans: {providerStatus}. Status final tetap diverifikasi server-side.
            </p>
          ) : null}

          {!paymentFailed && orderNumber && (!paymentPaid || !accessReady) ? (
            <PaymentSuccessRefresh />
          ) : null}

          {paymentPaid && accessReady ? (
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-900">Akses pembelian sudah unlock.</p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Anda sekarang dapat melihat assessment yang dimiliki pada Access &amp; Plans.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {paymentPaid && accessReady && startPath ? (
              <Link href={startPath} className="rs-button rs-button-primary">
                Mulai Assessment
              </Link>
            ) : null}
            <Link href="/access" className="rs-button rs-button-primary">
              Buka Access &amp; Plans
            </Link>
            {!paymentPaid && orderNumber ? (
              <Link
                href={`/checkout/success?order_id=${encodeURIComponent(orderNumber)}`}
                className="rs-button rs-button-secondary"
              >
                Cek status lagi
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </CustomerPageShell>
  );
}

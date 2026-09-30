"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerPageShell } from "../app/CustomerPageShell";
import { Card } from "../ui/DesignSystem";

type TestType = "COGNITIVE" | "EQ" | "DISC" | "RIASEC" | "WORK_ATTITUDE" | "LEARNING_PREFERENCE";

const LABELS: Record<TestType, string> = {
  COGNITIVE: "Cognitive",
  EQ: "Emotional Intelligence",
  DISC: "DISC",
  RIASEC: "RIASEC",
  WORK_ATTITUDE: "Work Attitude",
  LEARNING_PREFERENCE: "Learning Preference",
};

export default function ReassessmentCreditCheckout({ userName, testType }: { userName: string; testType: TestType }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function startPayment() {
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const orderResponse = await fetch("/api/commercial/add-on-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ testType }),
      });
      const orderBody = await orderResponse.json();
      if (!orderResponse.ok || !orderBody?.ok) throw new Error(orderBody?.error?.code ?? "ADD_ON_CHECKOUT_FAILED");

      const paymentResponse = await fetch("/api/commercial/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: orderBody.order.id }),
      });
      const paymentBody = await paymentResponse.json();
      if (!paymentResponse.ok || !paymentBody?.ok) throw new Error(paymentBody?.error?.code ?? "PAYMENT_CREATE_FAILED");

      const redirectUrl = paymentBody?.payment?.redirectUrl;
      if (typeof redirectUrl === "string" && redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }
      throw new Error("MIDTRANS_PAYMENT_URL_MISSING");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pembayaran tidak dapat dibuat.");
      setLoading(false);
    }
  }

  return (
    <CustomerPageShell
      userName={userName}
      eyebrow="Reassessment Credit"
      title={`Tambah 1 credit untuk ${LABELS[testType]}`}
      description="Credit ini memberi satu kesempatan assessment tambahan setelah assessment awal selesai. Pembayaran diproses melalui Midtrans."
    >
      <div className="mx-auto max-w-2xl pb-10">
        <Card tone="accent" className="px-6 py-7 sm:px-8">
          <p className="rs-eyebrow">ReadyScore · Reassessment Credit</p>
          <h2 className="mt-2 text-2xl font-black">{LABELS[testType]}</h2>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-600">1 additional assessment credit</span>
              <span className="text-xl font-black">Rp49.000</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Setelah pembayaran Midtrans berhasil dan terverifikasi, credit otomatis ditambahkan ke akun Anda. Credit tidak mengubah hasil assessment sebelumnya.
            </p>
          </div>
          {message ? <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{message}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={startPayment} disabled={loading} className="rs-button rs-button-primary">
              {loading ? "Membuka pembayaran…" : "Bayar Rp49.000 via Midtrans"}
            </button>
            <button type="button" onClick={() => router.push("/access")} className="rs-button rs-button-secondary">
              Kembali
            </button>
          </div>
        </Card>
      </div>
    </CustomerPageShell>
  );
}

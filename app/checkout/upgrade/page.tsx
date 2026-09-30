"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function UpgradeCheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const started = useRef(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const targetTier = params.get("tier");
    if (targetTier !== "MEDIUM" && targetTier !== "ADVANCE") {
      router.replace("/access");
      return;
    }
    void (async () => {
      try {
        const response = await fetch("/api/commercial/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ upgradeTier: targetTier }),
        });
        const body = await response.json();
        if (!response.ok || !body?.ok) throw new Error(body?.error?.code ?? "UPGRADE_CHECKOUT_FAILED");
        const paymentResponse = await fetch("/api/commercial/payments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId: body.order.id }),
        });
        const paymentBody = await paymentResponse.json();
        if (!paymentResponse.ok || !paymentBody?.ok || !paymentBody?.payment?.redirectUrl) {
          throw new Error(paymentBody?.error?.code ?? "PAYMENT_REDIRECT_MISSING");
        }
        window.location.assign(paymentBody.payment.redirectUrl);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Pembayaran tidak dapat dibuka.");
      }
    })();
  }, [params, router]);

  return (
    <main style={{ maxWidth: 720, margin: "80px auto", padding: 24, textAlign: "center" }}>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>ReadyScore</p>
      <h1 style={{ marginTop: 12, fontSize: 28, fontWeight: 800 }}>{message ? "Pembayaran tidak dapat dibuka" : "Membuka pembayaran…"}</h1>
      <p style={{ marginTop: 8, color: "#64748b" }}>{message || "Anda akan diarahkan ke Payment Gateway."}</p>
      {message ? <button type="button" onClick={() => router.push("/access")} style={{ marginTop: 20 }}>Kembali ke Access & Plans</button> : null}
    </main>
  );
}


export default function UpgradeCheckoutPage() {
  return (
    <Suspense fallback={
      <main style={{ maxWidth: 720, margin: "80px auto", padding: 24, textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>ReadyScore</p>
        <h1 style={{ marginTop: 12, fontSize: 28, fontWeight: 800 }}>Membuka pembayaran…</h1>
        <p style={{ marginTop: 8, color: "#64748b" }}>Anda akan diarahkan ke Payment Gateway.</p>
      </main>
    }>
      <UpgradeCheckoutContent />
    </Suspense>
  );
}

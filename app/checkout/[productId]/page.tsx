"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackFunnelEvent } from "../../../lib/client-funnel";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  priceIdr: number | null;
  tier: string;
  selectableTestTypes: string[];
};

const TEST_LABELS: Record<string, string> = {
  IQ: "Cognitive",
  EQ: "Emotional Intelligence",
  DISC: "DISC",
  RIASEC: "RIASEC",
};

export default function CheckoutPage() {
  const params = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const requestedTestType = (searchParams.get("testType") ?? "").trim().toUpperCase();
  const couponCode = (searchParams.get("coupon") ?? "").trim().toUpperCase();

  const selectedTestType = useMemo(
    () => (requestedTestType && ["IQ", "EQ", "DISC", "RIASEC"].includes(requestedTestType) ? requestedTestType : ""),
    [requestedTestType],
  );

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function startPayment() {
      trackFunnelEvent("checkout_started");
      try {
        const response = await fetch("/api/commercial/catalog", { cache: "no-store" });
        const body = await response.json();
        const found = body?.products?.find((p: CatalogProduct) => p.id === params.productId);
        if (!found) throw new Error("PRODUCT_NOT_AVAILABLE");
        setProduct(found);

        if (found.tier === "BASIC" && !selectedTestType) {
          router.replace("/access#single-test");
          return;
        }

        setSubmitting(true);
        const checkoutResponse = await fetch("/api/commercial/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            productId: found.id,
            quantity: 1,
            ...(found.tier === "BASIC" ? { testType: selectedTestType } : {}),
            ...(couponCode ? { couponCode } : {}),
          }),
        });
        const checkoutBody = await checkoutResponse.json();
        if (!checkoutResponse.ok) {
          throw new Error(checkoutBody?.error?.code ?? "CHECKOUT_FAILED");
        }

        const paymentResponse = await fetch("/api/commercial/payments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId: checkoutBody.order.id }),
        });
        const paymentBody = await paymentResponse.json();
        if (!paymentResponse.ok) {
          throw new Error(paymentBody?.error?.code ?? "PAYMENT_CREATE_FAILED");
        }

        const redirectUrl = paymentBody?.payment?.redirectUrl;
        if (!redirectUrl) throw new Error("PAYMENT_REDIRECT_MISSING");
        window.location.assign(redirectUrl);
      } catch (error) {
        const code = error instanceof Error ? error.message : "CHECKOUT_FAILED";
        setMessage(
          code === "UNAUTHENTICATED"
            ? "Silakan login terlebih dahulu."
            : code === "SINGLE_TEST_SELECTION_REQUIRED" || code === "INVALID_SINGLE_TEST_TYPE"
              ? "Pilihan assessment tidak valid."
              : "Pembayaran tidak dapat dibuka. Silakan kembali dan coba lagi.",
        );
        setSubmitting(false);
      } finally {
        setLoading(false);
      }
    }

    void startPayment();
  }, [params.productId, router, selectedTestType]);


  if (loading || submitting) {
    return (
      <main style={{ maxWidth: 720, margin: "80px auto", padding: 24, textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>ReadyScore</p>
        <h1 style={{ marginTop: 12, fontSize: 28, fontWeight: 800 }}>Membuka pembayaran…</h1>
        <p style={{ marginTop: 8, color: "#64748b" }}>Anda akan diarahkan ke halaman pembayaran.</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ maxWidth: 720, margin: "80px auto", padding: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Pembayaran tidak dapat dibuka</h1>
        {message ? <p role="alert" style={{ marginTop: 12, color: "#64748b" }}>{message}</p> : null}
        <button type="button" onClick={() => router.push("/access")} style={{ marginTop: 20 }}>
          Kembali ke Access &amp; Plans
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "80px auto", padding: 24, textAlign: "center" }}>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>ReadyScore</p>
      <h1 style={{ marginTop: 12, fontSize: 28, fontWeight: 800 }}>Pembayaran tidak dapat dibuka</h1>
      {message ? <p role="alert" style={{ marginTop: 12, color: "#64748b" }}>{message}</p> : null}
      <button type="button" onClick={() => router.push("/access")} style={{ marginTop: 20 }}>
        Kembali ke Access &amp; Plans
      </button>
    </main>
  );
}

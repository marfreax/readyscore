"use client";

import Script from "next/script";
import { useEffect } from "react";

type PromoTracker = {
  attribution: () => Record<string, string>;
  track: (name: "ViewContent" | "InitiateCheckout" | "Purchase", eventId?: string, value?: number) => void;
};
export function promoTracker() {
  return (window as Window & { ReadyScorePromo?: PromoTracker }).ReadyScorePromo;
}

export default function PromoMeasurement({ paymentStatus, orderNumber, value }: { paymentStatus?: string; orderNumber?: string; value: number }) {
  useEffect(() => {
    const measure = () => {
      const tracker = promoTracker();
      tracker?.track("InitiateCheckout");
      // Payment state comes from the authenticated server-side capability API,
      // never from a Midtrans browser callback or a URL query parameter.
      if (paymentStatus === "PAID" && orderNumber) tracker?.track("Purchase", `rs-purchase-${orderNumber}`, value);
    };
    measure();
    window.addEventListener("readyscore-promo-ready", measure);
    return () => window.removeEventListener("readyscore-promo-ready", measure);
  }, [paymentStatus, orderNumber, value]);
  return <Script id="promo-measurement" src="/promo-tracking.js" data-pixel-id="1600994505022613" strategy="afterInteractive" />;
}

"use client";

import { useEffect, useState } from "react";
import { trackFunnelEvent } from "../../lib/client-funnel";

type Delivery = {
  pdfStatus?: string;
  whatsappStatus?: string;
  emailStatus?: string;
  deliveryInProgress?: boolean;
};

type DeliveryResponse = {
  ok: boolean;
  delivery?: Delivery;
};

// React Strict Mode can mount effects twice during development. Keep one
// in-flight request per attempt so a second mount cannot create a duplicate
// provider delivery. The server also has a durable DB lease as the final guard.
const inFlightDeliveries = new Map<string, Promise<DeliveryResponse>>();

function requestDeliveryOnce(attemptId: string) {
  const existing = inFlightDeliveries.get(attemptId);
  if (existing) return existing;

  const request = fetch("/api/free/delivery", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ attemptId }),
  })
    .then(async (response) => {
      const data = (await response.json().catch(() => ({}))) as DeliveryResponse;
      return { ok: response.ok, delivery: data?.delivery };
    })
    .finally(() => {
      inFlightDeliveries.delete(attemptId);
    });

  inFlightDeliveries.set(attemptId, request);
  return request;
}

function describeDelivery(delivery: Delivery) {
  if (delivery.deliveryInProgress) return "Pengiriman sedang diproses. Tidak ada pengiriman tambahan yang dibuat.";

  const sent: string[] = [];
  if (delivery.whatsappStatus === "SENT") sent.push("WhatsApp");
  if (delivery.emailStatus === "SENT") sent.push("email");

  if (sent.length) return `PDF siap dan sudah dikirim melalui ${sent.join(" dan ")}.`;
  if (delivery.whatsappStatus === "FAILED" || delivery.emailStatus === "FAILED") {
    return "PDF siap, tetapi salah satu pengiriman belum berhasil. Kamu bisa mencoba lagi.";
  }
  return "PDF siap. Provider WhatsApp/email belum aktif atau belum berhasil digunakan.";
}

export default function FreeReportDeliveryStatus({ attemptId }: { attemptId: string }) {
  const [state, setState] = useState<{ loading: boolean; message: string; delivery?: Delivery }>({
    loading: true,
    message: "Menyiapkan PDF dan pengiriman…",
  });

  async function requestDelivery() {
    setState((current) => ({ ...current, loading: true, message: "Mencoba menyiapkan dan mengirim…" }));
    try {
      const result = await requestDeliveryOnce(attemptId);
      const delivery = result.delivery;
      if (!result.ok || !delivery) {
        setState({ loading: false, message: "Free Report sudah terbuka. Pengiriman belum berhasil dan dapat dicoba lagi." });
        return;
      }

      if (delivery.pdfStatus === "GENERATED") trackFunnelEvent("pdf_generated", attemptId);
      if (delivery.whatsappStatus === "SENT") trackFunnelEvent("whatsapp_sent", attemptId);
      if (delivery.emailStatus === "SENT") trackFunnelEvent("email_sent", attemptId);
      setState({ loading: false, message: describeDelivery(delivery), delivery });
    } catch {
      setState({ loading: false, message: "Free Report sudah terbuka. Pengiriman belum berhasil dan dapat dicoba lagi." });
    }
  }

  useEffect(() => {
    void requestDelivery();
  }, [attemptId]);

  const retryable = !state.loading && Boolean(
    state.delivery?.whatsappStatus === "FAILED" ||
    state.delivery?.whatsappStatus === "SKIPPED" ||
    state.delivery?.emailStatus === "FAILED" ||
    state.delivery?.emailStatus === "SKIPPED",
  );

  return <div className="mt-4" aria-live="polite">
    <p className="text-xs leading-5 text-slate-500">{state.loading ? "⏳ " : "✓ "}{state.message}</p>
    {retryable && !state.delivery?.deliveryInProgress && <button type="button" onClick={() => void requestDelivery()} disabled={state.loading} className="mt-2 min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-[#0B1D3A] hover:bg-slate-50 disabled:opacity-50">Coba kirim lagi</button>}
  </div>;
}

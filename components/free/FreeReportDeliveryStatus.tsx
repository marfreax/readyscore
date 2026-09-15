"use client";

import { useEffect, useState } from "react";
import { trackFunnelEvent } from "../../lib/client-funnel";

export default function FreeReportDeliveryStatus({ attemptId }: { attemptId: string }) {
  const [state, setState] = useState<{ loading: boolean; message: string }>({ loading: true, message: "Menyiapkan PDF dan pengiriman…" });

  useEffect(() => {
    let active = true;
    fetch("/api/free/delivery", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId }) })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok) { setState({ loading: false, message: "Free Report sudah terbuka. Pengiriman otomatis belum berhasil dan dapat dicoba lagi." }); return; }
        const delivery = data?.delivery;
        const channels = [delivery?.whatsappStatus === "SENT" ? "WhatsApp" : "", delivery?.emailStatus === "SENT" ? "email" : ""].filter(Boolean);
        if (delivery?.pdfStatus === "GENERATED") trackFunnelEvent("pdf_generated", attemptId);
        if (delivery?.whatsappStatus === "SENT") trackFunnelEvent("whatsapp_sent", attemptId);
        if (delivery?.emailStatus === "SENT") trackFunnelEvent("email_sent", attemptId);
        setState({ loading: false, message: channels.length ? `PDF siap dan sudah dikirim melalui ${channels.join(" dan ")}.` : "PDF siap. Provider WhatsApp/email belum aktif atau pengiriman belum berhasil." });
      })
      .catch(() => { if (active) setState({ loading: false, message: "Free Report sudah terbuka. Pengiriman otomatis belum berhasil." }); });
    return () => { active = false; };
  }, [attemptId]);

  return <p className="mt-4 text-xs leading-5 text-slate-500" aria-live="polite">{state.loading ? "⏳ " : "✓ "}{state.message}</p>;
}

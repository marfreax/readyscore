import { randomUUID } from "node:crypto";
import { prisma } from "./db/prisma";
import { buildFreeReport } from "./free-report";
import { isValidPdfBuffer, renderFreeReportPdf } from "./free-report-pdf";
import type { AssessmentResult } from "./assessment/types";

const WHATSAPP_TIMEOUT_MS = 20_000;
const EMAIL_TIMEOUT_MS = 20_000;
const DELIVERY_LOCK_MS = 90_000;
const MAX_PROVIDER_ERROR_LENGTH = 500;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeWhatsapp(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!/^(?:\+62|62|0)\d{8,13}$/.test(compact)) return null;
  if (compact.startsWith("+62")) return `+62${compact.slice(3)}`;
  if (compact.startsWith("62")) return `+${compact}`;
  return `+62${compact.slice(1)}`;
}

function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function providerError(code: string, status?: number) {
  return new Error(status ? `${code}:${status}` : code);
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw providerError("PROVIDER_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function sendWhatsApp(to: string, pdf: Buffer, fileName: string, name: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v23.0";
  if (!token || !phoneNumberId) throw providerError("WHATSAPP_PROVIDER_NOT_CONFIGURED");

  const normalized = normalizeWhatsapp(to);
  if (!normalized) throw providerError("WHATSAPP_RECIPIENT_INVALID");

  const media = new FormData();
  media.append("messaging_product", "whatsapp");
  media.append("type", "application/pdf");
  media.append(
    "file",
    new Blob([new Uint8Array(pdf).buffer as ArrayBuffer], { type: "application/pdf" }),
    fileName,
  );

  let upload: Response;
  try {
    upload = await fetchWithTimeout(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: media,
        cache: "no-store",
      },
      WHATSAPP_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PROVIDER_TIMEOUT") {
      throw providerError("WHATSAPP_MEDIA_UPLOAD_TIMEOUT");
    }
    throw providerError("WHATSAPP_MEDIA_UPLOAD_NETWORK_FAILED");
  }

  const uploadBody = await upload.json().catch(() => ({}));
  if (!upload.ok || typeof uploadBody.id !== "string") {
    throw providerError("WHATSAPP_MEDIA_UPLOAD_FAILED", upload.status);
  }

  let message: Response;
  try {
    message = await fetchWithTimeout(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: onlyDigits(normalized),
          type: "document",
          document: {
            id: uploadBody.id,
            caption: [
              `Halo ${name}! 👋`,
              "",
              "Terima kasih sudah menyelesaikan Assessment di ReadyScore.",
              "",
              "🎉 Free Report kamu sudah siap!",
              "",
              "Laporan ini berisi gambaran awal tentang profil dirimu, potensi karier, rekomendasi pengembangan, dan rencana aksi 30 hari yang disesuaikan dengan hasil assessment kamu.",
              "",
              "📎 Silakan download Free Report kamu di atas.",
              "",
              "Mau mendapatkan insight yang lebih lengkap? 🚀",
              "",
              "Daftar di ReadyScore dan lanjutkan eksplorasimu untuk mendapatkan:",
              "✅ Akses penuh assessment",
              "✅ Analisis yang lebih mendalam",
              "✅ Rekomendasi karier & skill yang lebih detail",
              "✅ Perkembanganmu dari waktu ke waktu",
              "",
              "👉 Daftar sekarang:",
              "https://app.readyscore.id/register",
              "",
              "Kalau ada pertanyaan, langsung balas pesan ini ya.",
              "Kami siap membantu 😊",
              "",
              "Salam,",
              "Tim ReadyScore",
              "",
              "Know Yourself. Build What's Next.",
            ].join("\n"),
            filename: fileName,
          },
        }),
        cache: "no-store",
      },
      WHATSAPP_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PROVIDER_TIMEOUT") {
      throw providerError("WHATSAPP_MESSAGE_TIMEOUT");
    }
    throw providerError("WHATSAPP_MESSAGE_NETWORK_FAILED");
  }

  if (!message.ok) throw providerError("WHATSAPP_MESSAGE_FAILED", message.status);
}

async function sendEmail(email: string, pdf: Buffer, fileName: string, name: string, attemptId: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.READYSCORE_EMAIL_FROM?.trim();
  if (!key || !from) throw providerError("EMAIL_PROVIDER_NOT_CONFIGURED");

  const normalized = normalizeEmail(email);
  if (!normalized) throw providerError("EMAIL_RECIPIENT_INVALID");

  const safeName = escapeHtml(name);
  const registerUrl = "https://app.readyscore.id/register";
  const subject = "Free Report ReadyScore — Hasilmu Siap";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.7;color:#0B1D3A;max-width:640px;margin:0 auto;padding:24px;">
      <p>Halo <strong>${safeName}</strong>,</p>
      <p>Free Report ReadyScore kamu terlampir.</p>
      <p>Gunakan hasil ini sebagai titik awal eksplorasi untuk memahami dirimu dan pilihan yang ingin kamu dalami.</p>
      <p style="margin:28px 0;">
        <a href="${registerUrl}" style="display:inline-block;background:#0B1D3A;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Lanjutkan eksplorasi di ReadyScore →</a>
      </p>
      <p>Kalau kamu ingin mendapatkan pengalaman dan hasil yang lebih lengkap, kamu bisa melanjutkan eksplorasi di ReadyScore.</p>
      <p>Jika ada yang ingin ditanyakan lebih lanjut, silakan hubungi kami:</p>
      <p>
        WhatsApp: <a href="https://wa.me/6281196962200">+62 811 9696 2200</a><br />
        Email: <a href="mailto:hola@readyscore.id">hola@readyscore.id</a>
      </p>
      <p>Terima kasih,<br /><strong>Tim ReadyScore</strong></p>
    </div>
  `;
  const text = [
    `Halo ${name},`,
    "",
    "Free Report ReadyScore kamu terlampir.",
    "Gunakan hasil ini sebagai titik awal eksplorasi untuk memahami dirimu dan pilihan yang ingin kamu dalami.",
    "",
    `Lanjutkan eksplorasi di ReadyScore: ${registerUrl}`,
    "",
    "Jika ada yang ingin ditanyakan lebih lanjut, silakan hubungi kami:",
    "WhatsApp: +62 811 9696 2200",
    "Email: hola@readyscore.id",
    "",
    "Terima kasih,",
    "Tim ReadyScore",
  ].join("\n");

  let response: Response;
  try {
    response = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `free-report-email/${attemptId}/${normalized}`,
        },
        body: JSON.stringify({
          from,
          to: [normalized],
          subject,
          html,
          text,
          attachments: [{ filename: fileName, content: pdf.toString("base64") }],
        }),
        cache: "no-store",
      },
      EMAIL_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PROVIDER_TIMEOUT") {
      throw providerError("EMAIL_SEND_TIMEOUT");
    }
    throw providerError("EMAIL_SEND_NETWORK_FAILED");
  }

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok || typeof responseBody?.id !== "string") {
    throw providerError("EMAIL_SEND_FAILED", response.status);
  }

  return { providerMessageId: responseBody.id as string };
}

function safeDeliveryError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.slice(0, MAX_PROVIDER_ERROR_LENGTH);
  return /^[A-Z0-9_]+(?::\d{3})?$/.test(message) ? message : fallback;
}

function deliveryResult(
  attemptId: string,
  pdfStatus: string,
  whatsappStatus: string,
  emailStatus: string,
  fileName: string,
  deliveryInProgress = false,
) {
  return { attemptId, pdfStatus, whatsappStatus, emailStatus, fileName, deliveryInProgress };
}

export async function deliverFreeReport(attemptId: string) {
  const record = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { result: true, freeLead: true, freeReportDelivery: true },
  });
  if (
    !record ||
    record.assessmentType !== "FREE" ||
    record.status !== "COMPLETED" ||
    !record.result ||
    !record.freeLead
  ) {
    throw new Error("FREE_REPORT_NOT_READY");
  }

  const report = buildFreeReport(record.result.result as unknown as AssessmentResult);
  const fileName = `readyscore-free-report-${attemptId}.pdf`;
  const delivery = await prisma.freeReportDelivery.upsert({
    where: { attemptId },
    create: { attemptId, lastAttemptAt: new Date() },
    update: {},
  });

  const now = new Date();
  const processingToken = randomUUID();
  const processingUntil = new Date(now.getTime() + DELIVERY_LOCK_MS);
  const claim = await prisma.freeReportDelivery.updateMany({
    where: {
      id: delivery.id,
      OR: [
        { processingUntil: null },
        { processingUntil: { lt: now } },
      ],
    },
    data: {
      processingUntil,
      processingToken,
      lastAttemptAt: now,
    },
  });

  if (claim.count !== 1) {
    const current = await prisma.freeReportDelivery.findUnique({
      where: { id: delivery.id },
      select: { pdfStatus: true, whatsappStatus: true, emailStatus: true },
    });
    return deliveryResult(
      attemptId,
      current?.pdfStatus ?? delivery.pdfStatus,
      current?.whatsappStatus ?? delivery.whatsappStatus,
      current?.emailStatus ?? delivery.emailStatus,
      fileName,
      true,
    );
  }

  try {
    let pdf = delivery.pdfContent ? Buffer.from(delivery.pdfContent) : null;
    if (pdf && !isValidPdfBuffer(pdf)) {
      pdf = null;
      await prisma.freeReportDelivery.update({
        where: { id: delivery.id },
        data: {
          pdfStatus: "FAILED",
          pdfContent: null,
          pdfFileName: null,
          pdfGeneratedAt: null,
        },
      });
    }

    if (!pdf) {
      try {
        pdf = await renderFreeReportPdf(record.freeLead.name, report);
        if (!isValidPdfBuffer(pdf)) throw new Error("PDF_OUTPUT_INVALID");
        await prisma.freeReportDelivery.update({
          where: { id: delivery.id },
          data: {
            pdfStatus: "GENERATED",
            pdfContent: pdf,
            pdfFileName: fileName,
            pdfGeneratedAt: new Date(),
          },
        });
      } catch (error) {
        await prisma.freeReportDelivery.update({ where: { id: delivery.id }, data: { pdfStatus: "FAILED" } });
        throw error;
      }
    } else if (delivery.pdfStatus !== "GENERATED") {
      await prisma.freeReportDelivery.update({
        where: { id: delivery.id },
        data: {
          pdfStatus: "GENERATED",
          pdfFileName: fileName,
          pdfGeneratedAt: delivery.pdfGeneratedAt ?? new Date(),
        },
      });
    }

    let whatsappStatus = delivery.whatsappStatus === "SENT" ? "SENT" : "SKIPPED";
    let whatsappError: string | null = delivery.whatsappStatus === "SENT" ? null : delivery.whatsappError;

    if (delivery.whatsappStatus !== "SENT") {
      try {
        await sendWhatsApp(record.freeLead.whatsapp, pdf, fileName, record.freeLead.name);
        whatsappStatus = "SENT";
        whatsappError = null;
        console.info(`[free-delivery] whatsapp status=SENT attemptId=${attemptId}`);
      } catch (error) {
        whatsappStatus = error instanceof Error && error.message === "WHATSAPP_PROVIDER_NOT_CONFIGURED" ? "SKIPPED" : "FAILED";
        whatsappError = safeDeliveryError(error, "WHATSAPP_DELIVERY_FAILED");
        console.info(`[free-delivery] whatsapp status=${whatsappStatus} attemptId=${attemptId} code=${whatsappError}`);
      }
    }

    let emailStatus = delivery.emailStatus === "SENT" ? "SENT" : "SKIPPED";
    let emailError: string | null = delivery.emailStatus === "SENT" ? null : delivery.emailError;
    if (delivery.emailStatus !== "SENT" && record.freeLead.email) {
      try {
        const result = await sendEmail(record.freeLead.email, pdf, fileName, record.freeLead.name, attemptId);
        emailStatus = "SENT";
        emailError = null;
        console.info(`[free-delivery] email status=SENT attemptId=${attemptId} providerMessageId=${result.providerMessageId}`);
      } catch (error) {
        emailStatus = error instanceof Error && error.message === "EMAIL_PROVIDER_NOT_CONFIGURED" ? "SKIPPED" : "FAILED";
        emailError = safeDeliveryError(error, "EMAIL_DELIVERY_FAILED");
        console.info(`[free-delivery] email status=${emailStatus} attemptId=${attemptId} code=${emailError}`);
      }
    }

    const updated = await prisma.freeReportDelivery.update({
      where: { id: delivery.id },
      data: {
        whatsappStatus,
        whatsappError,
        emailStatus,
        emailError,
        lastAttemptAt: new Date(),
      },
    });

    return deliveryResult(attemptId, updated.pdfStatus, whatsappStatus, emailStatus, fileName);
  } finally {
    await prisma.freeReportDelivery.updateMany({
      where: { id: delivery.id, processingToken },
      data: { processingUntil: null, processingToken: null },
    });
  }
}

export async function getFreeReportPdf(attemptId: string) {
  const delivery = await prisma.freeReportDelivery.findUnique({
    where: { attemptId },
    select: { pdfContent: true, pdfFileName: true, pdfStatus: true },
  });
  if (!delivery?.pdfContent || delivery.pdfStatus !== "GENERATED") return null;
  return {
    bytes: Buffer.from(delivery.pdfContent),
    fileName: delivery.pdfFileName || `readyscore-free-report-${attemptId}.pdf`,
  };
}

import { prisma } from "./db/prisma";
import { buildFreeReport } from "./free-report";
import { renderFreeReportPdf } from "./free-report-pdf";
import type { AssessmentResult } from "./assessment/types";

function onlyDigits(value: string) { return value.replace(/\D/g, ""); }

async function sendWhatsApp(to: string, pdf: Buffer, fileName: string, name: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v23.0";
  if (!token || !phoneNumberId) throw new Error("WHATSAPP_PROVIDER_NOT_CONFIGURED");
  const media = new FormData();
  media.append("messaging_product", "whatsapp");
  media.append("type", "application/pdf");
  media.append("file", new Blob([new Uint8Array(pdf).buffer as ArrayBuffer], { type: "application/pdf" }), fileName);
  const upload = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/media`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: media, cache: "no-store" });
  const uploadBody = await upload.json().catch(() => ({}));
  if (!upload.ok || typeof uploadBody.id !== "string") throw new Error(`WHATSAPP_MEDIA_UPLOAD_FAILED:${upload.status}`);
  const message = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: onlyDigits(to), type: "document", document: { id: uploadBody.id, caption: `Free Report ReadyScore untuk ${name}`, filename: fileName } }), cache: "no-store" });
  if (!message.ok) throw new Error(`WHATSAPP_MESSAGE_FAILED:${message.status}`);
}

async function sendEmail(email: string, pdf: Buffer, fileName: string, name: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.READYSCORE_EMAIL_FROM?.trim();
  if (!key || !from) throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [email], subject: "Free Report ReadyScore", html: `<p>Halo ${name},</p><p>Free Report ReadyScore kamu terlampir.</p><p>Gunakan hasil ini sebagai titik awal eksplorasi.</p>`, attachments: [{ filename: fileName, content: pdf.toString("base64") }] }), cache: "no-store" });
  if (!response.ok) throw new Error(`EMAIL_SEND_FAILED:${response.status}`);
}

export async function deliverFreeReport(attemptId: string) {
  const record = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId }, include: { result: true, freeLead: true, freeReportDelivery: true } });
  if (!record || record.assessmentType !== "FREE" || record.status !== "COMPLETED" || !record.result || !record.freeLead) throw new Error("FREE_REPORT_NOT_READY");
  const report = buildFreeReport(record.result.result as unknown as AssessmentResult);
  const fileName = `readyscore-free-report-${attemptId}.pdf`;
  const delivery = await prisma.freeReportDelivery.upsert({ where: { attemptId }, create: { attemptId, lastAttemptAt: new Date() }, update: { lastAttemptAt: new Date() } });
  let pdf = delivery.pdfContent ? Buffer.from(delivery.pdfContent) : null;
  if (!pdf) {
    try {
      pdf = await renderFreeReportPdf(record.freeLead.name, report);
      await prisma.freeReportDelivery.update({ where: { id: delivery.id }, data: { pdfStatus: "GENERATED", pdfContent: pdf, pdfFileName: fileName, pdfGeneratedAt: new Date() } });
    } catch (error) {
      await prisma.freeReportDelivery.update({ where: { id: delivery.id }, data: { pdfStatus: "FAILED" } });
      throw error;
    }
  } else if (delivery.pdfStatus !== "GENERATED") {
    await prisma.freeReportDelivery.update({ where: { id: delivery.id }, data: { pdfStatus: "GENERATED", pdfFileName: fileName, pdfGeneratedAt: delivery.pdfGeneratedAt ?? new Date() } });
  }

  let whatsappStatus = "SKIPPED";
  let whatsappError: string | null = null;
  if (delivery.whatsappStatus === "SENT") { whatsappStatus = "SENT"; }
  else {
    try { await sendWhatsApp(record.freeLead.whatsapp, pdf, fileName, record.freeLead.name); whatsappStatus = "SENT"; }
    catch (error) { whatsappStatus = error instanceof Error && error.message === "WHATSAPP_PROVIDER_NOT_CONFIGURED" ? "SKIPPED" : "FAILED"; whatsappError = error instanceof Error ? error.message.slice(0, 500) : "WHATSAPP_FAILED"; }
  }

  let emailStatus = "SKIPPED";
  let emailError: string | null = null;
  if (record.freeLead.email) {
    if (delivery.emailStatus === "SENT") emailStatus = "SENT";
    else {
      try { await sendEmail(record.freeLead.email, pdf, fileName, record.freeLead.name); emailStatus = "SENT"; }
      catch (error) { emailStatus = error instanceof Error && error.message === "EMAIL_PROVIDER_NOT_CONFIGURED" ? "SKIPPED" : "FAILED"; emailError = error instanceof Error ? error.message.slice(0, 500) : "EMAIL_FAILED"; }
    }
  }
  const updated = await prisma.freeReportDelivery.update({ where: { id: delivery.id }, data: { whatsappStatus, whatsappError, emailStatus, emailError, lastAttemptAt: new Date() } });
  return { attemptId, pdfStatus: updated.pdfStatus, whatsappStatus, emailStatus, fileName };
}

export async function getFreeReportPdf(attemptId: string) {
  const delivery = await prisma.freeReportDelivery.findUnique({ where: { attemptId }, select: { pdfContent: true, pdfFileName: true, pdfStatus: true } });
  if (!delivery?.pdfContent || delivery.pdfStatus !== "GENERATED") return null;
  return { bytes: Buffer.from(delivery.pdfContent), fileName: delivery.pdfFileName || `readyscore-free-report-${attemptId}.pdf` };
}

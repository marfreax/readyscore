import { checkV16RateLimit } from "../../../../../lib/v16-rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db/prisma";
import { buildFreeReport } from "../../../../../lib/free-report";
import { getFreeReportPdf } from "../../../../../lib/free-delivery";
import { renderFreeReportPdf } from "../../../../../lib/free-report-pdf";
import type { AssessmentResult } from "../../../../../lib/assessment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rate = checkV16RateLimit(`pdf:${ip}`, 20);
  if (!rate.allowed) return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED" } }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds ?? 60) } });
  const attemptId = new URL(request.url).searchParams.get("attemptId")?.trim();
  if (!attemptId) return NextResponse.json({ ok: false, error: { code: "INVALID_ATTEMPT" } }, { status: 400 });
  const ready = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId }, include: { result: true, freeLead: true } });
  if (!ready || ready.assessmentType !== "FREE" || ready.status !== "COMPLETED" || !ready.result || !ready.freeLead) return NextResponse.json({ ok: false, error: { code: "FREE_REPORT_NOT_READY" } }, { status: 404 });

  let stored = await getFreeReportPdf(attemptId);
  if (!stored) {
    const pdf = await renderFreeReportPdf(ready.freeLead.name, buildFreeReport(ready.result.result as unknown as AssessmentResult));
    const fileName = `readyscore-free-report-${attemptId}.pdf`;
    await prisma.freeReportDelivery.upsert({ where: { attemptId }, create: { attemptId, pdfStatus: "GENERATED", pdfContent: pdf, pdfFileName: fileName, pdfGeneratedAt: new Date(), lastAttemptAt: new Date() }, update: { pdfStatus: "GENERATED", pdfContent: pdf, pdfFileName: fileName, pdfGeneratedAt: new Date(), lastAttemptAt: new Date() } });
    stored = { bytes: pdf, fileName };
  }
  return new NextResponse(new Uint8Array(stored.bytes), { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${stored.fileName}"`, "Cache-Control": "private, no-store" } });
}

import { checkV16RateLimit } from "../../../../lib/v16-rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db/prisma";
import { buildFreeReport } from "../../../../lib/free-report";
import type { AssessmentResult } from "../../../../lib/assessment/types";
import { createOrUpdateBusinessLead, BUSINESS_LEAD_SOURCE } from "../../../../lib/business-lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeWhatsapp(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!/^(?:\+62|62|0)\d{8,13}$/.test(compact)) return null;
  if (compact.startsWith("+62")) return `+62${compact.slice(3)}`;
  if (compact.startsWith("62")) return `+${compact}`;
  return `+62${compact.slice(1)}`;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

async function getFreeAttempt(attemptId: string) {
  return prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { result: true, freeLead: true },
  });
}

export async function GET(request: Request) {
  const attemptId = new URL(request.url).searchParams.get("attemptId")?.trim();
  if (!attemptId) return NextResponse.json({ ok: false, error: { code: "INVALID_ATTEMPT", message: "Attempt tidak valid." } }, { status: 400 });
  const attempt = await getFreeAttempt(attemptId);
  if (!attempt || attempt.assessmentType !== "FREE" || attempt.status !== "COMPLETED" || !attempt.result) {
    return NextResponse.json({ ok: false, error: { code: "FREE_RESULT_NOT_FOUND", message: "Hasil free assessment tidak ditemukan." } }, { status: 404 });
  }
  if (!attempt.freeLead) return NextResponse.json({ ok: true, unlocked: false });
  return NextResponse.json({
    ok: true,
    unlocked: true,
    report: buildFreeReport(attempt.result.result as unknown as AssessmentResult),
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rate = checkV16RateLimit(`free:${ip}`, 30);
  if (!rate.allowed) return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED" } }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds ?? 60) } });
  try {
    const body = (await request.json().catch(() => ({}))) as { attemptId?: unknown; name?: unknown; whatsapp?: unknown; email?: unknown; consent?: unknown; source?: unknown };
    const attemptId = typeof body.attemptId === "string" ? body.attemptId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    const whatsapp = typeof body.whatsapp === "string" ? normalizeWhatsapp(body.whatsapp) : null;
    const email = normalizeEmail(body.email);
    const source = typeof body.source === "string" && body.source.trim() ? body.source.trim().slice(0, 120) : null;

    if (!attemptId) return NextResponse.json({ ok: false, error: { code: "INVALID_ATTEMPT", message: "Attempt tidak valid." } }, { status: 400 });
    if (name.length < 2 || name.length > 100) return NextResponse.json({ ok: false, error: { code: "INVALID_NAME", message: "Nama harus 2–100 karakter." } }, { status: 400 });
    if (!whatsapp) return NextResponse.json({ ok: false, error: { code: "INVALID_WHATSAPP", message: "Nomor WhatsApp tidak valid." } }, { status: 400 });
    if (body.email !== undefined && body.email !== null && body.email !== "" && !email) return NextResponse.json({ ok: false, error: { code: "INVALID_EMAIL", message: "Format email tidak valid." } }, { status: 400 });
    if (body.consent !== true) return NextResponse.json({ ok: false, error: { code: "CONSENT_REQUIRED", message: "Persetujuan WhatsApp diperlukan untuk membuka Free Report." } }, { status: 400 });

    const attempt = await getFreeAttempt(attemptId);
    if (!attempt || attempt.assessmentType !== "FREE" || attempt.status !== "COMPLETED" || !attempt.result) {
      return NextResponse.json({ ok: false, error: { code: "FREE_RESULT_NOT_FOUND", message: "Hasil free assessment tidak ditemukan." } }, { status: 404 });
    }

    const now = new Date();
    const lead = await prisma.freeLeadCapture.upsert({
      where: { attemptId },
      create: { attemptId, name, whatsapp, email, consent: true, consentAt: now, source, reportUnlockedAt: now },
      update: { name, whatsapp, email, consent: true, consentAt: now, source, reportUnlockedAt: now },
    });

    let businessLead: Awaited<ReturnType<typeof createOrUpdateBusinessLead>> | null = null;
    let businessLeadError: string | null = null;
    try {
      businessLead = await createOrUpdateBusinessLead({
        name,
        whatsapp,
        email,
        consent: true,
        consentAt: lead.consentAt,
        assessmentAttemptId: attemptId,
      });
      await prisma.freeLeadCapture.update({
        where: { id: lead.id },
        data: { businessLeadId: businessLead.lead.id },
      });
      await prisma.funnelEvent.create({
        data: {
          event: businessLead.action === "CREATED" ? "business_lead_created" : "business_lead_reused",
          attemptId,
          metadata: { source: BUSINESS_LEAD_SOURCE },
        },
      });
    } catch (error) {
      businessLeadError = error instanceof Error ? error.message : "BUSINESS_LEAD_FAILED";
      console.error(`[free-unlock] business lead failed code=${businessLeadError} attemptId=${attemptId}`);
      try {
        await prisma.funnelEvent.create({
          data: {
            event: "business_lead_failed",
            attemptId,
            metadata: { source: BUSINESS_LEAD_SOURCE, code: businessLeadError },
          },
        });
      } catch {
        // Analytics are best-effort and must never block Free Report access.
      }
    }

    return NextResponse.json({
      ok: true,
      unlocked: true,
      report: buildFreeReport(attempt.result.result as unknown as AssessmentResult),
      businessLead: businessLead
        ? { id: businessLead.lead.id, action: businessLead.action, status: businessLead.lead.status, source: businessLead.lead.source }
        : { status: "FAILED", source: BUSINESS_LEAD_SOURCE, error: businessLeadError },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Free Report gagal dibuka." } }, { status: 500 });
  }
}

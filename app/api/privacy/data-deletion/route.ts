import { NextResponse } from "next/server";
import { createDataDeletionRequest } from "../../../../lib/privacy/data-deletion";
import { createHash } from "node:crypto";
import { checkPasswordResetRateLimit } from "../../../../lib/auth/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
    const ipKey = `privacy-deletion-ip:${createHash("sha256").update(forwarded).digest("hex")}`;
    const body = await request.json() as { name?: unknown; email?: unknown; reason?: unknown };
    if (typeof body.email !== "string") return NextResponse.json({ ok: false, error: { code: "INVALID_EMAIL" } }, { status: 400 });
    const emailKey = `privacy-deletion-email:${createHash("sha256").update(body.email.trim().toLowerCase()).digest("hex")}`;
    const limit = checkPasswordResetRateLimit([ipKey, emailKey]);
    if (!limit.allowed) return NextResponse.json({ ok: true, message: "Permintaan telah diterima. Silakan tunggu sebelum mengirim permintaan berikutnya." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    const result = await createDataDeletionRequest({ name: typeof body.name === "string" ? body.name : undefined, email: body.email, reason: typeof body.reason === "string" ? body.reason : undefined });
    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "DATA_DELETION_REQUEST_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "INVALID_EMAIL" ? 400 : 500 });
  }
}

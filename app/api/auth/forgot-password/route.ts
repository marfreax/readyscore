import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { requestPasswordReset, PASSWORD_RESET_GENERIC_MESSAGE } from "../../../../lib/auth/password-recovery";
import { checkPasswordResetRateLimit } from "../../../../lib/auth/rate-limit";
import { recordAuthenticationAudit } from "../../../../lib/auth/audit";

export const runtime = "nodejs";

function requestOrigin(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}
function fingerprint(value: string) { return createHash("sha256").update(value, "utf8").digest("hex"); }
async function safeAudit(metadata: Record<string, string | number | boolean | null>) {
  try { await recordAuthenticationAudit({ action: "PASSWORD_RESET_REJECTED", metadata }); }
  catch (error) { console.error("AUTH_AUDIT_WRITE_FAILED", error instanceof Error ? error.message : "unknown"); }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const ipKey = `ip:${fingerprint(requestOrigin(request))}`;
    const emailKey = email ? `email:${fingerprint(email)}` : "email:invalid";
    const limit = checkPasswordResetRateLimit([ipKey, emailKey]);
    if (!limit.allowed) {
      await safeAudit({ reason: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds });
      return NextResponse.json({ ok: true, message: PASSWORD_RESET_GENERIC_MESSAGE }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    }
    if (typeof body.email !== "string" || body.email.length > 320) {
      return NextResponse.json({ ok: true, message: PASSWORD_RESET_GENERIC_MESSAGE });
    }
    return NextResponse.json(await requestPasswordReset(body.email));
  } catch (error) {
    const code = error instanceof Error ? error.message : "PASSWORD_RESET_REQUEST_FAILED";
    if (code === "PASSWORD_RESET_EMAIL_NOT_CONFIGURED" || code === "APP_BASE_URL_NOT_CONFIGURED" || code === "PASSWORD_RESET_EMAIL_DELIVERY_FAILED") {
      return NextResponse.json({ ok: false, error: { code: "PASSWORD_RESET_SERVICE_UNAVAILABLE" } }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: { code: "PASSWORD_RESET_REQUEST_FAILED" } }, { status: 500 });
  }
}

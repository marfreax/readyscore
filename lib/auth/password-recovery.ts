import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { findUserByEmail } from "./store";
import { passwordResetExpiryMinutes, sendPasswordResetEmail } from "./password-recovery-email";
import { recordAuthenticationAudit } from "./audit";

export const PASSWORD_RESET_GENERIC_MESSAGE = "Jika email tersebut terdaftar, instruksi reset password telah dikirim.";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function appBaseUrl() {
  const value = process.env.APP_BASE_URL?.trim();
  if (!value) {
    if (process.env.NODE_ENV === "production") throw new Error("APP_BASE_URL_NOT_CONFIGURED");
    return "http://localhost:3000";
  }
  return value.replace(/\/$/, "");
}

async function safeAudit(input: Parameters<typeof recordAuthenticationAudit>[0]) {
  try { await recordAuthenticationAudit(input); } catch (error) {
    console.error("AUTH_AUDIT_WRITE_FAILED", error instanceof Error ? error.message : "unknown");
  }
}

export async function requestPasswordReset(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email || !email.includes("@") || email.length > 254) {
    await safeAudit({ action: "PASSWORD_RESET_REJECTED" });
    return { ok: true, message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  const dbUser = await prisma.user.findUnique({ where: { email } });
  const authUser = findUserByEmail(email);
  const user = dbUser ?? (authUser ? { id: authUser.id, email: authUser.email, status: authUser.status } : null);

  if (!user || user.status !== "ACTIVE") {
    await safeAudit({ action: "PASSWORD_RESET_REQUESTED", targetUserId: user?.id ?? null, metadata: { eligible: false } });
    return { ok: true, message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  await safeAudit({ action: "PASSWORD_RESET_REQUESTED", targetUserId: user.id, metadata: { eligible: true } });

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + passwordResetExpiryMinutes() * 60_000);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  const resetUrl = `${appBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  try {
    await sendPasswordResetEmail({ email: user.email, resetUrl, expiresAt });
  } catch (error) {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
    throw error;
  }

  return { ok: true, message: PASSWORD_RESET_GENERIC_MESSAGE };
}

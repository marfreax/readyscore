import { createHash } from "node:crypto";
import { prisma } from "../db/prisma";
import { hashPassword, upsertUserRecord } from "./store";
import { recordAuthenticationAudit } from "./audit";

export const PASSWORD_RESET_INVALID_MESSAGE = "Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link reset password baru.";
export const PASSWORD_RESET_SUCCESS_MESSAGE = "Password berhasil diubah. Silakan login kembali.";

function hashResetToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function normalizeToken(value: string) {
  return value.trim();
}

function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT");
  if (password !== confirmation) throw new Error("PASSWORD_CONFIRMATION_MISMATCH");
}

async function safeAudit(input: Parameters<typeof recordAuthenticationAudit>[0]) {
  try { await recordAuthenticationAudit(input); } catch (error) {
    console.error("AUTH_AUDIT_WRITE_FAILED", error instanceof Error ? error.message : "unknown");
  }
}

export async function resetPassword(input: { token: string; password: string; confirmation: string }) {
  const token = normalizeToken(input.token);
  if (!token || token.length > 256) {
    await safeAudit({ action: "PASSWORD_RESET_REJECTED", metadata: { reason: "malformed_token" } });
    throw new Error("INVALID_RESET_TOKEN");
  }
  try { validateNewPassword(input.password, input.confirmation); } catch (error) {
    await safeAudit({ action: "PASSWORD_RESET_REJECTED", metadata: { reason: error instanceof Error ? error.message : "invalid_password" } });
    throw error;
  }

  const tokenHash = hashResetToken(token);
  const now = new Date();
  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!reset || reset.usedAt || reset.expiresAt <= now || reset.user.status !== "ACTIVE") {
    await safeAudit({ action: "PASSWORD_RESET_REJECTED", targetUserId: reset?.userId ?? null, metadata: { reason: !reset ? "invalid_token" : reset.usedAt ? "consumed_token" : reset.expiresAt <= now ? "expired_token" : "inactive_account" } });
    throw new Error("INVALID_RESET_TOKEN");
  }

  const newPasswordHash = hashPassword(input.password);

  await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: {
        id: reset.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) throw new Error("INVALID_RESET_TOKEN");

    const updated = await tx.user.updateMany({
      where: { id: reset.userId, status: "ACTIVE" },
      data: { passwordHash: newPasswordHash },
    });
    if (updated.count !== 1) throw new Error("INVALID_RESET_TOKEN");

    await tx.passwordResetToken.deleteMany({
      where: { userId: reset.userId, usedAt: null },
    });
  });

  // The current authentication architecture keeps a local credential store
  // alongside PostgreSQL. Hydrate the exact DB identity after the atomic DB
  // mutation so subsequent local-store login checks use the new credential.
  upsertUserRecord({
    id: reset.user.id,
    name: reset.user.name,
    email: reset.user.email,
    passwordHash: newPasswordHash,
    role: reset.user.role,
    status: reset.user.status,
    createdAt: reset.user.createdAt.toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await safeAudit({ action: "PASSWORD_RESET_SUCCEEDED", actorUserId: reset.userId, targetUserId: reset.userId });
  return { ok: true, message: PASSWORD_RESET_SUCCESS_MESSAGE };
}

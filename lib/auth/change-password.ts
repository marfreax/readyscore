import { prisma } from "../db/prisma";
import { hashPassword, upsertUserRecord, verifyPassword } from "./store";
import { recordAuthenticationAudit } from "./audit";

export const CHANGE_PASSWORD_SUCCESS_MESSAGE = "Password berhasil diubah.";
export const CHANGE_PASSWORD_INVALID_CURRENT_MESSAGE = "Password saat ini salah.";
export const CHANGE_PASSWORD_CONFIRMATION_MESSAGE = "Konfirmasi password tidak sama.";
export const CHANGE_PASSWORD_TOO_SHORT_MESSAGE = "Password minimal 8 karakter.";
export const CHANGE_PASSWORD_AUTH_REQUIRED_MESSAGE = "Login diperlukan untuk mengubah password.";

function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT");
  if (password !== confirmation) throw new Error("PASSWORD_CONFIRMATION_MISMATCH");
}

async function safeAudit(input: Parameters<typeof recordAuthenticationAudit>[0]) {
  try { await recordAuthenticationAudit(input); } catch (error) {
    console.error("AUTH_AUDIT_WRITE_FAILED", error instanceof Error ? error.message : "unknown");
  }
}

export async function changePassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  if (!input.userId) { await safeAudit({ action: "PASSWORD_CHANGED", metadata: { outcome: "rejected_auth_required" } }); throw new Error("AUTH_REQUIRED"); }
  if (!input.currentPassword || !input.newPassword || !input.confirmNewPassword) {
    throw new Error("INVALID_INPUT");
  }

  validateNewPassword(input.newPassword, input.confirmNewPassword);

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user || user.status !== "ACTIVE") { await safeAudit({ action: "PASSWORD_CHANGED", actorUserId: input.userId, targetUserId: input.userId, metadata: { outcome: "rejected_inactive_or_missing" } }); throw new Error("AUTH_REQUIRED"); }

  if (!verifyPassword(input.currentPassword, user.passwordHash)) {
    await safeAudit({ action: "PASSWORD_CHANGED", actorUserId: user.id, targetUserId: user.id, metadata: { outcome: "rejected_current_password" } });
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const newPasswordHash = hashPassword(input.newPassword);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: user.id,
        status: "ACTIVE",
        passwordHash: user.passwordHash,
      },
      data: { passwordHash: newPasswordHash },
    });

    if (updated.count !== 1) throw new Error("INVALID_CURRENT_PASSWORD");
  });

  // The current authentication architecture has DB User state plus a local
  // auth-state store. Keep both credential representations synchronized after
  // the authoritative DB mutation. Session semantics remain unchanged in V12.3.
  upsertUserRecord({
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: newPasswordHash,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: now.toISOString(),
  });

  await safeAudit({ action: "PASSWORD_CHANGED", actorUserId: user.id, targetUserId: user.id, metadata: { outcome: "succeeded" } });
  return { ok: true, message: CHANGE_PASSWORD_SUCCESS_MESSAGE };
}

import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { hashPassword } from "../auth/store";

export const DATA_DELETION_GENERIC_MESSAGE = "Permintaan penghapusan data telah diterima. Jika data tersebut terkait akun ReadyScore, kami akan melakukan verifikasi kepemilikan sebelum memprosesnya.";

export async function createDataDeletionRequest(input: { name?: string; email: string; reason?: string }) {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 320) throw new Error("INVALID_EMAIL");
  const name = input.name?.trim().slice(0, 200) || null;
  const reason = input.reason?.trim().slice(0, 1000) || null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, status: true } });
  const existing = user ? await prisma.dataDeletionRequest.findFirst({ where: { userId: user.id, status: { in: ["REQUESTED", "PROCESSING"] } }, orderBy: { requestedAt: "desc" } }) : null;
  if (existing) return { ok: true, message: DATA_DELETION_GENERIC_MESSAGE, requestId: existing.id };
  const request = await prisma.dataDeletionRequest.create({ data: { userId: user?.id ?? null, emailSnapshot: email, nameSnapshot: name ?? user?.name ?? null, reason } });
  return { ok: true, message: DATA_DELETION_GENERIC_MESSAGE, requestId: request.id };
}

export async function listDataDeletionRequests() {
  return prisma.dataDeletionRequest.findMany({ orderBy: { requestedAt: "desc" }, take: 100, select: { id: true, userId: true, emailSnapshot: true, nameSnapshot: true, reason: true, status: true, requestedAt: true, processedAt: true, processingNotes: true } });
}

export async function processDataDeletionRequest(input: { requestId: string; adminUserId: string; notes?: string }) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.dataDeletionRequest.findUnique({ where: { id: input.requestId } });
    if (!request) throw new Error("DATA_DELETION_REQUEST_NOT_FOUND");
    if (request.status === "COMPLETED") return request;
    await tx.dataDeletionRequest.update({ where: { id: request.id }, data: { status: "PROCESSING", processingNotes: input.notes?.trim() || null } });
    if (!request.userId) {
      return tx.dataDeletionRequest.update({ where: { id: request.id }, data: { status: "REJECTED", processedAt: new Date(), processedBy: input.adminUserId, processingNotes: input.notes?.trim() || "No matching ReadyScore account found; request requires external/manual verification." } });
    }
    const user = await tx.user.findUnique({ where: { id: request.userId }, select: { id: true, email: true, name: true, status: true } });
    if (!user) throw new Error("ACCOUNT_NOT_FOUND");
    const token = randomBytes(12).toString("hex");
    const anonymizedEmail = `deleted-${user.id}-${token}@deleted.readyscore.id`;
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const subjects = await tx.subjectProfile.findMany({ where: { accountId: user.id }, select: { id: true, type: true } });
    await tx.subjectProfile.updateMany({ where: { accountId: user.id }, data: { name: "Deleted Profile" } });
    for (const [index, subject] of subjects.entries()) {
      await tx.subjectProfile.update({ where: { id: subject.id }, data: { name: subject.type === "OWNER" ? "Deleted Profile" : `Deleted Profile ${index + 1}` } });
    }
    await tx.user.update({ where: { id: user.id }, data: { name: "Deleted User", email: anonymizedEmail, passwordHash: hashPassword(randomBytes(32).toString("hex")), status: "INACTIVE" } });
    await tx.adminContentAuditEvent.create({ data: { entityType: "DATA_DELETION", entityId: request.id, action: "ACCOUNT_ANONYMIZED", actorUserId: input.adminUserId, metadata: { targetUserId: user.id, historicalRecordsPreserved: true, sessionsRevoked: true, authenticationDataRemoved: true, personalIdentityAnonymized: true } } });
    return tx.dataDeletionRequest.update({ where: { id: request.id }, data: { status: "COMPLETED", processedAt: new Date(), processedBy: input.adminUserId, processingNotes: input.notes?.trim() || "Account deactivated and application identity fields anonymized; required historical records preserved." } });
  });
}

import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

type Tx = Prisma.TransactionClient;

export async function reserveInvitationCredit(tx: Tx, organizationId: string, invitationId: string, now = new Date()) {
  const existing = await tx.clientInvitationCreditReservation.findUnique({ where: { invitationId } });
  if (existing) {
    if (existing.status === "RESERVED" || existing.status === "CONSUMED") return existing;
    const lots = await tx.clientOrganizationCreditLot.findMany({ where: { organizationId, expiresAt: { gt: now }, remainingCredits: { gt: 0 } }, orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }] });
    for (const lot of lots) {
      const updated = await tx.clientOrganizationCreditLot.updateMany({ where: { id: lot.id, remainingCredits: { gt: 0 }, expiresAt: { gt: now } }, data: { remainingCredits: { decrement: 1 } } });
      if (updated.count !== 1) continue;
      return tx.clientInvitationCreditReservation.update({ where: { id: existing.id }, data: { status: "RESERVED", creditLotId: lot.id, reservationVersion: { increment: 1 } } });
    }
    throw new Error("CORPORATE_CREDIT_INSUFFICIENT");
  }
  const lots = await tx.clientOrganizationCreditLot.findMany({ where: { organizationId, expiresAt: { gt: now }, remainingCredits: { gt: 0 } }, orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }] });
  for (const lot of lots) {
    const updated = await tx.clientOrganizationCreditLot.updateMany({ where: { id: lot.id, remainingCredits: { gt: 0 }, expiresAt: { gt: now } }, data: { remainingCredits: { decrement: 1 } } });
    if (updated.count !== 1) continue;
    return tx.clientInvitationCreditReservation.create({ data: { organizationId, invitationId, creditLotId: lot.id } });
  }
  throw new Error("CORPORATE_CREDIT_INSUFFICIENT");
}

export async function releaseExpiredInvitationCredits(organizationId: string, now = new Date()) {
  const expired = await prisma.clientInvitationCreditReservation.findMany({
    where: { organizationId, status: "RESERVED", invitation: { expiresAt: { lte: now }, status: { not: "COMPLETED" } } },
    select: { invitationId: true },
  });
  for (const item of expired) await releaseInvitationCredit(item.invitationId, "INVITATION_EXPIRED");
  return expired.length;
}

export async function consumeInvitationCredit(invitationId: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.clientInvitationCreditReservation.findUnique({ where: { invitationId } });
    if (!reservation) return { legacy: true, consumed: false };
    if (reservation.status === "CONSUMED") return { legacy: false, consumed: false };
    if (reservation.status !== "RESERVED") throw new Error("CORPORATE_CREDIT_RESERVATION_UNAVAILABLE");
    const claimed = await tx.clientInvitationCreditReservation.updateMany({ where: { id: reservation.id, status: "RESERVED" }, data: { status: "CONSUMED" } });
    if (claimed.count !== 1) throw new Error("CORPORATE_CREDIT_RESERVATION_UNAVAILABLE");
    await tx.clientOrganizationCreditLedger.create({
      data: { organizationId: reservation.organizationId, invitationId, entryType: "ASSESSMENT_CONSUMED", creditsDelta: -1, idempotencyKey: `INVITATION:${invitationId}:CONSUMED:${reservation.reservationVersion}` },
    });
    return { legacy: false, consumed: true };
  }, { isolationLevel: "Serializable" });
}

export async function releaseInvitationCredit(invitationId: string, reason = "INVITATION_RELEASED") {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.clientInvitationCreditReservation.findUnique({ where: { invitationId } });
    if (!reservation || reservation.status === "RELEASED") return false;
    const claimed = await tx.clientInvitationCreditReservation.updateMany({ where: { id: reservation.id, status: reservation.status }, data: { status: "RELEASED" } });
    if (claimed.count !== 1) return false;
    await tx.clientOrganizationCreditLot.update({ where: { id: reservation.creditLotId }, data: { remainingCredits: { increment: 1 } } });
    await tx.clientOrganizationCreditLedger.create({
      data: {
        organizationId: reservation.organizationId,
        invitationId,
        entryType: reservation.status === "CONSUMED" ? "ASSESSMENT_REFUND" : "MANUAL_ADJUSTMENT",
        creditsDelta: 1,
        idempotencyKey: `INVITATION:${invitationId}:RELEASED:${reservation.reservationVersion}`,
        metadata: { reason },
      },
    });
    return true;
  }, { isolationLevel: "Serializable" });
}

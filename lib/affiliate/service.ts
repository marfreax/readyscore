import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "../db/prisma";

export const AFFILIATE_REFERRAL_COOKIE = "readyscore_affiliate_ref";
export const AFFILIATE_REFERRAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateAffiliateCommission(amountIdr: number, rateBps: number) {
  if (!Number.isSafeInteger(amountIdr) || amountIdr < 0 || !Number.isSafeInteger(rateBps) || rateBps <= 0 || rateBps > 10000) throw new Error("INVALID_AFFILIATE_COMMISSION_INPUT");
  return Math.floor(amountIdr * rateBps / 10000);
}

export async function captureAffiliateReferral(codeInput: unknown, now = new Date()) {
  const code = typeof codeInput === "string" ? codeInput.trim().toUpperCase() : "";
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) return false;
  const profile = await prisma.affiliateProfile.findFirst({ where: { referralCode: code, status: "ACTIVE" }, select: { id: true } });
  if (!profile) return false;
  const jar = await cookies();
  if (jar.get(AFFILIATE_REFERRAL_COOKIE)?.value) return false;
  jar.set(AFFILIATE_REFERRAL_COOKIE, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(now.getTime() + AFFILIATE_REFERRAL_DAYS * DAY_MS),
  });
  return true;
}

export async function resolveAffiliateForBuyer(userId: string, explicitCode?: unknown, now = new Date()) {
  const existing = await prisma.affiliateAttribution.findUnique({ where: { buyerUserId: userId }, include: { affiliate: { select: { commissionRateBps: true, status: true } } } });
  if (existing && existing.expiresAt > now) return existing.affiliate.status === "ACTIVE" ? { affiliateId: existing.affiliateId, referralCode: existing.sourceCode, rateBps: existing.affiliate.commissionRateBps } : null;
  const jar = await cookies();
  const code = (typeof explicitCode === "string" ? explicitCode.trim() : "") || jar.get(AFFILIATE_REFERRAL_COOKIE)?.value || "";
  if (!code) return null;
  const profile = await prisma.affiliateProfile.findFirst({ where: { referralCode: code.toUpperCase(), status: "ACTIVE", userId: { not: userId } }, select: { id: true, referralCode: true, commissionRateBps: true } });
  if (!profile || profile.commissionRateBps <= 0 || profile.commissionRateBps > 10000) return null;
  if (existing) {
    await prisma.affiliateAttribution.delete({ where: { id: existing.id } });
  }
  await prisma.affiliateAttribution.create({
    data: { buyerUserId: userId, affiliateId: profile.id, sourceCode: profile.referralCode, attributedAt: now, expiresAt: new Date(now.getTime() + AFFILIATE_REFERRAL_DAYS * DAY_MS) },
  }).catch(async (error) => {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return;
    throw error;
  });
  const locked = await prisma.affiliateAttribution.findUnique({ where: { buyerUserId: userId }, include: { affiliate: { select: { commissionRateBps: true } } } });
  if (!locked || locked.expiresAt <= now) return null;
  return { affiliateId: locked.affiliateId, referralCode: locked.sourceCode, rateBps: locked.affiliate.commissionRateBps };
}

export async function createAffiliateProfile(userId: string) {
  const existing = await prisma.affiliateProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  for (let tries = 0; tries < 5; tries += 1) {
    const referralCode = `RS${randomBytes(5).toString("hex").toUpperCase()}`;
    try {
      return await prisma.$transaction(async (tx) => {
        const profile = await tx.affiliateProfile.create({ data: { userId, referralCode } });
        await tx.adminContentAuditEvent.create({ data: { entityType: "AFFILIATE_PROFILE", entityId: profile.id, action: "AFFILIATE_PROFILE_CREATED", actorUserId: userId, metadata: { referralCode, commissionRateBps: profile.commissionRateBps } } });
        return profile;
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        const raced = await prisma.affiliateProfile.findUnique({ where: { userId } });
        if (raced) return raced;
        continue;
      }
      throw error;
    }
  }
  throw new Error("AFFILIATE_CODE_GENERATION_FAILED");
}

export async function unlockAffiliateCommissions(affiliateId: string, now = new Date()) {
  const result = await prisma.affiliateLedgerEntry.updateMany({
    where: { affiliateId, status: "PENDING", entryType: "COMMISSION", availableAt: { lte: now } },
    data: { status: "AVAILABLE" },
  });
  return result.count;
}

export async function getAffiliateSummary(userId: string, now = new Date()) {
  const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  await unlockAffiliateCommissions(profile.id, now);
  const [entries, referrals, payouts] = await Promise.all([
    prisma.affiliateLedgerEntry.findMany({ where: { affiliateId: profile.id }, orderBy: { createdAt: "desc" }, take: 100, include: { order: { select: { orderNumber: true, productNameSnapshot: true, totalAmountIdr: true, paymentStatus: true } }, payout: { select: { id: true, status: true, amountIdr: true } } } }),
    prisma.affiliateAttribution.count({ where: { affiliateId: profile.id } }),
    prisma.affiliatePayoutRequest.findMany({ where: { affiliateId: profile.id }, orderBy: { requestedAt: "desc" }, take: 30 }),
  ]);
  const [available, pending] = await Promise.all([
    prisma.affiliateLedgerEntry.aggregate({ where: { affiliateId: profile.id, status: { in: ["AVAILABLE", "SETTLED"] } }, _sum: { amountIdr: true } }),
    prisma.affiliateLedgerEntry.aggregate({ where: { affiliateId: profile.id, status: "PENDING" }, _sum: { amountIdr: true } }),
  ]);
  return { profile, referrals, entries, payouts, availableBalanceIdr: available._sum.amountIdr ?? 0, pendingBalanceIdr: pending._sum.amountIdr ?? 0 };
}

export async function requestAffiliatePayout(userId: string, amountInput: unknown) {
  const amountIdr = Number(amountInput);
  if (!Number.isSafeInteger(amountIdr) || amountIdr <= 0) throw new Error("INVALID_PAYOUT_AMOUNT");
  const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
  if (!profile || profile.status !== "ACTIVE") throw new Error("AFFILIATE_NOT_ACTIVE");
  if (!profile.payoutBankName || !profile.payoutAccountName || !profile.payoutAccountNumber) throw new Error("PAYOUT_DETAILS_REQUIRED");
  await unlockAffiliateCommissions(profile.id);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "AffiliateProfile" WHERE "id" = ${profile.id} FOR UPDATE`;
    const total = await tx.affiliateLedgerEntry.aggregate({ where: { affiliateId: profile.id, status: { in: ["AVAILABLE", "SETTLED"] } }, _sum: { amountIdr: true } });
    const available = total._sum.amountIdr ?? 0;
    if (amountIdr > available) throw new Error("INSUFFICIENT_AFFILIATE_BALANCE");
    const payout = await tx.affiliatePayoutRequest.create({ data: { affiliateId: profile.id, requestedByUserId: userId, amountIdr } });
    await tx.affiliateLedgerEntry.create({
      data: { affiliateId: profile.id, payoutRequestId: payout.id, entryType: "WITHDRAWAL_HOLD", status: "AVAILABLE", amountIdr: -amountIdr, idempotencyKey: `PAYOUT:${payout.id}:HOLD` },
    });
    return payout;
  }, { isolationLevel: "Serializable" });
}

export async function updateAffiliatePayoutDetails(userId: string, input: { bankName: unknown; accountName: unknown; accountNumber: unknown }) {
  const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
  if (!profile || profile.status !== "ACTIVE") throw new Error("AFFILIATE_NOT_ACTIVE");
  const bankName = typeof input.bankName === "string" ? input.bankName.trim() : "";
  const accountName = typeof input.accountName === "string" ? input.accountName.trim() : "";
  const accountNumber = typeof input.accountNumber === "string" ? input.accountNumber.replace(/\s+/g, "") : "";
  if (bankName.length < 2 || bankName.length > 80 || accountName.length < 2 || accountName.length > 120 || !/^\d{6,30}$/.test(accountNumber)) throw new Error("INVALID_PAYOUT_DETAILS");
  return prisma.affiliateProfile.update({ where: { id: profile.id }, data: { payoutBankName: bankName, payoutAccountName: accountName, payoutAccountNumber: accountNumber } });
}

export async function updateAffiliateRate(input: { userEmail: unknown; ratePercent: unknown; status?: unknown; adminUserId: string }) {
  const email = typeof input.userEmail === "string" ? input.userEmail.trim().toLowerCase() : "";
  const percent = Number(input.ratePercent);
  if (!email || !Number.isFinite(percent) || percent <= 0 || percent > 100) throw new Error("INVALID_AFFILIATE_RATE");
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error("AFFILIATE_USER_NOT_FOUND");
  let profile = await prisma.affiliateProfile.findUnique({ where: { userId: user.id } });
  if (!profile) profile = await createAffiliateProfile(user.id);
  if (input.status !== undefined && input.status !== "ACTIVE" && input.status !== "SUSPENDED") throw new Error("INVALID_AFFILIATE_STATUS");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.affiliateProfile.update({ where: { id: profile!.id }, data: { commissionRateBps: Math.round(percent * 100), ...(input.status ? { status: input.status } : {}) } });
    await tx.adminContentAuditEvent.create({ data: { entityType: "AFFILIATE_PROFILE", entityId: updated.id, action: "AFFILIATE_RATE_UPDATED", actorUserId: input.adminUserId, metadata: { ratePercent: percent, status: updated.status } } });
    return updated;
  });
}

export async function listAffiliateOperations() {
  const [profiles, payouts] = await Promise.all([
    prisma.affiliateProfile.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } }, _count: { select: { attributions: true } } } }),
    prisma.affiliatePayoutRequest.findMany({
      orderBy: { requestedAt: "desc" },
      take: 100,
      include: { affiliate: { include: { user: { select: { name: true, email: true } } } } },
    }),
  ]);
  return { profiles, payouts };
}

export async function processAffiliatePayout(input: { payoutId: string; adminUserId: string; action: "PAID" | "REJECTED"; transferReference?: string; note?: string }) {
  const payout = await prisma.affiliatePayoutRequest.findUnique({ where: { id: input.payoutId } });
  if (!payout || payout.status !== "REQUESTED" && payout.status !== "PROCESSING") throw new Error("PAYOUT_NOT_PROCESSABLE");
  if (input.action === "PAID" && !input.transferReference?.trim()) throw new Error("TRANSFER_REFERENCE_REQUIRED");
  return prisma.$transaction(async (tx) => {
    const changed = await tx.affiliatePayoutRequest.updateMany({ where: { id: payout.id, status: { in: ["REQUESTED", "PROCESSING"] } }, data: { status: input.action, adminUserId: input.adminUserId, transferReference: input.transferReference?.trim() || null, adminNote: input.note?.trim() || null, processedAt: new Date() } });
    if (changed.count !== 1) throw new Error("PAYOUT_STATE_CHANGED");
    if (input.action === "PAID") {
      await tx.affiliateLedgerEntry.updateMany({ where: { payoutRequestId: payout.id, entryType: "WITHDRAWAL_HOLD" }, data: { status: "SETTLED" } });
    } else {
      await tx.affiliateLedgerEntry.create({ data: { affiliateId: payout.affiliateId, payoutRequestId: payout.id, entryType: "WITHDRAWAL_RELEASE", status: "AVAILABLE", amountIdr: payout.amountIdr, idempotencyKey: `PAYOUT:${payout.id}:RELEASE`, metadata: { adminUserId: input.adminUserId, note: input.note?.trim() || null } } });
    }
    await tx.adminContentAuditEvent.create({ data: { entityType: "AFFILIATE_PAYOUT", entityId: payout.id, action: input.action === "PAID" ? "AFFILIATE_PAYOUT_TRANSFER_RECORDED" : "AFFILIATE_PAYOUT_REJECTED", actorUserId: input.adminUserId, metadata: { amountIdr: payout.amountIdr, transferReference: input.transferReference?.trim() || null, note: input.note?.trim() || null } } });
    return tx.affiliatePayoutRequest.findUniqueOrThrow({ where: { id: payout.id } });
  }, { isolationLevel: "Serializable" });
}

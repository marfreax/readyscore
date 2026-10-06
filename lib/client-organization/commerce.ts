import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { getCurrentSession } from "../auth/session";
import { getClientOrganizationWorkspace, requireClientOrganizationAdmin } from "./service";
import { calculateAffiliateCommission, resolveAffiliateForBuyer } from "../affiliate/service";
import { releaseExpiredInvitationCredits } from "./credits";

function orderNumber() {
  return `RS-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function listCorporateDiscPackages() {
  return prisma.clientDiscPackage.findMany({ where: { status: "ACTIVE" }, orderBy: { creditQuantity: "asc" } });
}

export async function getCorporateCreditSummary(organizationId: string, userId: string) {
  const workspace = await getClientOrganizationWorkspace(userId, organizationId);
  if (!workspace) throw new Error("CLIENT_ORGANIZATION_ACCESS_DENIED");
  await releaseExpiredInvitationCredits(organizationId);
  const now = new Date();
  const [lots, orders, ledger] = await Promise.all([
    prisma.clientOrganizationCreditLot.findMany({ where: { organizationId, expiresAt: { gt: now }, remainingCredits: { gt: 0 } }, orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }], include: { package: { select: { name: true } } } }),
    prisma.commercialOrder.findMany({ where: { clientOrganizationId: organizationId }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, orderNumber: true, productNameSnapshot: true, totalAmountIdr: true, paymentStatus: true, fulfillmentStatus: true, createdAt: true, paidAt: true, clientDiscPackage: { select: { creditQuantity: true } } } }),
    prisma.clientOrganizationCreditLedger.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const reserved = await prisma.clientInvitationCreditReservation.count({ where: { organizationId, status: "RESERVED" } });
  const availableCredits = lots.reduce((sum, lot) => sum + lot.remainingCredits, 0);
  return { availableCredits, reservedCredits: reserved, lots, orders, ledger };
}

export async function createCorporateDiscCheckoutOrder(input: { organizationId: string; userId?: string; packageId: unknown; referralCode?: unknown }) {
  const session = await getCurrentSession();
  if (!session || (input.userId && input.userId !== session.user.id)) throw new Error("UNAUTHENTICATED");
  await requireClientOrganizationAdmin(session.user.id, input.organizationId);
  const packageId = typeof input.packageId === "string" ? input.packageId.trim() : "";
  const productPackage = await prisma.clientDiscPackage.findFirst({ where: { id: packageId, status: "ACTIVE" } });
  if (!productPackage) throw new Error("CORPORATE_PACKAGE_NOT_AVAILABLE");
  const product = await prisma.product.findFirst({ where: { tier: "CORPORATE_DISC_CREDIT", status: "ACTIVE" }, select: { id: true, name: true } });
  if (!product) throw new Error("CORPORATE_PAYMENT_PRODUCT_NOT_READY");
  const affiliate = await resolveAffiliateForBuyer(session.user.id, input.referralCode);
  const profile = affiliate ? await prisma.affiliateProfile.findUnique({ where: { id: affiliate.affiliateId }, select: { id: true, commissionRateBps: true, status: true } }) : null;
  const rateBps = profile?.status === "ACTIVE" ? profile.commissionRateBps : null;
  const commissionAmountIdr = rateBps ? calculateAffiliateCommission(productPackage.priceIdr, rateBps) : null;

  return prisma.$transaction(async (tx) => {
    const order = await tx.commercialOrder.create({
      data: {
        id: `ord_${randomBytes(12).toString("hex")}`,
        userId: session.user.id,
        productId: product.id,
        clientOrganizationId: input.organizationId,
        clientDiscPackageId: productPackage.id,
        affiliateId: rateBps ? profile!.id : null,
        affiliateRateBpsSnapshot: rateBps,
        affiliateCommissionIdrSnapshot: commissionAmountIdr,
        orderNumber: orderNumber(),
        productNameSnapshot: `${productPackage.creditQuantity} Kredit DISC Corporate — ${productPackage.name}`,
        assessmentTypeSnapshot: "DISC",
        quantity: 1,
        unitPriceIdrSnapshot: productPackage.priceIdr,
        totalAmountIdr: productPackage.priceIdr,
        currency: "IDR",
        commercialConfig: { source: "V21_CORPORATE_CHECKOUT", orderKind: "CORPORATE_DISC_CREDIT", packageId: productPackage.id, creditQuantity: productPackage.creditQuantity, referralCode: rateBps ? affiliate?.referralCode : null },
        status: "CREATED",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NOT_STARTED",
      },
    });
    await tx.commercialAuditEvent.createMany({ data: [
      { orderId: order.id, action: "ORDER_CREATED", fromState: null, toState: "CREATED", source: "CORPORATE_CHECKOUT", reference: order.orderNumber, metadata: { organizationId: input.organizationId, packageId: productPackage.id, creditQuantity: productPackage.creditQuantity, totalAmountIdr: productPackage.priceIdr } },
      { orderId: order.id, action: "PAYMENT_PENDING", fromState: "CREATED", toState: "PENDING", source: "CORPORATE_CHECKOUT", reference: order.orderNumber },
    ] });
    return { id: order.id, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus, package: productPackage, totalAmountIdr: order.totalAmountIdr };
  });
}

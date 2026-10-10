import { prisma } from "../db/prisma";
import { authenticateFeed, encodeCursor, feedPage, FeedError } from "./security";
export async function handleFeed(request: Request, entity: string) {
  try {
    const scopes: Record<string,string> = { connection: "customers.read", users: "customers.read", leads: "leads.read", purchases: "purchases.read", "scalev-purchases": "purchases.read" };
    if (!scopes[entity]) throw new FeedError(404, "NOT_FOUND");
    const grant = authenticateFeed(request, scopes[entity]);
    if (entity === "connection") return Response.json({ schemaVersion: 1, sourceInstance: grant.sourceInstance, grantId: grant.id, scopes: grant.scopes, capabilities: { users: true, leads: true, purchases: true, scalevPurchases: true, identityLinks: false, tombstones: false, purchaseCoverage: "OBSERVED_ONLY" } }, { headers: { "Cache-Control": "no-store" } });
    const page = feedPage(new URL(request.url), grant, entity);
    const args = { where: page.where, take: page.limit + 1, orderBy: [{ updatedAt: "asc" as const }, { id: "asc" as const }] };
    let rows: Record<string, unknown>[];
    if (entity === "users") rows = await prisma.user.findMany({ ...args, where: { AND: [...page.where.AND, { role: "USER" }] }, select: { id:true, name:true, email:true, status:true, createdAt:true, updatedAt:true } });
    else if (entity === "leads") rows = await prisma.businessLead.findMany({ ...args, select: { id:true,name:true,whatsapp:true,email:true,source:true,status:true,consent:true,consentAt:true,emailMarketingConsent:true,whatsappMarketingConsent:true,createdAt:true,updatedAt:true } });
    else if (entity === "purchases") rows = await prisma.commercialOrder.findMany({ ...args, where: { AND: [...page.where.AND, { user: { role: "USER" } }] }, select: { id:true,userId:true,orderNumber:true,productNameSnapshot:true,status:true,paymentStatus:true,totalAmountIdr:true,currency:true,paidAt:true,createdAt:true,updatedAt:true } });
    else rows = await prisma.scalevPurchase.findMany({ ...args, where: { AND: [...page.where.AND, { user: { role: "USER" } }] }, select: { id:true,userId:true,scalevOrderId:true,status:true,paymentStatus:true,paidAt:true,createdAt:true,updatedAt:true } });
    const more = rows.length > page.limit;
    const items = rows.slice(0,page.limit);
    const last = items.at(-1);
    return Response.json({ schemaVersion: 1, sourceInstance: grant.sourceInstance, entity, items, nextCursor: more && last ? encodeCursor({ ...page.position, at: (last.updatedAt as Date).toISOString(), id: String(last.id) }, grant) : null, watermark: page.position.until, coverage: { deletions: "UNAVAILABLE", purchases: "OBSERVED_ONLY", automaticIdentityMerge: false } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof FeedError ? error.status : 503;
    return Response.json({ error: error instanceof FeedError ? error.message : "FEED_UNAVAILABLE" }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

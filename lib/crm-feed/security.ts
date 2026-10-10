import { createHash, createHmac, timingSafeEqual } from "node:crypto";
export type FeedGrant = { id: string; sourceInstance: string; tokenSha256: string; scopes: string[] };
export class FeedError extends Error { constructor(public status: number, message: string) { super(message); } }
export function authenticateFeed(request: Request, scope: string): FeedGrant {
  if (process.env.CRM_FEED_ENABLED !== "true") throw new FeedError(404, "FEED_DISABLED");
  let grants: FeedGrant[];
  try { grants = JSON.parse(process.env.CRM_FEED_GRANTS_JSON || "[]"); } catch { throw new FeedError(503, "FEED_NOT_CONFIGURED"); }
  if (!Array.isArray(grants)) throw new FeedError(503, "FEED_NOT_CONFIGURED");
  const token = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43,200})$/)?.[1];
  if (!token) throw new FeedError(401, "UNAUTHORIZED");
  const digest = createHash("sha256").update(token).digest();
  const grant = grants.find(g => typeof g.tokenSha256 === "string" && /^[a-f0-9]{64}$/.test(g.tokenSha256) && timingSafeEqual(digest, Buffer.from(g.tokenSha256, "hex")));
  if (!grant || !grant.id || !grant.sourceInstance || !Array.isArray(grant.scopes)) throw new FeedError(401, "UNAUTHORIZED");
  if (!grant.scopes.includes(scope)) throw new FeedError(403, "SCOPE_DENIED");
  return grant;
}
type Position = { v: 1; grant: string; entity: string; since: string; until: string; at?: string; id?: string };
export function encodeCursor(position: Position, grant: FeedGrant) {
  const data = Buffer.from(JSON.stringify(position)).toString("base64url");
  return data + "." + createHmac("sha256", grant.tokenSha256).update(data).digest("base64url");
}
export function feedPage(url: URL, grant: FeedGrant, entity: string) {
  const limit = Number(url.searchParams.get("limit") || 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw new FeedError(400, "INVALID_LIMIT");
  const cursor = url.searchParams.get("cursor");
  let p: Position;
  if (cursor) {
    try {
      if (cursor.length > 3000) throw Error();
      const [data, sig, extra] = cursor.split(".");
      const expected = createHmac("sha256", grant.tokenSha256).update(data).digest("base64url");
      if (extra || sig?.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw Error();
      p = JSON.parse(Buffer.from(data, "base64url").toString());
      if (p.v !== 1 || p.grant !== grant.id || p.entity !== entity || !p.id || !p.at) throw Error();
    } catch { throw new FeedError(400, "INVALID_CURSOR"); }
  } else {
    p = { v: 1, grant: grant.id, entity, since: url.searchParams.get("since") || "1970-01-01T00:00:00.000Z", until: new Date().toISOString() };
  }
  if (![p.since, p.until, ...(p.at ? [p.at] : [])].every(t => typeof t === "string" && /^\d{4}-\d{2}-\d{2}T/.test(t) && Number.isFinite(Date.parse(t))) || Date.parse(p.since) > Date.parse(p.until)) throw new FeedError(400, "INVALID_RANGE");
  return { limit, position: p, where: { AND: [{ updatedAt: { gte: new Date(p.since), lte: new Date(p.until) } }, ...(p.at ? [{ OR: [{ updatedAt: { gt: new Date(p.at) } }, { updatedAt: new Date(p.at), id: { gt: p.id } }] }] : [])] } };
}

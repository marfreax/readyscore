import { requireAdmin } from "../../../lib/auth/admin";
import { listAffiliateOperations } from "../../../lib/affiliate/service";
import AffiliateOperations from "./AffiliateOperations";

export const dynamic = "force-dynamic";

export default async function AdminAffiliatesPage() {
  await requireAdmin();
  const data = await listAffiliateOperations();
  return <section className="rs-container space-y-5 py-8 sm:py-10"><header><p className="rs-eyebrow">ReadyScore · V21</p><h1 className="rs-section-title mt-1 text-3xl">Affiliate operations</h1><p className="rs-subtitle mt-2 max-w-3xl">Atur rate affiliate dan catat transfer pencairan manual.</p></header><AffiliateOperations initial={data} /></section>;
}

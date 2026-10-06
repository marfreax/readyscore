import { redirect } from "next/navigation";
import { AppShell } from "../../components/app/AppShell";
import { getCurrentSession } from "../../lib/auth/session";
import { getAffiliateSummary } from "../../lib/affiliate/service";
import AffiliateDashboard from "./AffiliateDashboard";

export const dynamic = "force-dynamic";

export default async function AffiliatePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Faffiliate");
  const summary = await getAffiliateSummary(session.user.id);
  return <AppShell userName={session.user.name}><div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-6xl"><AffiliateDashboard initial={summary} /></div></div></AppShell>;
}

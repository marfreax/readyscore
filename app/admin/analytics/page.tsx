import { requireAdmin } from "../../../lib/auth/admin";
import { getFunnelSummary, V16_FUNNEL_EVENTS } from "../../../lib/funnel-analytics";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const counts = await getFunnelSummary();
  return <section className="rs-container py-8 sm:py-10"><div className="mb-8"><p className="rs-eyebrow">V16</p><h1 className="rs-section-title mt-1 text-3xl">Funnel Analytics</h1><p className="rs-subtitle mt-2">Server-recorded acquisition funnel events. Personal contact data is not rendered.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{V16_FUNNEL_EVENTS.map((event)=><div key={event} className="rounded-2xl border bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{event.replaceAll("_"," ")}</p><p className="mt-2 text-3xl font-black">{counts[event]}</p></div>)}</div></section>;
}

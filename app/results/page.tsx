import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerPageShell } from "../../components/app/CustomerPageShell";
import { Badge, Card, EmptyState } from "../../components/ui/DesignSystem";
import { getCurrentSession } from "../../lib/auth/session";
import { listUserEntitlements } from "../../lib/commercial/entitlement-service";
import { getUserHistory } from "../../lib/assessment/dashboard-repository";
import { CUSTOMER_ASSESSMENT_CATALOG } from "../../lib/assessment/catalog";

const LABELS: Record<string, string> = { cognitive: "Cognitive", eq: "Emotional Intelligence", disc: "DISC", riasec: "RIASEC" };
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—"; }
function accessKey(type: string) { return `TEST_ACCESS:TEST_TYPE:${type.toUpperCase() === "COGNITIVE" ? "COGNITIVE" : type.toUpperCase()}`; }
function resultKey(type: string) { return `RESULT_ACCESS:TEST_TYPE:${type.toUpperCase() === "COGNITIVE" ? "COGNITIVE" : type.toUpperCase()}`; }
function statusFor(attempt: Awaited<ReturnType<typeof getUserHistory>>[number] | undefined, hasAccess: boolean) {
  if (attempt?.status === "IN_PROGRESS") return { label: "In Progress", tone: "warning" as const };
  if (attempt?.status === "COMPLETED") return { label: "Completed", tone: "success" as const };
  return hasAccess ? { label: "Not Started", tone: "accent" as const } : { label: "Locked", tone: "neutral" as const };
}
export default async function ResultsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/results");
  const [history, entitlements] = await Promise.all([getUserHistory(session.user.id), listUserEntitlements(session.user.id)]);
  const entitlementKeys = new Set(entitlements.map((item) => `${item.type}:${item.resourceType}:${item.resourceKey}`));
  const latestByType = new Map<string, (typeof history)[number]>();
  for (const item of history) if (!latestByType.has(item.assessmentType)) latestByType.set(item.assessmentType, item);
  const items = CUSTOMER_ASSESSMENT_CATALOG.map((test) => {
    const type = test.type.toLowerCase(); const latest = latestByType.get(type);
    const hasAssessmentAccess = entitlementKeys.has(accessKey(type)); const hasResultAccess = entitlementKeys.has(resultKey(type));
    return { test, type, latest, hasAssessmentAccess, hasResultAccess, status: statusFor(latest, hasAssessmentAccess) };
  });
  const completed = items.filter((item) => item.latest?.status === "COMPLETED");
  const inProgress = items.filter((item) => item.latest?.status === "IN_PROGRESS");
  const available = items.filter((item) => !item.latest && item.hasAssessmentAccess);
  const locked = items.filter((item) => !item.latest && !item.hasAssessmentAccess);
  return <CustomerPageShell userName={session.user.name} eyebrow="Results · Individual assessment results" title="Results" description="Tempat untuk menemukan hasil assessment individual Anda. Setiap result tetap dibaca menggunakan makna dan kontrak assessment asalnya.">
    <div className="space-y-6 pb-10">
      <section aria-labelledby="results-summary-title" className="grid gap-4 sm:grid-cols-3"><h2 id="results-summary-title" className="sr-only">Ringkasan results</h2>
        <Card className="px-5 py-5"><p className="text-xs font-bold text-slate-500">Completed</p><p className="mt-2 text-3xl font-black">{completed.length}</p><p className="mt-1 text-xs font-semibold text-slate-400">result tersedia</p></Card>
        <Card className="px-5 py-5"><p className="text-xs font-bold text-slate-500">In Progress</p><p className="mt-2 text-3xl font-black">{inProgress.length}</p><p className="mt-1 text-xs font-semibold text-slate-400">assessment belum selesai</p></Card>
        <Card tone="accent" className="px-5 py-5"><p className="text-xs font-bold text-slate-500">Ready to start</p><p className="mt-2 text-3xl font-black">{available.length}</p><p className="mt-1 text-xs font-semibold text-slate-400">assessment dengan akses</p></Card>
      </section>
      <Card className="px-5 py-6 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="rs-eyebrow">Your results</p><h2 className="rs-title mt-1 text-2xl">Hasil assessment Anda</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Completed membuka result individual. Assessment yang sedang berjalan dapat dilanjutkan. Assessment yang belum dimulai atau terkunci ditampilkan untuk membantu Anda memahami perjalanan berikutnya.</p></div><div className="flex flex-wrap gap-2"><Link href="/profile" className="rs-button rs-button-secondary">Lihat My Profile</Link><Link href="/reports" className="rs-button rs-button-secondary">Lihat Reports</Link></div></div>
        <div className="mt-6 space-y-3">{items.map(({ test, type, latest, hasAssessmentAccess, hasResultAccess, status }) => <article key={test.type} className="rounded-2xl border border-slate-200 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">{test.eyebrow}</p><Badge tone={status.tone}>{status.label}</Badge></div><h3 className="mt-1 text-lg font-black">{LABELS[type] ?? test.label}</h3>{latest?.status === "COMPLETED" ? <p className="mt-2 text-xs font-semibold text-slate-400">Selesai · {formatDate(latest.completedAt)}</p> : latest?.status === "IN_PROGRESS" ? <p className="mt-2 text-xs font-semibold text-slate-400">Progress · {latest.answered}/{latest.total} pertanyaan</p> : <p className="mt-2 text-sm leading-6 text-slate-500">{status.label === "Locked" ? "Belum termasuk akses akun Anda." : "Belum ada result untuk assessment ini."}</p>}</div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">{latest?.status === "COMPLETED" ? (hasResultAccess ? <Link href={`/result/${encodeURIComponent(latest.id)}`} className="rs-button rs-button-primary">View result →</Link> : <Link href="/access" className="rs-button rs-button-primary">Get access →</Link>) : latest?.status === "IN_PROGRESS" ? <Link href={`/assessments/${encodeURIComponent(type)}/test`} className="rs-button rs-button-primary">Continue →</Link> : hasAssessmentAccess ? <Link href={`/assessments/${encodeURIComponent(type)}`} className="rs-button rs-button-secondary">Start assessment →</Link> : <Link href="/access" className="rs-button rs-button-secondary">Get access →</Link>}</div></div></article>)}</div>
      </Card>
      {items.length === 0 ? <Card className="px-6 py-10"><EmptyState title="Belum ada result" description="Selesaikan assessment untuk membuat result yang dapat dibaca di workspace." action={<Link href="/assessments" className="rs-button rs-button-primary">Lihat Assessments</Link>} /></Card> : null}
      <Card tone="muted" className="px-5 py-6 sm:px-6"><p className="rs-eyebrow">Result boundary</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Individual result","Setiap result berasal dari satu assessment."],["Existing semantics","Interpretasi dibaca dari result contract yang sudah ada."],["No universal score","Workspace tidak menghitung atau menggabungkan score lintas assessment."]].map(([title,description]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="font-black">{title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div>)}</div>{locked.length > 0 ? <p className="mt-4 text-xs leading-5 text-slate-500">Assessment yang terkunci hanya ditampilkan sebagai discovery state; halaman ini tidak memberikan entitlement baru.</p> : null}</Card>
    </div>
  </CustomerPageShell>;
}

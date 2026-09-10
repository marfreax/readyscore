import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, CirclePlay, LockKeyhole, RotateCcw } from "lucide-react";
import { CustomerPageShell } from "../../components/app/CustomerPageShell";
import { Badge, Card, EmptyState } from "../../components/ui/DesignSystem";
import { getCurrentSession } from "../../lib/auth/session";
import { listUserEntitlements } from "../../lib/commercial/entitlement-service";
import { getUserHistory } from "../../lib/assessment/dashboard-repository";
import { CUSTOMER_ASSESSMENT_CATALOG } from "../../lib/assessment/catalog";

type TestKey = "COGNITIVE" | "EQ" | "DISC" | "RIASEC";
type WorkspaceStatus = "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "LOCKED";

const TESTS = CUSTOMER_ASSESSMENT_CATALOG.map((item) => ({
  ...item,
  key: item.type.toUpperCase() as TestKey,
}));

function entitlementKey(item: { type: string; resourceType: string; resourceKey: string }) {
  return `${item.type}:${item.resourceType}:${item.resourceKey}`;
}

function accessKey(test: TestKey) {
  return entitlementKey({ type: "TEST_ACCESS", resourceType: "TEST_TYPE", resourceKey: test });
}

function resultKey(test: TestKey) {
  return entitlementKey({ type: "RESULT_ACCESS", resourceType: "TEST_TYPE", resourceKey: test });
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
    : "—";
}

function statusLabel(status: WorkspaceStatus) {
  return {
    AVAILABLE: "Available",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    LOCKED: "Locked",
  }[status];
}

function statusTone(status: WorkspaceStatus): "success" | "warning" | "accent" | "neutral" {
  if (status === "COMPLETED") return "success";
  if (status === "IN_PROGRESS") return "warning";
  if (status === "AVAILABLE") return "accent";
  return "neutral";
}

function statusDescription(status: WorkspaceStatus) {
  return {
    AVAILABLE: "Anda dapat memulai assessment ini.",
    IN_PROGRESS: "Assessment ini sudah Anda mulai dan dapat dilanjutkan.",
    COMPLETED: "Assessment ini sudah selesai dan result dapat dibuka bila akses result tersedia.",
    LOCKED: "Assessment ini terlihat untuk discovery, tetapi belum tersedia pada entitlement akun Anda.",
  }[status];
}

function WorkspaceCard({
  test,
  status,
  latest,
  resultAvailable,
}: {
  test: (typeof TESTS)[number];
  status: WorkspaceStatus;
  latest: Awaited<ReturnType<typeof getUserHistory>>[number] | undefined;
  resultAvailable: boolean;
}) {
  const type = test.type;
  return (
    <Card className="px-5 py-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="rs-eyebrow">{test.eyebrow}</p>
          <h3 className="mt-1 text-xl font-black">{test.label}</h3>
        </div>
        <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{test.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="block text-slate-900">{test.questionCount}</span> soal</div>
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="block text-slate-900">{test.duration}</span> durasi</div>
        <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 sm:col-span-1"><span className="block text-slate-900">{test.responseModel}</span> respons</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {test.measures.slice(0, 4).map((measure) => <span key={measure} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{measure}</span>)}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-800">{statusLabel(status)}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{statusDescription(status)}</p>
        {latest ? <p className="mt-2 text-[11px] font-semibold text-slate-400">Aktivitas terakhir · {formatDate(latest.completedAt ?? latest.startedAt)}</p> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {status === "LOCKED" ? (
          <Link href="/access#plans" className="rs-button rs-button-primary"><LockKeyhole className="h-4 w-4" aria-hidden="true" /> Get access</Link>
        ) : status === "IN_PROGRESS" ? (
          <Link href={`/assessments/${type}/test`} className="rs-button rs-button-primary"><CirclePlay className="h-4 w-4" aria-hidden="true" /> Continue</Link>
        ) : status === "COMPLETED" ? (
          resultAvailable && latest ? (
            <Link href={`/result/${encodeURIComponent(latest.id)}`} className="rs-button rs-button-primary"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> View result</Link>
          ) : (
            <Link href="/access#plans" className="rs-button rs-button-primary"><LockKeyhole className="h-4 w-4" aria-hidden="true" /> Get access</Link>
          )
        ) : (
          <Link href={`/assessments/${type}/pre-test`} className="rs-button rs-button-primary"><ArrowRight className="h-4 w-4" aria-hidden="true" /> Start</Link>
        )}
        <Link href={`/assessments/${type}`} className="rs-button rs-button-secondary">Pelajari assessment</Link>
      </div>
    </Card>
  );
}

export default async function AssessmentsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/assessments");

  const [entitlements, history] = await Promise.all([
    listUserEntitlements(session.user.id),
    getUserHistory(session.user.id),
  ]);
  const keys = new Set(entitlements.map(entitlementKey));

  const workspace = TESTS.map((test) => {
    const latest = history.find((attempt) => attempt.assessmentType === test.type);
    const testAccess = keys.has(accessKey(test.key));
    const resultAvailable = keys.has(resultKey(test.key));
    let status: WorkspaceStatus = "LOCKED";
    if (latest?.status === "IN_PROGRESS") status = "IN_PROGRESS";
    else if (latest?.status === "COMPLETED") status = "COMPLETED";
    else if (testAccess) status = "AVAILABLE";
    return { test, latest, resultAvailable, status };
  });

  const groups: { status: WorkspaceStatus; title: string; description: string }[] = [
    { status: "IN_PROGRESS", title: "Continue", description: "Assessment yang sudah Anda mulai." },
    { status: "AVAILABLE", title: "Available", description: "Assessment yang siap Anda kerjakan." },
    { status: "COMPLETED", title: "Completed", description: "Assessment yang sudah selesai dan result-nya dapat dibaca sesuai akses akun." },
    { status: "LOCKED", title: "Locked / Unavailable", description: "Assessment yang ditampilkan untuk discovery dan conversion, tetapi belum tersedia pada entitlement akun." },
  ];

  return (
    <CustomerPageShell
      userName={session.user.name}
      eyebrow="Assessments"
      title="Assessment Workspace"
      description="Lihat apa yang bisa Anda kerjakan sekarang, apa yang perlu dilanjutkan, apa yang sudah selesai, dan apa yang masih terkunci."
    >
      <div className="space-y-8 pb-10">
        <Card tone="accent" className="px-5 py-6 sm:px-7">
          <p className="rs-eyebrow">Your assessment journey</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Apa yang bisa Anda lakukan sekarang?</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Status di bawah berasal dari activity dan entitlement aktual. Workspace ini hanya menyajikan state dan CTA; entitlement tetap dikendalikan oleh sistem akses yang ada.</p>
            </div>
            <Link href="/access" className="rs-button rs-button-secondary shrink-0">Lihat Access & Plans</Link>
          </div>
        </Card>

        {workspace.length === 0 ? (
          <EmptyState title="Assessment belum tersedia" description="Tidak ada assessment yang dapat ditampilkan saat ini." action={<Link href="/access" className="rs-button rs-button-primary">Lihat Access & Plans</Link>} />
        ) : groups.map((group) => {
          const items = workspace.filter((item) => item.status === group.status);
          if (!items.length) return null;
          return (
            <section key={group.status} aria-labelledby={`assessment-group-${group.status.toLowerCase()}`}>
              <div className="mb-3">
                <p className="rs-eyebrow">{items.length} assessment</p>
                <h2 id={`assessment-group-${group.status.toLowerCase()}`} className="rs-title mt-1 text-2xl">{group.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{group.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((item) => <WorkspaceCard key={item.test.key} {...item} />)}
              </div>
            </section>
          );
        })}

        <Card className="px-5 py-6 sm:px-7">
          <div className="flex items-start gap-3">
            <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
            <div>
              <h2 className="text-base font-black">Retake dan reassessment</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Jika Anda ingin mengulang assessment yang sudah selesai, gunakan flow reassessment yang sudah tersedia. Workspace ini tidak membuat aturan retake baru.</p>
              <Link href="/activity" className="mt-3 inline-flex text-sm font-bold text-indigo-700 hover:text-indigo-900">Lihat activity →</Link>
            </div>
          </div>
        </Card>
      </div>
    </CustomerPageShell>
  );
}

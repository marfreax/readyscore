import Link from "next/link";
import { requireAdmin } from "../../lib/auth/admin";
import { getAdminOperationsDashboard } from "../../lib/admin-operations-dashboard";

function statusClass(status: "READY" | "WARNING" | "BLOCKED") {
  if (status === "READY") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "WARNING") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-rose-50 text-rose-800 border-rose-200";
}

function statusLabel(status: "READY" | "WARNING" | "BLOCKED") {
  return status === "READY" ? "READY" : status === "WARNING" ? "WARNING" : "BLOCKED";
}

function actionLabel(action: string) {
  return action.replaceAll("_", " ");
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const dashboard = await getAdminOperationsDashboard();

  return (
    <section className="rs-container py-8 sm:py-10">
      <div className="mb-8">
        <p className="rs-eyebrow">Administration</p>
        <h1 className="rs-section-title mt-1 text-3xl">Admin Operations Dashboard</h1>
        <p className="rs-subtitle mt-2 max-w-3xl">
          Operational health untuk mendeteksi masalah content, mapping, configuration, dan governance
          sebelum berdampak ke customer.
        </p>
      </div>

      {dashboard.warnings.length > 0 ? (
        <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-amber-950">Action required</p>
              <p className="mt-1 text-sm text-amber-900">
                Dashboard ini memprioritaskan kondisi yang membutuhkan tindakan operator.
              </p>
            </div>
            <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-black text-amber-900">
              {dashboard.warnings.length} warning
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {dashboard.warnings.slice(0, 6).map((warning) => (
              <Link
                key={`${warning.severity}-${warning.title}`}
                href={warning.href}
                className="rounded-2xl border border-amber-200 bg-white p-4 transition hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-xs font-black uppercase tracking-wide ${warning.severity === "BLOCK" ? "text-rose-700" : "text-amber-700"}`}>
                    {warning.severity}
                  </p>
                  <span className="text-slate-400">→</span>
                </div>
                <p className="mt-1 text-sm font-black text-slate-950">{warning.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{warning.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-black text-emerald-950">No actionable warnings</p>
          <p className="mt-1 text-sm text-emerald-900">
            Tidak ada kondisi operasional yang saat ini terdeteksi membutuhkan tindakan.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Questions", dashboard.totals.questions, "/admin/question-bank"],
          ["Published", dashboard.totals.published, "/admin/question-bank?status=PUBLISHED"],
          ["Active / usable", dashboard.totals.active, "/admin/question-bank?status=PUBLISHED"],
          ["Needs workflow", dashboard.totals.draftOrReview, "/admin/review"],
          ["Validation issues", dashboard.totals.validationIssues, "/admin/question-bank"],
          ["Mapping issues", dashboard.totals.mappingIssues, "/admin/review"],
          ["Configurations", dashboard.totals.configurations, "/admin/assessment-config"],
          ["Question packages", "→", "/admin/question-packages"],
          ["Blocked configs", dashboard.totals.blockedConfigurations, "/admin/assessment-config"],
        ].map(([label, value, href]) => (
          <Link key={label} href={href as string} className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="rs-eyebrow">Assessment Health</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Question Group Health</h2>
          </div>
          <Link href="/admin/question-bank" className="text-sm font-bold text-indigo-700 hover:underline">Open Question Bank →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.groups.map((group) => (
            <Link key={group.group} href={`/admin/question-bank?group=${group.group}`} className="rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-950">{group.label}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{group.total} latest questions</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{group.active} active</span>
              </div>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Published</dt><dd className="font-bold">{group.published}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Needs workflow</dt><dd className="font-bold">{group.draftOrReview}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Validation issues</dt><dd className="font-bold">{group.validationIssues}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Mapping issues</dt><dd className="font-bold">{group.mappingIssues}</dd></div>
              </dl>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <p className="rs-eyebrow">Configuration Health</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Readiness & Activation</h2>
        </div>
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          {dashboard.configurations.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">Belum ada assessment configuration.</div>
          ) : (
            <div className="divide-y">
              {dashboard.configurations.map((config) => (
                <Link key={config.id} href={config.href} className="block p-5 transition hover:bg-slate-50">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-950">{config.name}</p>
                        <span className="rounded-full border px-2 py-0.5 text-[11px] font-black uppercase tracking-wide">{config.code}</span>
                        <span className="rounded-full border px-2 py-0.5 text-[11px] font-black uppercase tracking-wide">{config.version}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {config.assessmentType} · {config.eligibleCount}/{config.requiredCount} eligible questions · config {config.status}
                      </p>
                    </div>
                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClass(config.readiness)}`}>
                      {statusLabel(config.readiness)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="rs-eyebrow">Auditability</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Recent Admin Activity</h2>
          </div>
          <Link href="/admin/review" className="text-sm font-bold text-indigo-700 hover:underline">Open Review →</Link>
        </div>
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          {dashboard.recentEvents.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">Belum ada audit event.</div>
          ) : (
            <div className="divide-y">
              {dashboard.recentEvents.map((event) => (
                <div key={event.id} className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">{actionLabel(event.action)}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {event.entityType} · {event.entityId} · {event.actor}
                      </p>
                      {(event.fromStatus || event.toStatus) && (
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {event.fromStatus ?? "—"} → {event.toStatus ?? "—"}
                        </p>
                      )}
                    </div>
                    <time dateTime={event.createdAt} className="text-xs font-bold text-slate-400">
                      {new Date(event.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">Operational boundary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Dashboard hanya membaca canonical operational state. Tidak ada counter manual dan tidak ada
          operasi dashboard yang mengubah measurement, scoring, result, entitlement, atau historical attempt.
        </p>
      </div>
    </section>
  );
}

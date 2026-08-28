import Link from "next/link";
import { getCurrentSession } from "../../lib/auth/session";
import { listUserInstitutions } from "../../lib/institution/service";

export default async function InstitutionPage() {
  const session = await getCurrentSession();
  if (!session) {
    return (
      <main className="rs-page px-4 py-12 text-slate-950 sm:px-6 sm:py-16">
        <div className="rs-container rs-card max-w-3xl p-8">
          <p className="rs-eyebrow">B2B / Institution</p>
          <h1 className="mt-2 text-3xl font-black">Institution Workspace</h1>
          <p className="mt-3 text-slate-600">Login diperlukan untuk melihat institution context dan entitlement.</p>
          <Link href="/" className="rs-button rs-button-primary mt-6">Back to ReadyScore</Link>
        </div>
      </main>
    );
  }

  const institutions = await listUserInstitutions(session.user.id);

  return (
    <main className="rs-page">
      <header className="border-b border-slate-200 bg-white">
        <div className="rs-container flex min-h-16 items-center justify-between gap-4 py-4">
          <div>
            <p className="rs-eyebrow">ReadyScore V3</p>
            <h1 className="mt-1 text-xl font-black">Institution Workspace</h1>
          </div>
          <Link href="/app" className="rs-button rs-button-secondary">Dashboard</Link>
        </div>
      </header>

      <div className="rs-container py-8">
        <section className="rs-card p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Phase 3.13</p>
          <h2 className="mt-2 text-2xl font-black">School / Institution context</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Institutional access is an organizational context layered on top of the
            existing user entitlement boundary. It does not redefine Test Type,
            assessment configuration, scoring, result semantics, or recommendation evidence.
          </p>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Your institutions</p>
              <h2 className="mt-1 text-xl font-black">{institutions.length} active institution membership{institutions.length === 1 ? "" : "s"}</h2>
            </div>
          </div>

          {institutions.length === 0 ? (
            <div className="rs-state mt-4">
              Belum ada active institution membership pada akun ini.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {institutions.map((item) => (
                <Link
                  key={item.institutionId}
                  href={`/institution/${item.institutionId}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">{item.institution.code}</span>
                  <h3 className="mt-3 text-lg font-black">{item.institution.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">Role: <strong>{item.role}</strong></p>
                  <p className="mt-5 text-xs font-bold text-slate-500">Open institution context →</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rs-card rs-card-muted mt-10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Boundary</p>
          <h2 className="mt-1 text-xl font-black">No measurement mutation</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Phase 3.13 provides institutional identity, membership and explicit
            institution-level access. Assessment attempts, questions, scoring,
            results and interpretation remain governed by their existing contracts.
          </p>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/session";
import { CrossTestProfileAccessError, getCrossTestProfile } from "../../lib/profile/service";
import type { ProfileDomain, ProfileSignal } from "../../lib/profile/types";
import { CustomerPageShell } from "../../components/app/CustomerPageShell";

const DOMAIN_META: Record<ProfileDomain, { label: string; description: string }> = {
  ABILITY: { label: "Ability", description: "Evidence dari cognitive reasoning profile." },
  EMOTIONAL: { label: "Emotional", description: "Evidence dari EQ response profile." },
  RESILIENCE: { label: "Resilience", description: "Belum tersedia pada instrumen aktif L10." },
  BEHAVIOR: { label: "Behavior", description: "Evidence dari DISC behavioral profile." },
  INTEREST: { label: "Interest", description: "Evidence dari RIASEC interest profile." },
  STRENGTH: { label: "Strength", description: "Belum tersedia pada instrumen aktif L10." },
  LEARNING: { label: "Learning", description: "Belum tersedia pada instrumen aktif L10." },
};

function scoreLabel(signal: ProfileSignal) {
  return signal.score === null ? "—" : String(signal.score);
}

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) redirect("/login?next=/profile");

  try {
    const { profile } = await getCrossTestProfile(session.user.id);

    return (
      <CustomerPageShell
        userName={session.user.name}
        eyebrow="Customer profile"
        title="Cross-Test Profile"
        description="Synthesis evidence dari assessment yang tersedia untuk akun Anda. Profile tidak membuat universal overall score dan tidak menggantikan semantic contract assessment asal."
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">{profile.contractVersion}</p>
              <h2 className="mt-2 text-2xl font-black">Profil lintas assessment Anda</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Synthesis ini menggabungkan evidence dari assessment yang tersedia. Tidak ada universal overall score dan tidak ada raw averaging antar-instrumen.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Completeness</p>
              <p className="mt-1 text-3xl font-black">{profile.completeness.percentage}%</p>
              <p className="text-xs text-slate-500">{profile.completeness.availableDomains}/{profile.completeness.totalDomains} domains</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profile.domains.map((domain) => (
            <article key={domain.domain} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">{DOMAIN_META[domain.domain].label}</p>
                  <h3 className="mt-2 text-lg font-black">{domain.status === "AVAILABLE" ? "Evidence available" : "Not available"}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{domain.signalCount}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{DOMAIN_META[domain.domain].description}</p>
              {domain.signals.length > 0 && (
                <div className="mt-5 space-y-3">
                  {domain.signals.map((signal) => (
                    <div key={signal.signalId} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black">{signal.label}</p>
                        <p className="text-xl font-black">{scoreLabel(signal)}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{signal.sourceTestType} · {signal.confidence}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${signal.score ?? 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">Observed patterns</p>
            <div className="mt-4 space-y-3">{profile.synthesis.observedPatterns.map((item) => <p key={item} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item}</p>)}</div>
          </article>
          <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Limitations & governance</p>
            <div className="mt-4 space-y-3">
              {profile.synthesis.limitations.map((item) => <p key={item} className="rounded-2xl bg-white/70 p-4 text-sm leading-6 text-slate-700">{item}</p>)}
              <p className="pt-2 text-sm leading-6 text-slate-700">Profile ini tidak menghasilkan skor universal kecerdasan, kepribadian, atau suitability, serta tidak memberikan jaminan jurusan, studi, maupun karier.</p>
            </div>
          </article>
        </section>

        <footer className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-xs leading-6 text-slate-500 shadow-sm">Engine {profile.engineVersion} · Generated {profile.generatedAt}</footer>
      </CustomerPageShell>
    );
  } catch (error) {
    const accessDenied = error instanceof CrossTestProfileAccessError;
    return (
      <CustomerPageShell
        userName={session.user.name}
        eyebrow="Customer profile"
        title="Cross-Test Profile"
        description="Profile lintas assessment tetap mengikuti entitlement akun dan semantic contract assessment asal."
      >
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7 shadow-sm">
          <p className="text-sm leading-7 text-amber-950">{accessDenied ? "Akses Cross-Test Profile belum tersedia untuk akun ini." : "Profile belum dapat dimuat."}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/app" className="rs-button rs-button-primary">Kembali ke Dashboard</Link>
            <Link href="/reports" className="rs-button rs-button-secondary">Reports</Link>
          </div>
        </section>
      </CustomerPageShell>
    );
  }
}

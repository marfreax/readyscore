import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/session";
import { CrossTestProfileAccessError, getCrossTestProfile } from "../../lib/profile/service";
import type { CrossTestProfileDomain, ProfileDomain } from "../../lib/profile/types";
import { CustomerPageShell } from "../../components/app/CustomerPageShell";

const DOMAIN_META: Record<ProfileDomain, { label: string; description: string }> = {
  ABILITY: { label: "Ability", description: "Evidence dari cognitive reasoning profile." },
  EMOTIONAL: { label: "Emotional", description: "Evidence dari EQ response profile." },
  RESILIENCE: { label: "Resilience", description: "Belum tersedia pada instrumen aktif." },
  BEHAVIOR: { label: "Behavior", description: "Evidence dari DISC behavioral profile." },
  INTEREST: { label: "Interest", description: "Evidence dari RIASEC interest profile." },
  STRENGTH: { label: "Strength", description: "Belum tersedia pada instrumen aktif." },
  LEARNING: { label: "Learning", description: "Belum tersedia pada instrumen aktif." },
};

const DOMAIN_ORDER: ProfileDomain[] = ["ABILITY", "EMOTIONAL", "RESILIENCE", "BEHAVIOR", "INTEREST", "STRENGTH", "LEARNING"];

const TEST_LABELS: Record<string, string> = {
  COGNITIVE: "Cognitive",
  EQ: "EQ",
  DISC: "DISC",
  RIASEC: "RIASEC",
};

function statusLabel(domain: CrossTestProfileDomain) {
  if (domain.status === "AVAILABLE") return "Evidence available";
  if (domain.status === "PARTIAL") return "Partial evidence";
  return "No evidence";
}

function RadarCoverage({ domains }: { domains: CrossTestProfileDomain[] }) {
  const center = 150;
  const radius = 102;
  const axisRadius = 122;
  const ringRadii = [34, 68, 102];
  const byDomain = new Map(domains.map((domain) => [domain.domain, domain]));
  const point = (index: number, r: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / DOMAIN_ORDER.length;
    return { x: center + Math.cos(angle) * r, y: center + Math.sin(angle) * r };
  };
  const polygon = (r: number) => DOMAIN_ORDER.map((_, index) => {
    const p = point(index, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
      <div className="flex justify-center" aria-hidden="true">
        <svg viewBox="0 0 300 300" className="h-auto w-full max-w-[430px]" role="presentation">
          <title>Profile evidence coverage radar</title>
          {ringRadii.map((r) => <polygon key={r} points={polygon(r)} fill="none" stroke="#cbd5e1" strokeWidth="1" />)}
          {DOMAIN_ORDER.map((domain, index) => {
            const outer = point(index, axisRadius);
            const inner = point(index, 18);
            const current = byDomain.get(domain);
            const available = Boolean(current && current.signalCount > 0);
            const dot = point(index, radius);
            return (
              <g key={domain}>
                <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#e2e8f0" strokeWidth="1" />
                <circle cx={dot.x} cy={dot.y} r={available ? 6 : 4} fill={available ? "#4f46e5" : "#cbd5e1"} stroke="#fff" strokeWidth="2" />
              </g>
            );
          })}
          <circle cx={center} cy={center} r="6" fill="#94a3b8" />
          <text x="150" y="151" textAnchor="middle" fontSize="10" fontWeight="800" fill="#64748b">EVIDENCE</text>
        </svg>
      </div>
      <div>
        <p className="rs-eyebrow">Profile coverage</p>
        <h2 className="rs-section-title mt-1">Evidence map</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Radar ini menunjukkan <strong>coverage evidence</strong>, bukan skor gabungan. Titik aktif berarti domain memiliki evidence dari assessment yang sudah tersedia.
        </p>
        <div className="mt-5 space-y-2" aria-label="Textual profile coverage equivalent">
          {DOMAIN_ORDER.map((domain) => {
            const current = byDomain.get(domain)!;
            const hasEvidence = current.signalCount > 0;
            return (
              <div key={domain} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                <span className="font-bold text-slate-800">{DOMAIN_META[domain].label}</span>
                <span className={hasEvidence ? "font-bold text-indigo-700" : "font-semibold text-slate-500"}>
                  {hasEvidence ? statusLabel(current) : "No evidence / Not available"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/profile");

  try {
    const { profile } = await getCrossTestProfile(session.user.id);
    const hasAnyEvidence = profile.domains.some((domain) => domain.signalCount > 0);
    const hasFullCoverage = profile.completeness.availableDomains === profile.completeness.totalDomains;

    return (
      <CustomerPageShell
        userName={session.user.name}
        eyebrow="My profile"
        title="Gambaran diri dari evidence yang tersedia"
        description="My Profile membantu Anda melihat gambaran lintas assessment. Setiap assessment tetap menjadi sumber makna utamanya; profile bukan assessment baru dan bukan universal score."
      >
        <section className="rs-card p-6 sm:p-8" aria-labelledby="profile-visualization-heading">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="rs-eyebrow">Cross-test evidence</p>
              <h2 id="profile-visualization-heading" className="rs-title mt-2 text-3xl">Your profile is {hasAnyEvidence ? "taking shape" : "starting to take shape"}.</h2>
              <p className="rs-subtitle mt-3">
                {hasAnyEvidence
                  ? "Visualisasi di bawah menunjukkan domain yang sudah memiliki evidence dari assessment yang selesai. Domain tanpa evidence tidak diberi nilai nol."
                  : "Belum ada assessment yang selesai untuk membentuk evidence profile. Mulai satu assessment untuk melihat profile Anda berkembang."}
              </p>
            </div>
            {!hasAnyEvidence ? (
              <div className="flex flex-wrap gap-2">
                <Link href="/assessments" className="rs-button rs-button-primary shrink-0">Start an assessment</Link>
                <Link href="/reports" className="rs-button rs-button-secondary shrink-0">View Reports</Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Link href="/reports" className="rs-button rs-button-secondary shrink-0">View Reports</Link>
                <div className="rounded-2xl bg-slate-50 px-5 py-4 text-right">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Evidence coverage</p>
                <p className="mt-1 text-3xl font-black">{profile.completeness.percentage}%</p>
                <p className="text-xs text-slate-500">{profile.completeness.availableDomains} of {profile.completeness.totalDomains} domains</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            <RadarCoverage domains={profile.domains} />
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-labelledby="profile-domain-heading">
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="rs-eyebrow">Domain evidence</p>
            <h2 id="profile-domain-heading" className="rs-section-title mt-1">What the profile currently contains</h2>
          </div>
          {profile.domains.map((domain) => {
            const hasEvidence = domain.signalCount > 0;
            return (
              <article key={domain.domain} className={`rs-card p-5 ${hasEvidence ? "border-indigo-200" : "bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{DOMAIN_META[domain.domain].label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{DOMAIN_META[domain.domain].description}</p>
                  </div>
                  <span className={`rs-badge ${hasEvidence ? "rs-badge-accent" : "rs-badge-neutral"}`}>
                    {hasEvidence ? "Evidence" : "No evidence"}
                  </span>
                </div>
                {hasEvidence ? (
                  <div className="mt-4 space-y-2">
                    {domain.signals.map((signal) => (
                      <div key={signal.signalId} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-sm font-black">{signal.label}</p>
                        <p className="mt-1 text-xs text-slate-500">Source: {TEST_LABELS[signal.sourceTestType.toUpperCase()] ?? signal.sourceTestType} · {signal.confidence}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-600">Nilai tetap bermakna dalam konteks assessment asal.</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm font-semibold text-slate-500">
                    No evidence / Not available
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <article className="rs-card p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="rs-eyebrow">Supporting sources</p>
                <h2 className="rs-section-title mt-1">Assessments contributing evidence</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">{profile.sources.length} source{profile.sources.length === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {profile.sources.length ? profile.sources.map((source) => (
                <article key={`${source.testType}:${source.attemptId}`} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{TEST_LABELS[source.testType.toUpperCase()] ?? source.testType}</p>
                  <p className="mt-2 font-black">{source.includedSignalCount > 0 ? "Evidence included" : "Limited evidence"}</p>
                  <p className="mt-1 text-xs text-slate-500">{source.includedSignalCount} signal{source.includedSignalCount === 1 ? "" : "s"} · {source.confidence}</p>
                  <Link href={`/result/${encodeURIComponent(source.attemptId)}`} className="rs-button rs-button-ghost mt-3 px-0 text-xs text-indigo-700">View result</Link>
                </article>
              )) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:col-span-2">No completed assessment source is available yet.</p>
              )}
            </div>
          </article>

          <article className="rs-card p-6">
            <p className="rs-eyebrow">What this means</p>
            <h2 className="rs-section-title mt-1">Evidence, not a single score</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Profile coverage menunjukkan evidence yang sudah tersedia dari assessment yang relevan.</p>
              <p>Score dari assessment berbeda tidak digabung menjadi satu angka universal.</p>
              <p>Domain tanpa evidence tetap ditampilkan sebagai <strong>No evidence / Not available</strong>, bukan 0.</p>
            </div>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              {hasFullCoverage ? "All profile domains currently have evidence. Supporting source information remains available below." : "Profile coverage is partial. Complete additional available assessments to add more evidence to the profile."}
            </div>
          </article>
        </section>

        {profile.synthesis.observedPatterns.length > 0 && (
          <section className="mt-6 rs-card p-6" aria-labelledby="observed-patterns-heading">
            <p className="rs-eyebrow">Existing profile observations</p>
            <h2 id="observed-patterns-heading" className="rs-section-title mt-1">Observed patterns</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {profile.synthesis.observedPatterns.map((item) => <p key={item} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item}</p>)}
            </div>
          </section>
        )}

        <footer className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-500">
          Profile {profile.contractVersion} · Engine {profile.engineVersion} · Evidence visualization only. Existing result semantics remain the source of truth.
        </footer>
      </CustomerPageShell>
    );
  } catch (error) {
    const accessDenied = error instanceof CrossTestProfileAccessError;
    return (
      <CustomerPageShell userName={session.user.name} eyebrow="My profile" title="Cross-Test Profile" description="Profile lintas assessment mengikuti entitlement akun dan semantic contract assessment asal.">
        <section className="rs-card rs-card-accent p-7">
          <p className="text-sm leading-7 text-slate-700">
            {accessDenied ? "Cross-Test Profile belum tersedia untuk akses akun ini." : "Profile belum dapat dimuat saat ini."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={accessDenied ? "/access" : "/app"} className="rs-button rs-button-primary">{accessDenied ? "View Access & Plans" : "Back to Overview"}</Link>
            {!accessDenied && <Link href="/assessments" className="rs-button rs-button-secondary">View Assessments</Link>}
          </div>
        </section>
      </CustomerPageShell>
    );
  }
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "../../components/app/AppShell";
import { getCurrentSession } from "../../lib/auth/session";
import { getActiveProductsForUser, listUserEntitlements } from "../../lib/commercial/entitlement-service";
import { getUserDashboard } from "../../lib/assessment/dashboard-repository";

const TESTS = [
  { key: "cognitive", name: "Cognitive", description: "Reasoning profile untuk melihat pola kemampuan kognitif Anda.", accessKey: "TEST_ACCESS:TEST_TYPE:COGNITIVE" },
  { key: "eq", name: "Emotional Intelligence", description: "Profil empat dimensi respons emosional dan sosial.", accessKey: "TEST_ACCESS:TEST_TYPE:EQ" },
  { key: "disc", name: "DISC", description: "Kecenderungan pola perilaku D, I, S, dan C.", accessKey: "TEST_ACCESS:TEST_TYPE:DISC" },
  { key: "riasec", name: "RIASEC", description: "Profil minat pada enam dimensi RIASEC.", accessKey: "TEST_ACCESS:TEST_TYPE:RIASEC" },
] as const;

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
    : "—";
}

function labelForType(type: string) {
  return TESTS.find((test) => test.key === type)?.name ?? type;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AppHomePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/app");

  const [dashboard, products, entitlements] = await Promise.all([
    getUserDashboard(session.user.id),
    getActiveProductsForUser(session.user.id),
    listUserEntitlements(session.user.id),
  ]);

  const entitlementKeys = new Set(entitlements.map((item) => `${item.type}:${item.resourceType}:${item.resourceKey}`));
  const latestByType = new Map<string, (typeof dashboard.attempts)[number]>();
  for (const attempt of dashboard.attempts) {
    if (!latestByType.has(attempt.assessmentType)) latestByType.set(attempt.assessmentType, attempt);
  }

  const completedTypes = new Set(
    dashboard.attempts.filter((attempt) => attempt.status === "COMPLETED").map((attempt) => attempt.assessmentType),
  );
  const inProgress = dashboard.attempts.find((attempt) => attempt.status === "IN_PROGRESS") ?? null;
  const latestCompleted = dashboard.latestCompleted;
  const availableCount = TESTS.filter((test) => entitlementKeys.has(test.accessKey) && !completedTypes.has(test.key)).length;
  const profileUnlocked = entitlementKeys.has("PROFILE_ACCESS:FEATURE:CROSS_TEST_PROFILE_V1");

  return (
    <AppShell userName={session.user.name}>
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="relative px-6 py-7 sm:px-8 sm:py-8">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-50 blur-2xl" aria-hidden="true" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white" aria-hidden="true">
                    {initials(session.user.name)}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Overview</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Halo, {session.user.name}.</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                      Ini ringkasan perjalanan Anda di ReadyScore. Mulai dari yang sedang berjalan, lalu lanjutkan ke hasil dan profil Anda.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {inProgress ? (
                    <Link href={`/assessments/${inProgress.assessmentType}/test`} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800">
                      Lanjutkan assessment
                    </Link>
                  ) : (
                    <Link href="/assessments" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800">
                      Mulai assessment
                    </Link>
                  )}
                  <Link href="/reports" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                    Lihat hasil
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="progress-heading" className="grid gap-4 sm:grid-cols-3">
            <h2 id="progress-heading" className="sr-only">Progress Anda</h2>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Assessment selesai</p>
              <p className="mt-1 text-3xl font-black">{completedTypes.size}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">dari {TESTS.length} assessment</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Sedang dikerjakan</p>
              <p className="mt-1 text-3xl font-black">{dashboard.stats.inProgressAssessments}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">assessment yang belum selesai</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Assessment tersedia</p>
              <p className="mt-1 text-3xl font-black">{availableCount}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">berdasarkan akses akun Anda</p>
            </article>
          </section>

          {inProgress ? (
            <section aria-labelledby="continue-heading" className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Continue</p>
                  <h2 id="continue-heading" className="mt-1 text-xl font-black">Lanjutkan {labelForType(inProgress.assessmentType)}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Anda sudah menjawab {inProgress.answered} dari {inProgress.total} pertanyaan.</p>
                </div>
                <Link href={`/assessments/${inProgress.assessmentType}/test`} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">
                  Lanjutkan →
                </Link>
              </div>
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <section aria-labelledby="latest-result-heading" className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Latest result</p>
                  <h2 id="latest-result-heading" className="mt-1 text-xl font-black">Hasil terbaru</h2>
                </div>
                <Link href="/reports" className="text-xs font-black text-indigo-600 hover:text-indigo-700">Semua hasil →</Link>
              </div>
              {latestCompleted ? (
                <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-700" aria-hidden="true">RS</div>
                    <div>
                      <p className="text-sm font-black">{labelForType(latestCompleted.assessmentType)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">Selesai {formatDate(latestCompleted.completedAt)}</p>
                    </div>
                  </div>
                  <Link href={`/result/${latestCompleted.id}`} className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                    Lihat hasil
                  </Link>
                </div>
              ) : (
                <div className="px-6 py-10">
                  <p className="font-black">Belum ada hasil assessment.</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Setelah Anda menyelesaikan assessment, hasil terbaru akan muncul di sini.</p>
                  <Link href="/assessments" className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white">Mulai assessment →</Link>
                </div>
              )}
            </section>

            <section aria-labelledby="profile-summary-heading" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">My Profile</p>
              <h2 id="profile-summary-heading" className="mt-1 text-xl font-black">Gambaran diri Anda</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {profileUnlocked
                  ? completedTypes.size > 0
                    ? "Profil lintas assessment tersedia berdasarkan evidence yang sudah Anda miliki."
                    : "Akses profil tersedia; selesaikan assessment untuk mulai membentuk evidence."
                  : "Profil lintas assessment belum termasuk akses akun Anda."}
              </p>
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold text-slate-500">Status</p>
                <p className="mt-1 text-sm font-black text-slate-800">{profileUnlocked ? "Available" : "Not available"}</p>
              </div>
              <Link href="/profile" className="mt-4 inline-flex text-xs font-black text-indigo-600 hover:text-indigo-700">Buka My Profile →</Link>
            </section>
          </div>

          <section aria-labelledby="access-summary-heading" className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Access & plans</p>
                <h2 id="access-summary-heading" className="mt-1 text-xl font-black">Akses Anda</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Ringkasan akses saat ini. Pengaturan paket dan pembelian tetap dilakukan di halaman Access & Plans.</p>
              </div>
              <Link href="/access" className="inline-flex shrink-0 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50">Kelola akses →</Link>
            </div>
            <div className="mt-5 rounded-2xl bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Current access</p>
              <p className="mt-1 text-lg font-black">{products.length ? products.map((product) => product.name).join(", ") : "Belum ada paket aktif"}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">Assessment tersedia: {availableCount}</p>
            </div>
          </section>

          <section aria-labelledby="next-step-heading" className="pb-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Next step</p>
              <h2 id="next-step-heading" className="mt-1 text-xl font-black">
                {inProgress ? "Selesaikan assessment yang sedang berjalan." : availableCount > 0 ? "Lanjutkan perjalanan assessment Anda." : latestCompleted ? "Lihat hasil dan pahami profile Anda." : "Mulai perjalanan Anda di ReadyScore."}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {inProgress ? "Kembali ke assessment terakhir agar progress Anda tetap tersimpan." : latestCompleted ? "Gunakan hasil individual sebagai dasar untuk memahami evidence yang sudah tersedia." : "Pilih assessment yang tersedia untuk mulai membangun evidence Anda."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={inProgress ? `/assessments/${inProgress.assessmentType}/test` : latestCompleted ? `/result/${latestCompleted.id}` : "/assessments"} className="rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-slate-100">
                  {inProgress ? "Lanjutkan" : latestCompleted ? "Lihat hasil" : "Lihat assessments"} →
                </Link>
                <Link href="/profile" className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800">My Profile</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

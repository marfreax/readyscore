import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerPageShell } from "../../components/app/CustomerPageShell";
import { Badge, Card } from "../../components/ui/DesignSystem";
import { getCurrentSession } from "../../lib/auth/session";
import { getCommercialCatalog } from "../../lib/commercial/catalog";
import { getB2CAddOnCatalog } from "../../lib/commercial/add-on-catalog";
import {
  getActiveProductsForUser,
  listUserEntitlements,
} from "../../lib/commercial/entitlement-service";
import { getUpgradeQuote } from "../../lib/commercial/upgrade-service";
import { getReassessmentEligibility } from "../../lib/assessment/reassessment";

type TestKey = "COGNITIVE" | "EQ" | "DISC" | "RIASEC";

const TESTS: Array<{
  key: TestKey;
  label: string;
  type: "cognitive" | "eq" | "disc" | "riasec";
  sku:
    | "RS-SINGLE-IQ-V1"
    | "RS-SINGLE-EQ-V1"
    | "RS-SINGLE-DISC-V1"
    | "RS-SINGLE-RIASEC-V1";
}> = [
  { key: "COGNITIVE", label: "Cognitive", type: "cognitive", sku: "RS-SINGLE-IQ-V1" },
  { key: "EQ", label: "Emotional Intelligence", type: "eq", sku: "RS-SINGLE-EQ-V1" },
  { key: "DISC", label: "DISC", type: "disc", sku: "RS-SINGLE-DISC-V1" },
  { key: "RIASEC", label: "RIASEC", type: "riasec", sku: "RS-SINGLE-RIASEC-V1" },
];

const planOrder = ["BASIC", "MEDIUM", "ADVANCE"] as const;

function keyFor(type: string, resourceType: string, resourceKey: string) {
  return `${type}:${resourceType}:${resourceKey}`;
}

function testKey(test: TestKey) {
  return keyFor(
    "TEST_ACCESS",
    "TEST_TYPE",
    test === "COGNITIVE" ? "COGNITIVE" : test,
  );
}

function resultKey(test: TestKey) {
  return keyFor(
    "RESULT_ACCESS",
    "TEST_TYPE",
    test === "COGNITIVE" ? "COGNITIVE" : test,
  );
}

function rupiah(value: number | null | undefined) {
  return value == null ? "Harga mengikuti katalog" : `Rp${value.toLocaleString("id-ID")}`;
}

function planCopy(tier: string) {
  if (tier === "BASIC") {
    return {
      eyebrow: "Single test",
      promise: "Satu assessment untuk kebutuhan yang paling spesifik.",
      bullets: [
        "Pilih satu dari empat core assessment",
        "Hasil assessment tetap tersimpan",
        "Cocok untuk kebutuhan yang terarah",
      ],
    };
  }

  if (tier === "MEDIUM") {
    return {
      eyebrow: "Complete assessment",
      promise: "Empat core assessment dalam satu paket.",
      bullets: [
        "Cognitive + EQ + DISC + RIASEC",
        "Akses hasil untuk assessment yang tersedia",
        "Cakupan lebih lengkap dalam satu paket",
      ],
    };
  }

  return {
    eyebrow: "Full insight",
    promise: "Empat assessment dengan Cross-Test Profile dan personalized report.",
    bullets: [
      "Semua core assessment",
      "Cross-Test Profile",
      "Personalized report 20+ halaman",
    ],
  };
}

function CapabilityRow({
  label,
  available,
}: {
  label: string;
  available: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <Badge tone={available ? "success" : "neutral"}>
        {available ? "Available" : "Not included"}
      </Badge>
    </div>
  );
}

export default async function AccessPlansPage() {
  const session = await getCurrentSession();

  if (!session) redirect("/login?next=/access");

  const [catalog, addOns, products, entitlements, quote, reassessment] =
    await Promise.all([
      getCommercialCatalog(),
      getB2CAddOnCatalog(),
      getActiveProductsForUser(session.user.id),
      listUserEntitlements(session.user.id),
      getUpgradeQuote(session.user.id),
      Promise.all(
        TESTS.map((test) =>
          getReassessmentEligibility(session.user.id, test.type),
        ),
      ),
    ]);

  const entitlementKeys = new Set(
    entitlements.map((item) =>
      keyFor(item.type, item.resourceType, item.resourceKey),
    ),
  );

  const currentTier = quote.currentTier;
  const currentRank = currentTier
    ? planOrder.indexOf(currentTier as (typeof planOrder)[number])
    : -1;
  const hasPaidAccess = products.some((product) => product.tier !== "FREE");


  const profileAvailable = entitlementKeys.has(
    keyFor("PROFILE_ACCESS", "FEATURE", "CROSS_TEST_PROFILE_V1"),
  );

  const resultAccessCount = TESTS.filter((test) =>
    entitlementKeys.has(resultKey(test.key)),
  ).length;

  const reportAvailable = entitlementKeys.has(
    keyFor("REPORT_ACCESS", "FEATURE", "ADVANCED_REPORT_V1"),
  );

  const activeAddOnKeys = new Set(
    entitlements
      .filter((item) => item.sourceKind === "ADD_ON")
      .map((item) => item.resourceKey),
  );

  const customerPlans = catalog
    .filter((product) => product.customerFacing)
    .sort(
      (a, b) =>
        planOrder.indexOf(a.tier as (typeof planOrder)[number]) -
        planOrder.indexOf(b.tier as (typeof planOrder)[number]),
    );

  return (
    <CustomerPageShell
      userName={session.user.name}
      eyebrow="Access & Plans"
      title="Akses yang Anda punya, pilihan berikutnya yang tersedia"
      description="Mulai dari akses aktif Anda. Setelah itu, lihat capability yang sudah termasuk dan pilihan untuk mendapatkan akses tambahan."
    >
      <div className="space-y-8 pb-10">
        <section aria-labelledby="current-access-title">
          <Card tone="accent" className="px-5 py-6 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
              <div>
                <p className="rs-eyebrow">1 · Current access</p>
                <h2 id="current-access-title" className="mt-2 text-2xl font-black">
                  {currentTier
                    ? products.map((product) => product.name).join(", ")
                    : "Belum ada paket berbayar aktif"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Ini adalah akses yang benar-benar aktif pada akun Anda saat ini.
                  Statusnya berasal dari entitlement ReadyScore, bukan dari tampilan
                  halaman ini.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={hasPaidAccess ? "success" : "neutral"}>
                    {hasPaidAccess ? "ACTIVE" : "FREE / NO PAID PLAN"}
                  </Badge>
                  {profileAvailable ? (
                    <Badge tone="accent">Profiling available</Badge>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-white/85 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Current plan
                </p>
                <p className="mt-2 text-xl font-black">
                  {currentTier ?? "Free / belum membeli"}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {currentTier
                    ? "Pilihan di bawahnya tidak perlu dibeli ulang."
                    : "Pilih capability yang Anda perlukan untuk mulai."}
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section aria-labelledby="capabilities-title">
          <div className="mb-4">
            <p className="rs-eyebrow">2 · Included capabilities</p>
            <h2 id="capabilities-title" className="rs-title mt-1 text-2xl">
              Apa yang sudah termasuk?
            </h2>
            <p className="rs-subtitle mt-2 max-w-3xl">
              Gunakan bagian ini untuk memahami akses Anda tanpa perlu menebak
              dari nama paket.
            </p>
          </div>

          <Card className="px-5 py-5 sm:px-6">
            <div className="grid gap-x-8 gap-y-2 lg:grid-cols-2">
              {TESTS.map((test) => (
                <CapabilityRow
                  key={test.key}
                  label={test.label}
                  available={entitlementKeys.has(testKey(test.key))}
                />
              ))}
              <CapabilityRow
                label="Assessment results"
                available={resultAccessCount > 0}
              />
              <CapabilityRow
                label="Cross-Test Profile"
                available={profileAvailable}
              />
              <CapabilityRow
                label="Personalized Report"
                available={reportAvailable}
              />
            </div>
          </Card>
        </section>

        <section aria-labelledby="assessment-access-title">
          <div className="mb-4">
            <p className="rs-eyebrow">3 · Assessment access</p>
            <h2 id="assessment-access-title" className="rs-title mt-1 text-2xl">
              Akses assessment per jenis
            </h2>
            <p className="rs-subtitle mt-2 max-w-3xl">
              Status di sini mencerminkan entitlement yang sudah ada.
              Assessment yang belum dimiliki dapat dibeli langsung.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {TESTS.map((test, index) => {
              const active = entitlementKeys.has(testKey(test.key));
              const resultActive = entitlementKeys.has(resultKey(test.key));
              const eligibility = reassessment[index];
              return (
                <Card key={test.key} className="px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="rs-eyebrow">{test.key}</p>
                      <h3 className="mt-1 text-lg font-black">{test.label}</h3>
                    </div>
                    <Badge tone={active ? "success" : "neutral"}>
                      {active ? "Sudah dimiliki" : "Available to buy"}
                    </Badge>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {active
                      ? "Assessment tersedia untuk akun Anda."
                      : "Belum dimiliki. Klik Beli untuk melanjutkan pembayaran."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {active ? (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/assessments/${test.type}/pre-test`}
                          className="rs-button rs-button-primary"
                        >
                          Mulai Assessment
                        </Link>
                        <button
                          type="button"
                          disabled
                          className="rs-button rs-button-secondary cursor-not-allowed opacity-60"
                        >
                          Sudah dibeli
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/checkout/product-basic?testType=${encodeURIComponent(test.sku === "RS-SINGLE-IQ-V1" ? "IQ" : test.key)}`}
                        className="rs-button rs-button-primary"
                      >
                        Beli
                      </Link>
                    )}

                    {active && resultActive ? (
                      <span className="rs-badge rs-badge-neutral">Hasil aktif</span>
                    ) : null}

                    {active && eligibility?.eligible ? (
                      <Link
                        href={`/reassessment/${test.type}`}
                        className="rs-button rs-button-ghost"
                      >
                        Retake Assessment
                      </Link>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="plans-title" id="plans" className="scroll-mt-24">
          <div className="mb-4">
            <p className="rs-eyebrow">4 · Upgrade / get more</p>
            <h2 id="plans-title" className="rs-title mt-1 text-2xl">
              Pilih capability berikutnya
            </h2>
            <p className="rs-subtitle mt-2 max-w-3xl">
              Pilih berdasarkan kebutuhan: satu assessment, semua assessment,
              atau semua assessment dengan Cross-Test Profile.
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {customerPlans.map((product) => {
              const rank = planOrder.indexOf(
                product.tier as (typeof planOrder)[number],
              );
              const isCurrent = currentTier === product.tier;
              const isUpgrade = currentTier != null && rank > currentRank;
              const isBelowCurrent = currentTier != null && rank < currentRank;
              const copy = planCopy(product.tier);
              const option = quote.options?.find(
                (item) => item.targetTier === product.tier,
              );

              return (
                <Card
                  key={product.id}
                  className={
                    isCurrent
                      ? "border-indigo-300 bg-indigo-50/30 px-5 py-6 ring-2 ring-indigo-100"
                      : "px-5 py-6"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="rs-eyebrow">{copy.eyebrow}</p>
                      <h3 className="mt-1 text-xl font-black">{product.name}</h3>
                    </div>
                    {isCurrent ? <Badge tone="success">Current</Badge> : null}
                    {!isCurrent && isUpgrade ? (
                      <Badge tone="accent">Upgrade</Badge>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {copy.promise}
                  </p>

                  <p className="mt-5 text-2xl font-black">
                    {rupiah(product.priceIdr)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Harga mengikuti commercial catalog aktif.
                  </p>

                  <ul className="mt-5 space-y-2 text-sm text-slate-600">
                    {copy.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="font-black text-indigo-600">✓</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {option ? (
                    <div className="mt-5 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                        Upgrade differential
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        +{rupiah(option.differentialIdr)}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-6">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-indigo-400 opacity-70"
                      >
                        Sudah dibeli
                      </button>
                    ) : isBelowCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-400 opacity-70"
                      >
                        Sudah termasuk
                      </button>
                    ) : product.tier === "BASIC" ? (
                      <Link
                        href="#single-test"
                        className="rs-button rs-button-primary w-full"
                      >
                        Beli
                      </Link>
                    ) : (
                      <Link
                        href={`/checkout/${product.id}`}
                        className="rs-button rs-button-primary w-full"
                      >
                        Beli
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="single-test-title"
          id="single-test"
          className="scroll-mt-24"
        >
          <div className="mb-4">
            <p className="rs-eyebrow">Single Test</p>
            <h2 id="single-test-title" className="rs-title mt-1 text-2xl">
              Dapatkan satu assessment
            </h2>
            <p className="rs-subtitle mt-2">
              Single Test tetap merupakan pilihan assessment tertentu, bukan
              perubahan terhadap commercial tier atau entitlement rules.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {TESTS.map((test) => {
              const active = entitlementKeys.has(testKey(test.key));
              return (
                <Card key={test.key} className="px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="rs-eyebrow">{test.key}</p>
                      <h3 className="mt-1 text-lg font-black">{test.label}</h3>
                    </div>
                    <Badge tone={active ? "success" : "neutral"}>
                      {active ? "Sudah dimiliki" : "Available to buy"}
                    </Badge>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {active
                      ? "Akses sudah tersedia pada akun Anda."
                      : "Belum dimiliki. Klik Beli untuk melanjutkan pembayaran."}
                  </p>

                  <div className="mt-4">
                    {active ? (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/assessments/${test.type}/pre-test`}
                          className="rs-button rs-button-secondary"
                        >
                          Mulai Assessment
                        </Link>
                        <span
                          aria-disabled="true"
                          className="rs-button rs-button-secondary cursor-not-allowed opacity-60"
                        >
                          Sudah dibeli
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={`/checkout/product-basic?testType=${encodeURIComponent(test.sku === "RS-SINGLE-IQ-V1" ? "IQ" : test.key)}`}
                        className="rs-button rs-button-primary"
                      >
                        Beli
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {quote.options?.length ? (
          <section aria-labelledby="upgrade-options-title">
            <Card className="px-5 py-6 sm:px-6">
              <p className="rs-eyebrow">Upgrade path</p>
              <h2 id="upgrade-options-title" className="mt-1 text-xl font-black">
                Upgrade yang tersedia untuk akun Anda
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Differential di bawah berasal dari existing upgrade service.
                ReadyScore tidak menghitung harga baru di halaman ini.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {quote.options.map((option) => (
                  <div
                    key={option.targetTier}
                    className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{option.targetName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Differential {rupiah(option.differentialIdr)}
                        </p>
                      </div>
                      <Badge tone="accent">Upgrade</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Pembayaran dan fulfillment diproses melalui Midtrans/commercial flow.
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        ) : null}

        {addOns.length ? (
          <section aria-labelledby="addons-title">
            <Card className="px-5 py-6 sm:px-6">
              <p className="rs-eyebrow">Optional extensions</p>
              <h2 id="addons-title" className="mt-1 text-xl font-black">
                Capability extensions
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Add-on ditampilkan sebagai extension terpisah dan tidak mengubah
                tier utama. Status aktif hanya membaca entitlement yang sudah ada.
              </p>

              <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {addOns
                  .filter(
                    (addOn) =>
                      !addOn.entitlements.some((item) =>
                        entitlementKeys.has(
                          keyFor(item.type, item.resourceType, item.resourceKey),
                        ),
                      ),
                  )
                  .slice(0, 6)
                  .map((addOn) => {
                  const active = addOn.entitlements.some((item) =>
                    activeAddOnKeys.has(item.resourceKey),
                  );

                  return (
                    <div
                      key={addOn.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-black">{addOn.name}</p>
                        <Badge tone={active ? "success" : "neutral"}>
                          {active ? "Active" : "Available"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-slate-500">
                        {addOn.description}
                      </p>
                      <p className="mt-3 text-sm font-black">
                        {rupiah(addOn.priceIdr)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        ) : null}

        <section aria-labelledby="purchase-boundary-title">
          <Card id="plans-help" className="px-5 py-6 sm:px-6">
            <p className="rs-eyebrow">5 · Purchase boundary</p>
            <h2 id="purchase-boundary-title" className="mt-1 text-xl font-black">
              Checkout dan entitlement tetap terpisah
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Tombol Beli langsung membuka pembayaran. Akses baru aktif setelah pembayaran
              dan fulfillment yang terverifikasi diproses oleh commercial flow ReadyScore.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/assessments" className="rs-button rs-button-secondary">
                Lihat assessments
              </Link>
              <Link href="/app" className="rs-button rs-button-secondary">
                Kembali ke overview
              </Link>
            </div>
          </Card>
        </section>

      </div>
    </CustomerPageShell>
  );
}

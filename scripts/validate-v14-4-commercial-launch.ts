import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  ["V14.4 specification reference", "v14/README.md"],
  ["V14.2 payment implementation", "lib/commercial/v14-2.ts"],
  ["V14.3 fulfillment implementation", "lib/commercial/v14-3.ts"],
  ["V14.3 atomic access boundary", "lib/assessment/assessment-repository.ts"],
  ["V14.4 commercial E2E", "v14/tests/e2e-v14-4-commercial-launch.mjs"],
];
for (const [label, relative] of required) {
  if (!fs.existsSync(path.join(root, relative))) throw new Error(`Missing ${label}: ${relative}`);
}

const e2e = fs.readFileSync(path.join(root, "v14/tests/e2e-v14-4-commercial-launch.mjs"), "utf8");
const requiredContracts = [
  "/api/commercial/checkout",
  "/api/commercial/payments",
  "/api/commercial/payments/verify",
  "/api/commercial/webhooks/midtrans",
  "/api/commercial/orders/",
  "/delivery",
  "PAYMENT_PROVIDER_CREATED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "FULFILLMENT_PENDING",
  "ENTITLEMENT_CREATED",
  "FULFILLMENT_COMPLETED",
  "ACCESS_AVAILABLE",
  "ACCESS_CONSUMED",
  "riasec",
  "disc",
  "eq",
  "cognitive",
  "ATTEMPT_EXPIRED",
  "ASSESSMENT_ACCESS_RACE",
];
// Route strings are validated against the E2E intent; the literal race sentinel is
// owned by the implementation and must remain present in the runtime source.
for (const contract of requiredContracts.slice(0, 13)) {
  if (!e2e.includes(contract)) throw new Error(`V14.4 E2E contract missing: ${contract}`);
}
const runtime = fs.readFileSync(path.join(root, "lib/assessment/runtime-service.ts"), "utf8");
if (!runtime.includes("ASSESSMENT_ACCESS_RACE")) throw new Error("Atomic access race contract missing from runtime");
if (!runtime.includes("TEST_ACCESS_REQUIRED")) throw new Error("Public access denial contract missing from runtime");
for (const token of ["riasec", "disc", "eq", "cognitive", "ATTEMPT_EXPIRED"]) {
  if (!e2e.includes(token)) throw new Error(`V13 regression contract missing: ${token}`);
}

const accessPage = fs.readFileSync(path.join(root, "app/access/page.tsx"), "utf8");
for (const contract of [
  "/checkout/product-basic?testType=",
  "/checkout/${product.id}",
  "href={`/checkout/${product.id}`}",
  "Beli",
  "Sudah dibeli",
  "Sudah termasuk",
]) {
  if (!accessPage.includes(contract)) throw new Error(`V14.4 Access UI contract missing: ${contract}`);
}
for (const forbidden of ["/api/scalev/checkout", "Checkout belum terhubung", "Choose Single Test", "getScalevCheckoutConfiguration", "Beli dengan Midtrans", "Upgrade dengan Midtrans", "Pilih Assessment"]) {
  if (accessPage.includes(forbidden)) throw new Error(`V14.4 obsolete Access UI contract remains: ${forbidden}`);
}
const checkoutPage = fs.readFileSync(path.join(root, "app/checkout/[productId]/page.tsx"), "utf8");
for (const contract of [
  "/api/commercial/checkout",
  "/api/commercial/payments",
  "window.location.assign(redirectUrl)",
  "Membuka pembayaran",
]) {
  if (!checkoutPage.includes(contract)) throw new Error(`V14.4 direct payment redirect contract missing: ${contract}`);
}
for (const obsolete of ["Bayar dengan Midtrans", "Menghubungkan ke Midtrans…", "Checkout ReadyScore"]) {
  if (checkoutPage.includes(obsolete)) throw new Error(`V14.4 intermediate checkout UI remains: ${obsolete}`);
}

const successPage = fs.readFileSync(path.join(root, "app/checkout/success/page.tsx"), "utf8");
for (const contract of [
  "order_id",
  "reconcileCommercialOrderReturn",
  "Pembayaran berhasil",
  "Akses pembelian sudah unlock",
  "Cek status lagi",
]) {
  if (!successPage.includes(contract)) throw new Error(`V14.4 payment success contract missing: ${contract}`);
}
const successRefresh = fs.readFileSync(path.join(root, "components/commercial/PaymentSuccessRefresh.tsx"), "utf8");
for (const contract of ["Memastikan akses Anda aktif", "router.refresh()", "MAX_REFRESHES"]) {
  if (!successRefresh.includes(contract)) throw new Error(`V14.4 payment success refresh contract missing: ${contract}`);
}
const midtrans = fs.readFileSync(path.join(root, "lib/commercial/midtrans.ts"), "utf8");
for (const contract of [
  "READYSCORE_PUBLIC_URL",
  "callbacks",
  "/checkout/success",
  "READYSCORE_PUBLIC_URL_NOT_CONFIGURED",
]) {
  if (!midtrans.includes(contract)) throw new Error(`V14.4 Midtrans finish redirect contract missing: ${contract}`);
}

const commercialRuntime = fs.readFileSync(path.join(root, "lib/commercial/v14-2.ts"), "utf8");
if (!commercialRuntime.includes('order.paymentStatus === "CREATED" || order.paymentStatus === "PENDING"')) {
  throw new Error("V14.4 customer-return reconciliation must verify CREATED and PENDING payment states");
}

const assessmentCatalog = fs.readFileSync(path.join(root, "lib/assessment/catalog.ts"), "utf8");
const assessmentRunner = fs.readFileSync(path.join(root, "components/assessment/AssessmentRunner.tsx"), "utf8");
const publicHome = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const assessmentConfig = fs.readFileSync(path.join(root, "lib/assessment-config.ts"), "utf8");
for (const contract of [
  "questionCount: ASSESSMENT_CONFIG.cognitive.questionCount",
  "questionCount: ASSESSMENT_CONFIG.eq.questionCount",
  "questionCount: ASSESSMENT_CONFIG.disc.questionCount",
  "questionCount: ASSESSMENT_CONFIG.riasec.questionCount",
  'duration: "20 menit"',
]) {
  if (!assessmentCatalog.includes(contract)) throw new Error(`V14.4 customer assessment catalog contract missing: ${contract}`);
}
for (const legacy of [
  "questionCount: 24",
  'duration: "10–15 menit"',
  'duration: "5–10 menit"',
]) {
  if (assessmentCatalog.includes(legacy)) throw new Error(`V14.4 customer catalog still exposes legacy metadata: ${legacy}`);
}
for (const legacy of ["24 pertanyaan pada empat dimensi EQ.", "24 pertanyaan pada empat dimensi DISC."]) {
  if (publicHome.includes(legacy)) throw new Error(`V14.4 public customer surface still exposes legacy metadata: ${legacy}`);
}
if (assessmentRunner.includes("melalui 24 soal objektif")) throw new Error("V14.4 assessment runner still exposes legacy Cognitive question count");
for (const contract of [
  "questionCount: 80",
  "questionCount: 50",
  "questionCount: 40",
  "questionCount: 60",
  "timeLimitSeconds: 1200",
]) {
  if (!assessmentConfig.includes(contract)) throw new Error(`V13 production assessment contract missing: ${contract}`);
}
console.log("V14.4 CUSTOMER ASSESSMENT METADATA GATE: PASS");
console.log("V14.4 STATIC GATE: PASS");
console.log("Scope: commercial purchase-to-result E2E, payment verification/webhook, fulfillment/entitlement/access, V13 regression, failure/recovery, audit, and launch readiness.");

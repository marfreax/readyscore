import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
let failed = false;
function pass(label, ok) { console.log(`${ok ? "PASS" : "FAIL"} — ${label}`); if (!ok) failed = true; }
const access = read("app/access/page.tsx");
const resultsPage = read("app/results/page.tsx");
const entitlementService = read("lib/commercial/entitlement-service.ts");
const reassessmentPage = read("app/reassessment/[type]/page.tsx");
const profileService = read("lib/profile/service.ts");
const profileEngine = read("lib/profile/engine-v1.ts");
const wa = read("lib/profile/adapters/work-attitude.ts");
const lp = read("lib/profile/adapters/learning-preference.ts");
const checkout = read("lib/scalev/checkout.ts");
const scalev = read("lib/scalev/config.ts");
const addOnCheckoutRoute = read("app/api/commercial/add-on-checkout/route.ts");
const reassessmentCheckoutPage = read("app/checkout/reassessment-credit/page.tsx");
const reassessmentCheckoutComponent = read("components/commercial/ReassessmentCreditCheckout.tsx");
const commercialCheckout = read("lib/commercial/v14-1.ts");
const commercialPayment = read("lib/commercial/v14-2.ts");
const commercialFulfillment = read("lib/commercial/v14-3.ts");
const addOnCatalog = read("lib/commercial/add-on-catalog.ts");
const reassessmentMigration = read("prisma/migrations/20260827151000_v5_l8_reassessment/migration.sql");
pass("Six assessment types in Access & Plans", access.includes('"WORK_ATTITUDE"') && access.includes('"LEARNING_PREFERENCE"') && (access.match(/key: "[A-Z_]+", label:/g) || []).length === 6);
pass("Completed history also activates result state", access.includes("latestCompletedByType.get(test.key)") && access.includes("Boolean(latestCompletedByType.get(test.key))"));
pass("Learning Preference capability is not duplicated", !access.includes("label=\"Learning Preference\""));
pass("Completed result opens View Result", access.includes("View Result") && access.includes("resultActive") && access.includes("Boolean(latestCompletedByType.get(test.key))"));
pass("Completed result does not offer direct Start", access.includes("resultActive && latestCompletedByType.get(test.key)") && access.includes("Tambah Credit · Rp49.000"));
pass("Access distinguishes missing reassessment credit from same-day daily limit",
  access.includes('eligibility?.code === "REASSESSMENT_CREDIT_REQUIRED"') &&
  access.includes('eligibility?.code === "REASSESSMENT_DAILY_LIMIT"') &&
  access.includes("Credit tersedia · Retake besok"));
pass("Profile consumes Work Attitude", profileService.includes('"WORK_ATTITUDE"'));
pass("Profile consumes Learning Preference", profileService.includes('"LEARNING_PREFERENCE"'));
pass("Work Attitude profile adapter registered", profileEngine.includes("workAttitudeProfileAdapter") && wa.includes('testType: "WORK_ATTITUDE"'));
pass("Learning Preference profile adapter registered", profileEngine.includes("learningPreferenceProfileAdapter") && lp.includes('testType: "LEARNING_PREFERENCE"'));
pass("Resilience evidence mapping", wa.includes('domain: "RESILIENCE"') && wa.includes("PENYESUAIAN_DIRI"));
pass("Strength evidence mapping", wa.includes('domain: "STRENGTH"'));
pass("Learning evidence mapping", lp.includes('domain: "LEARNING"') && lp.includes('scoreSemantics: "PREFERENCE"'));
pass("Observed patterns Indonesian", profileEngine.includes("Evidence tersedia pada") && profileEngine.includes("Evidence minat tersedia pada"));
pass("Six reassessment checkout SKUs", checkout.includes("RS-REASSESSMENT-CREDIT-COGNITIVE-V1") && checkout.includes("RS-REASSESSMENT-CREDIT-LEARNING_PREFERENCE-V1"));
pass("Six reassessment fulfillment mappings", scalev.includes("WORK_ATTITUDE") && scalev.includes("LEARNING_PREFERENCE"));
pass("Midtrans reassessment checkout route",
  addOnCheckoutRoute.includes("createReassessmentCreditCheckoutOrder") &&
  addOnCheckoutRoute.includes('"/api/commercial/add-on-checkout"') === false &&
  reassessmentCheckoutPage.includes("/checkout/reassessment-credit") &&
  reassessmentCheckoutComponent.includes("/api/commercial/add-on-checkout") &&
  reassessmentCheckoutComponent.includes("/api/commercial/payments") &&
  reassessmentCheckoutComponent.includes("redirectUrl") &&
  commercialPayment.includes("createProviderPayment") &&
  commercialPayment.includes('PROVIDER = "MIDTRANS"'));
pass("Commercial order supports add-on payment",
  commercialCheckout.includes('orderKind: "REASSESSMENT_CREDIT"') &&
  commercialCheckout.includes("addOnProductId") &&
  commercialCheckout.includes("unitPriceIdrSnapshot: unitPriceIdr"));
pass("Midtrans paid order grants reassessment credit",
  commercialFulfillment.includes("fulfillReassessmentCreditOrder") &&
  commercialFulfillment.includes("REASSESSMENT_CREDIT_GRANTED") &&
  commercialPayment.includes("fulfillPaidOrder"));
pass("Add-on catalog is live through Midtrans",
  addOnCatalog.includes('id: "addon-reassessment-credit-v1"') &&
  addOnCatalog.includes("planningPriceIdr: 49_000") &&
  reassessmentMigration.includes("addon-reassessment-credit-v1") &&
  reassessmentMigration.includes("49000") &&
  addOnCheckoutRoute.includes("ADD_ON_PRICE_NOT_CONFIGURED"));
pass("Single Test exposes Work Attitude + Learning Preference purchase",
  access.includes('"WORK_ATTITUDE"') && access.includes('"LEARNING_PREFERENCE"'));
pass("Reassessment route supports all six assessment types",
  read("app/reassessment/[type]/page.tsx").includes("work-attitude") &&
  read("app/reassessment/[type]/page.tsx").includes("learning-preference") &&
  read("app/reassessment/[type]/page.tsx").includes("Work Attitude") &&
  read("app/reassessment/[type]/page.tsx").includes("Learning Preference"));
pass("Reassessment start API supports Work Attitude + Learning Preference",
  read("app/api/assessment/reassessment/start/route.ts").includes("work-attitude") &&
  read("app/api/assessment/reassessment/start/route.ts").includes("learning-preference"));
pass("Reassessment runtime supports Work Attitude + Learning Preference",
  read("lib/assessment/runtime-service.ts").includes('"work-attitude"') &&
  read("lib/assessment/runtime-service.ts").includes('"learning-preference"'));
const runtimeService = read("lib/assessment/runtime-service.ts");
pass("DISC runtime rejects invalid response model",
  runtimeService.includes("validateSelectedQuestionPresentation") &&
  runtimeService.includes("DISC_RESPONSE_MODEL_INVALID") &&
  runtimeService.includes("question.answerType !== \"SINGLE_CHOICE_4\"") &&
  runtimeService.includes("question.options.length !== 4"));
pass("Reassessment runtime maps Work Attitude to Prisma enum",
  runtimeService.includes('"work-attitude": "WORK_ATTITUDE"'));
pass("Reassessment runtime maps Learning Preference to Prisma enum",
  runtimeService.includes('"learning-preference": "LEARNING_PREFERENCE"'));
const runner = read("components/assessment/AssessmentRunner.tsx");
pass("DISC forced-choice is an explicit runtime presentation boundary",
  runner.includes('const isDiscForcedChoice=Boolean(isDisc && question?.answerType==="SINGLE_CHOICE_4"') &&
  runner.includes('isDisc ?') &&
  runner.includes("DISC harus menggunakan empat pilihan forced-choice") &&
  runner.includes("(isDiscForcedChoice ? (question.options ?? []).map"));

pass("Access history canonicalizes hyphenated assessment types", access.includes("replace(/-/g, \"_\")") && access.includes("canonicalType"));
pass("Results entitlement keys canonicalize hyphenated assessment types", resultsPage.includes("replace(/-/g, \"_\")") && resultsPage.includes("function resultKey"));
pass("Completed result access reconciliation is implemented", entitlementService.includes("reconcileCompletedResultAccess") && entitlementService.includes("V19.2.1_COMPLETED_RESULT_RECONCILIATION") && entitlementService.includes("status: \"COMPLETED\""));
pass("ADVANCE/MEDIUM include Work Attitude in catalog matrix",
  read("lib/commercial/types.ts").includes('resourceKey: "WORK_ATTITUDE"') &&
  read("lib/commercial/types.ts").includes('tier: "ADVANCE"') &&
  read("lib/commercial/types.ts").includes('tier: "MEDIUM"'));
const waBundleMigration = read("prisma/migrations/20260929023000_v19_2_1_bundle_work_attitude_reconciliation/migration.sql");
pass("Work Attitude bundle entitlement reconciliation migration exists",
  waBundleMigration.includes("product-advance") &&
  waBundleMigration.includes("product-medium") &&
  waBundleMigration.includes("WORK_ATTITUDE") &&
  waBundleMigration.includes("V19.2.1_WORK_ATTITUDE_BUNDLE_RECONCILIATION"));
if (failed) process.exit(1);
console.log("V19.2.1 Profile + Access fixes gate: PASS");

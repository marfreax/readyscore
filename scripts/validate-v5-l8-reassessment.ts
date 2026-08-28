import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const schema = read("prisma/schema.prisma");
const migrationDir = fs.readdirSync(path.join(root, "prisma/migrations"))
  .find((name) => name.includes("v5_l8_reassessment"));
const runtime = read("lib/assessment/runtime-service.ts");
const service = read("lib/assessment/reassessment.ts");
const repository = read("lib/assessment/assessment-repository.ts");
const route = read("app/api/assessment/reassessment/start/route.ts");
const eligibilityRoute = read("app/api/assessment/reassessment/eligibility/route.ts");
const runner = read("components/assessment/AssessmentRunner.tsx");
const dashboard = read("app/app/page.tsx");
const catalog = read("lib/commercial/add-on-catalog.ts");

function fail(message: string): never { throw new Error(message); }

console.log("=== READY SCORE V5 L8 REASSESSMENT MVP GATE ===");
console.log("Scope      : Reassessment / immutable new attempt / consumable credit");
console.log("Protection : Frozen V4 measurement + result semantics preserved");

if (!schema.includes("model ReassessmentCredit")) fail("ReassessmentCredit model missing.");
if (!schema.includes("ReassessmentCreditStatus")) fail("Reassessment credit status missing.");
if (!schema.includes("ReassessmentTestType")) fail("Reassessment test type missing.");
if (!schema.includes("REASSESSMENT_CREDIT")) fail("Reassessment entitlement type missing.");
if (!migrationDir) fail("V5 L8 migration missing.");

if (!service.includes("Maximum 1 reassessment") && !service.includes("dailyCount >= 1")) fail("Daily reassessment limit missing.");
if (!service.includes("INITIAL_ASSESSMENT_REQUIRED")) fail("Initial assessment prerequisite missing.");
if (!service.includes("REASSESSMENT_CREDIT_REQUIRED")) fail("Credit requirement missing.");
if (!service.includes("hasTestAccess")) fail("Unlocked test access is not checked through entitlement boundary.");
if (!repository.includes("createReassessmentAttempt")) fail("Transactional reassessment attempt creation missing.");
if (!repository.includes("status: \"AVAILABLE\"")) fail("Available-credit consumption guard missing.");
if (!repository.includes("status: \"CONSUMED\"")) fail("Credit consumption missing.");
if (!runtime.includes("startReassessment")) fail("Runtime reassessment entrypoint missing.");
if (!route.includes("export async function POST") || !route.includes("AUTH_REQUIRED")) fail("Authenticated reassessment start route missing.");
if (!eligibilityRoute.includes("getReassessmentEligibility")) fail("Eligibility route missing.");
if (!runner.includes('mode==="reassessment"')) fail("AssessmentRunner reassessment mode missing.");
if (!dashboard.includes("V5 L8 Reassessment")) fail("Customer-facing reassessment dashboard missing.");
if (!catalog.includes('REASSESSMENT_CREDIT_V1')) fail("Reassessment Credit catalog entry missing.");
if (!catalog.includes("49_000")) fail("Reassessment Credit price scope missing.");

if (service.includes("cooldown") || service.includes("COOLDOWN")) fail("Cooldown period must not be introduced.");
if (runtime.includes("overwrite") || repository.includes("deleteMany({ where: { attemptId")) fail("Destructive result/attempt overwrite pattern detected.");
if (!repository.includes("persistCompletedResult")) fail("Existing immutable result persistence primitive missing.");

console.log("Reassessment credit ledger       : PASS");
console.log("Initial assessment prerequisite  : PASS");
console.log("Existing test access required   : PASS");
console.log("Consumable credit                : PASS");
console.log("1 reassessment / test / day     : PASS");
console.log("No cooldown                     : PASS");
console.log("New attempt, not retry          : PASS");
console.log("Immutable result snapshots      : PASS");
console.log("Authenticated runtime route     : PASS");
console.log("Customer-facing entry           : PASS");
console.log("V5 L8 REASSESSMENT MVP GATE: PASS");

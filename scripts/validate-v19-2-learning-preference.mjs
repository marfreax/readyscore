import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root,p), "utf8");
let failed = false;
function pass(label, ok) { console.log(`${ok ? "PASS" : "FAIL"} — ${label}`); if (!ok) failed = true; }

const schema = read("prisma/schema.prisma");
const config = read("lib/assessment-config.ts");
const contract = read("lib/assessment/runtime-contract.ts");
const questionEngine = read("lib/assessment/question-engine.ts");
const scoring = read("lib/assessment/scoring/engine-v2.ts");
const semantics = read("lib/assessment/result/semantics-v1.ts");
const interpretation = read("lib/assessment/learning-preference/interpretation.ts");
const resultEngine = read("lib/assessment/result/engine-v1.ts");
const commercial = read("lib/commercial/types.ts");
const checkout = read("app/checkout/[productId]/page.tsx");
const runner = read("components/assessment/AssessmentRunner.tsx");
const runtimeService = read("lib/assessment/runtime-service.ts");
const questionEngineSource = read("lib/assessment/question-engine.ts");
const packageRuntime = read("lib/question-package-runtime.ts");
const repository = read("lib/assessment/assessment-repository.ts");
const commercialRuntime = read("lib/commercial/v14-3.ts");
const adminConfig = read("components/admin/AssessmentConfigurationWorkspace.tsx");
const adminBank = read("components/admin/UnifiedQuestionBankWorkspace.tsx");
const migration = read("prisma/migrations/20260927151000_v19_2_learning_preference_data/migration.sql");

pass("AssessmentType LEARNING_PREFERENCE", schema.includes("LEARNING_PREFERENCE"));
pass("Learning Preference config", config.includes('"learning-preference"') && config.includes("questionCount: 30") && config.includes("LEARNING_PREFERENCE_SCORE_V1"));
pass("Runtime contract", contract.includes('"learning-preference"') && contract.includes("LEARNING_PREFERENCE"));
pass("Three preference selection", questionEngine.includes('"VISUAL", "AUDITORY", "KINESTHETIC"') && questionEngine.includes("quota = 10"));
pass("Scoring engine", scoring.includes("createLearningPreferenceEngine") && scoring.includes("LEARNING_PREFERENCE_RESULT_V1"));
pass("Result semantics", semantics.includes("LEARNING_PREFERENCE") && semantics.includes("LEARNING_PREFERENCE_INTERPRETATION_V1"));
pass("Interpretation registry", interpretation.includes("LEARNING_PREFERENCE_INTERPRETATION_V1") && resultEngine.includes("learningPreferenceInterpretationEngine"));
pass("Commercial access", commercial.includes("LEARNING_PREFERENCE") && commercial.includes("product-medium") && commercial.includes("product-advance"));
pass("Customer checkout/runtime", checkout.includes("LEARNING_PREFERENCE") && runner.includes("learning-preference"));
pass("Runtime enum mapping", [runtimeService, questionEngineSource, packageRuntime, repository].every(source => source.includes("learning-preference") && source.includes("LEARNING_PREFERENCE")));
pass("Active attempt resume", runtimeService.includes("findActiveAttemptForUser") && runtimeService.includes("activeAttempt") && repository.includes("findActiveAttemptForUser"));
pass("Entitlement recovery for incomplete attempts", commercialRuntime.includes('if (hasCompletedResult) return null') && commercialRuntime.includes('usageConsumed: { decrement: 1 }') && commercialRuntime.includes('only permanently spent'));
pass("Bundle runtime reconciliation", commercialRuntime.includes("product-medium") && commercialRuntime.includes("product-advance") && commercialRuntime.includes("V19_RUNTIME_BUNDLE_RECONCILIATION") && commercialRuntime.includes("V19_RUNTIME_ORDER_RECONCILIATION") && commercialRuntime.includes("resourceKey: { in: [\"COGNITIVE\", \"EQ\", \"DISC\", \"RIASEC\", \"WORK_ATTITUDE\"] }"));
pass("Completed assessment remains locked", commercialRuntime.includes('status: \"COMPLETED\"') && commercialRuntime.includes('result: { isNot: null }') && commercialRuntime.includes('const hasCompletedResult = Boolean(completed)') && commercialRuntime.includes('if (hasCompletedResult) return null'));
pass("Persisted enum normalization", runtimeService.includes('replace(/_/g, "-")') && runtimeService.includes("LEARNING_PREFERENCE"));
pass("Paid pre-test identity", runner.includes('type==="learning-preference"?"Learning Preference"') && runner.includes('type==="learning-preference"?"30"') && runner.includes('type==="learning-preference"?"20 menit"') && runner.includes('type==="learning-preference"?"Mulai Assessment Learning Preference"'));
pass("Admin configuration/question bank", adminConfig.includes("LEARNING_PREFERENCE") && adminBank.includes("LEARNING_PREFERENCE"));
pass("Database migration", migration.includes("learning-preference-v1") && migration.includes("taxonomy-learning-preference-v1"));
const accessReconciliation = read("prisma/migrations/20260927200000_v19_2_access_reconciliation/migration.sql");
const recoveryMigration = read("prisma/migrations/20260927220000_v19_2_failed_runtime_attempt_recovery/migration.sql");
pass("V19 result-access reconciliation", accessReconciliation.includes("WORK_ATTITUDE") && accessReconciliation.includes("LEARNING_PREFERENCE") && accessReconciliation.includes("RESULT_ACCESS"));
pass("Failed runtime attempt recovery", recoveryMigration.includes("LEARNING_PREFERENCE") && recoveryMigration.includes("usageConsumed" ) && recoveryMigration.includes("ABANDONED") && recoveryMigration.includes("V19.2_%"));
pass("30 questions", (migration.match(/lp-qv-/g) || []).length === 30);
pass("10 questions per preference", ["VISUAL","AUDITORY","KINESTHETIC"].every(d => (migration.match(new RegExp(`'${d}','${d}_CORE'`, "g")) || []).length === 10));

if (failed) process.exit(1);
console.log("V19.2 Learning Preference gate: PASS");

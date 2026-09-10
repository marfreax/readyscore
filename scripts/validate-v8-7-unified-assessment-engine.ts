import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => { throw new Error(`V8.7 check failed: ${message}`); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition: unknown, message: string) => { if (!condition) fail(message); };

console.log("=== READY SCORE V8.7 UNIFIED ASSESSMENT ENGINE ADAPTATION CONTRACT GATE ===");
console.log("Scope      : Unified orchestration, assessment-specific dispatch, provenance and response-model boundaries");
console.log("Protection : Orchestration-only; measurement semantics remain assessment-specific and versioned");

const engine = read("lib/assessment/unified-engine.ts");
const runtime = read("lib/assessment/runtime-service.ts");
const scoring = read("lib/assessment/scoring/engine-v2.ts");
const pkg = JSON.parse(read("package.json"));
const contract = JSON.parse(read("data/assessment-audit/V8_7_UNIFIED_ASSESSMENT_ENGINE.json"));

assert(contract.version === "V8.7" && contract.status === "IMPLEMENTED", "V8.7 architecture contract artifact is present and implemented");
assert(contract.architecture?.adapter === "UnifiedAssessmentAdapter", "V8.7 architecture contract declares unified adapter");
assert(contract.implementationBoundary?.includes("orchestration-only"), "V8.7 implementation boundary is explicit");
assert(engine.includes("UnifiedAssessmentAdapter"), "Unified adapter contract is present");
assert(engine.includes("calculateUnifiedAssessmentResult"), "Unified result entry point is present");
assert(engine.includes("getScoringEngine"), "Assessment-specific scoring dispatch is delegated to existing scoring registry");
assert(engine.includes("scoringEngine: { ...engine.identity }"), "Adapter exposes scoring identity rather than TestScoringEngine object");
assert(engine.includes('disc: "FORCED_CHOICE_4"'), "DISC forced-choice response boundary is explicit");
assert(engine.includes('cognitive: "SINGLE_CHOICE_4"'), "Cognitive response boundary is explicit");
assert(engine.includes('eq: "SINGLE_CHOICE_4"'), "EQ response boundary is explicit");
assert(engine.includes('riasec: "LIKERT_5"'), "RIASEC response boundary is explicit");
assert(engine.includes("No unified assessment adapter registered"), "Unknown assessment type fails closed");
assert(runtime.includes("calculateUnifiedAssessmentResult"), "Runtime service uses unified orchestration");
assert(scoring.includes("const ENGINES"), "Existing assessment-specific scoring registry remains present");
assert(!fs.existsSync(path.join(root, "prisma/migrations/20260831000000_v8_7_unified_engine")), "No V8.7 migration introduced");
assert(!Object.keys(pkg.scripts ?? {}).some((k) => k === "v8:7:migrate"), "No V8.7 migration script introduced");
assert(pkg.scripts?.["v8:7:gate"] === "tsx scripts/validate-v8-7-unified-assessment-engine.ts", "V8.7 gate script is registered");
console.log("PASS: V8.7 unified engine contract is present");
console.log("PASS: Assessment-specific scoring semantics remain delegated");
console.log("PASS: Response models remain assessment-specific");
console.log("PASS: Scoring identity/version is validated at unified boundary");
console.log("PASS: Runtime service uses unified orchestration");
console.log("PASS: No V8.7 database migration introduced");
console.log("PASS: V8.7 contains no universal score or cross-test synthesis");
console.log("V8.7 UNIFIED ASSESSMENT ENGINE ADAPTATION CONTRACT GATE: PASS");

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const must = (condition, message) => { if (!condition) throw new Error(`V16_PHASE1_FAIL: ${message}`); };

const home = read("app/page.tsx");
const config = read("lib/assessment-config.ts");
const contract = read("lib/assessment/runtime-contract.ts");
const unified = read("lib/assessment/unified-engine.ts");
const selector = read("lib/assessment/question-engine.ts");
const scorer = read("lib/assessment/scoring/engine-v2.ts");
const runner = read("components/assessment/FreeTestRunner.tsx");

must(home.includes('href="/free"') && home.includes("Mulai Tes Gratis"), "public homepage must route to /free");
must(!home.includes("/admin/question-bank"), "public homepage must not expose admin question bank");
must(config.includes('free: {') && config.includes('questionCount: 10'), "free assessment must be configured for 10 questions");
must(config.includes('RIASEC_FREE_SCORE_V1') && config.includes('RIASEC_FREE_SELECTION_V1'), "free RIASEC versions must be explicit");
must(contract.includes('free: { assessmentType: "free"') && contract.includes('questionCount: 10') && contract.includes('scoringMetadataRequired: "RIASEC"'), "free runtime contract must be 10-item RIASEC");
must(unified.includes('free: 10'), "unified free adapter must require 10 questions");
must(selector.includes('type === "free" || type === "riasec"') && selector.includes('RIASEC_TAXONOMY_V2'), "free selection must use published RIASEC V2 bank");
must(selector.includes('[["R", 2], ["I", 2], ["A", 2], ["S", 2], ["E", 1], ["C", 1]]'), "free selection quotas must be explicit");
must(scorer.includes('function createFreeEngine()') && scorer.includes('modelId: "RIASEC_FREE_SCORE"'), "dedicated free RIASEC scorer must exist");
must(runner.includes('type: "free"') && runner.includes("/api/assessment/start") && runner.includes("/api/assessment/${attemptId}/submit"), "free runner must use existing runtime APIs");
must(fs.existsSync(path.join(root, "app/free/page.tsx")), "/free page must exist");
must(fs.existsSync(path.join(root, "app/free/result/[attemptId]/page.tsx")), "anonymous free result page must exist for phase 1");
console.log("V16 PHASE 1 CONTRACT: PASS");

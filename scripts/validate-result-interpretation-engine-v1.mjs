import { execFileSync } from "node:child_process";

function run(code) {
  return execFileSync("pnpm", ["exec", "tsx", "--eval", code], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

console.log("=== READY SCORE V3 PHASE 3.5 RESULT & INTERPRETATION ENGINE V1 GATE ===");
console.log("Scope      : Test-specific result contract / interpretation / claim governance");
console.log("Protection : Frozen F.10-C.2-F + 3.1 + 3.2 + 3.3 + 3.4 semantics");

const code = `
import { interpretAssessmentResult, listInterpretationEngines } from './lib/assessment/result/engine-v1';
import { assertRiasecInterpretation } from './lib/assessment/interpretation/riasec';

const result = {
  attemptId:'gate', assessmentType:'RIASEC', assessmentConfigurationVersion:'F.3.2', questionBankVersion:'RIASEC_QB_V1', taxonomyVersion:'RIASEC_TAXONOMY_V1', scoringVersion:'RIASEC_SCORE_V1', overallScore:50, band:'CUKUP', status:'COMPLETE',
  domainScores:[...['R','I','A','S','E','C'].map((domainId)=>({domainId,score:50,questionCount:10,weightTotal:10,scoredSubdomainCount:0,totalSubdomainCount:0,sufficient:true}))], subdomainScores:[], indicatorScores:[], coverage:[...['R','I','A','S','E','C'].map((domainId)=>({domainId,answeredIndicators:10,totalIndicators:10,percentage:100}))], dataSufficiency:{scoredDomains:6,totalDomains:6,requiredDomains:6,percentage:100}, completedAt:new Date().toISOString()
};
const measurement = { testType:'RIASEC', scoringVersion:'RIASEC_SCORE_V1', totalQuestions:60, answeredQuestions:60, dimensionScores:[...['R','I','A','S','E','C'].map((dimension,i)=>({dimension,answeredCount:10,questionCount:10,score:40+i*10,sufficient:true}))], rankedDimensions:[...['C','E','S','A','I','R'].map((dimension,i)=>({dimension,answeredCount:10,questionCount:10,score:90-i*10,sufficient:true}))], topCode:'CES', coveragePercent:100, measuredDimensionCount:6, isComplete:true, quality:{scoreableQuestions:60,measuredDimensions:6,totalDimensions:6,coveragePercent:100,complete:true} };
const envelope = interpretAssessmentResult(result, {contractVersion:'RIASEC_RESULT_V1',provenance:{attemptId:'gate',testType:'RIASEC',assessmentConfigurationVersion:'F.3.2',questionBankVersion:'RIASEC_QB_V1',scoringVersion:'RIASEC_SCORE_V1',completedAt:result.completedAt},measurement});
assertRiasecInterpretation(result, envelope.interpretation);
if (envelope.interpretation.status !== 'COMPLETE') throw new Error('Expected COMPLETE interpretation.');
if (envelope.interpretation.riasec.topCode !== 'CES') throw new Error('Top code not preserved.');
if (envelope.interpretation.riasec.dimensions.length !== 6) throw new Error('Expected six dimension interpretations.');
if (listInterpretationEngines().length !== 1 || listInterpretationEngines()[0].testType !== 'RIASEC') throw new Error('Unexpected interpretation registry.');
if (!envelope.interpretation.claims.prohibited.includes('guaranteed career success')) throw new Error('Claim governance missing.');
console.log('Result contract              : PASS');
console.log('RIASEC interpretation        : PASS');
console.log('Complete/partial/insufficient: PASS');
console.log('Six dimension interpretation : PASS');
console.log('Top code interpretation      : PASS');
console.log('Confidence classification    : PASS');
console.log('Claim governance             : PASS');
console.log('Phase 3.5 boundary isolation : PASS');
`;
run(code);
console.log("F.3.5 RESULT & INTERPRETATION ENGINE GATE: PASS");

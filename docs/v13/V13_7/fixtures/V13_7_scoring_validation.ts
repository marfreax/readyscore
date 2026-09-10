import assert from "node:assert/strict";
import { scoreRiasec } from "../../lib/assessment/riasec/scoring";
import type { RiasecQuestion } from "../../lib/assessment/riasec/types";
import { scoreDisc } from "../../lib/assessment/disc/scoring";
import type { DiscQuestion } from "../../lib/assessment/disc/scoring";
import { scoreEq } from "../../lib/assessment/eq/scoring";
import type { EqQuestion } from "../../lib/assessment/eq/scoring";
import { scoreCognitive } from "../../lib/assessment/cognitive/scoring";
import type { CognitiveQuestion, CognitiveOptionValue } from "../../lib/assessment/cognitive/scoring";
import { calculateRuntimeAssessmentResult } from "../../lib/assessment/scoring/engine-v2";

const META = {
  attemptId: "V13_7_FIXTURE",
  assessmentConfigurationVersion: "V13.4",
  questionBankVersion: "V13.5-CANDIDATE",
  taxonomyVersion: "V2",
  completedAt: "2026-09-07T00:00:00.000Z",
};

function expectClose(actual:number, expected:number, label:string) {
  assert.equal(actual, expected, `${label}: expected ${expected}, received ${actual}`);
}

function riasecQuestions(): RiasecQuestion[] {
  return (["R","I","A","S","E","C"] as const).flatMap((dimension) =>
    Array.from({length:10}, (_,i) => ({
      id:`R-${dimension}-${i+1}`, code:`R-${dimension}-${i+1}`,
      dimension, reverseScore:false, weight:1
    }))
  );
}
function discQuestions(): DiscQuestion[] {
  return Array.from({length:80}, (_,i) => ({
    id:`D-${i+1}`, code:`D-${i+1}`, dimension:"DISC",
    subdomain:( ["TARGET_D","TARGET_I","TARGET_S","TARGET_C"] as const)[Math.floor(i/20)],
    reverseScore:false, weight:1, answerType:"SINGLE_CHOICE_4" as const,
    options:["A","B","C","D"], scoringKey:[1,2,3,4]
  }));
}
function eqQuestions(): EqQuestion[] {
  const dims = [
    ["EMOTION_AWARENESS",13],["EMOTION_REGULATION",13],
    ["EMPATHY_SOCIAL_AWARENESS",12],["RELATIONSHIP_SOCIAL_RESPONSE",12]
  ] as const;
  return dims.flatMap(([dimension,count]) => Array.from({length:count}, (_,i) => ({
    id:`EQ-${dimension}-${i+1}`, code:`EQ-${dimension}-${i+1}`, dimension,
    reverseScore:false, weight:1, answerType:"SINGLE_CHOICE_4" as const,
    options:["A","B","C","D"], scoringKey:[1,2,3,4]
  })));
}
function cognitiveQuestions(): CognitiveQuestion[] {
  return (["VERBAL_REASONING","NUMERICAL_REASONING","LOGICAL_REASONING","ABSTRACT_REASONING"] as const).flatMap((dimension) =>
    Array.from({length:10}, (_,i) => ({
      id:`C-${dimension}-${i+1}`, code:`C-${dimension}-${i+1}`, dimension,
      answerType:"SINGLE_CHOICE_4" as const, options:["A","B","C","D"], correctOption:1 as CognitiveOptionValue, weight:1
    }))
  );
}

const rq = riasecQuestions();
const rqAnswers = rq.map(q => ({questionId:q.id,value:3 as const}));
const rr = scoreRiasec(rq, rqAnswers);
assert.equal(rr.totalQuestions,60); rr.dimensionScores.forEach(d => expectClose(d.score!,50,`RIASEC ${d.dimension}`));
assert.equal(rr.topCode,"RIA");

const dq = discQuestions();
const dqAnswers = dq.map(q => ({questionId:q.id,value:1 as const}));
const dr = scoreDisc(dq, dqAnswers);
assert.equal(dr.dimensionScores.find(d=>d.dimension==="D")?.score,100);
assert.equal(dr.dimensionScores.filter(d=>d.dimension!=="D").every(d=>d.score===0),true);

const eq = eqQuestions();
const eqAnswers = eq.map(q => ({questionId:q.id,value:4 as const}));
const er = scoreEq(eq, eqAnswers);
assert.equal(eq.length,50); er.dimensionScores.forEach(d => expectClose(d.score,100,`EQ ${d.dimension}`)); expectClose(er.overallScore,100,"EQ overall");

const cq = cognitiveQuestions();
const cqAnswers = cq.map(q => ({questionId:q.id,value:1 as const}));
const cr = scoreCognitive(cq, cqAnswers);
assert.equal(cq.length,40); cr.dimensionScores.forEach(d => expectClose(d.score,100,`Cognitive ${d.dimension}`)); expectClose(cr.overallScore,100,"Cognitive overall");

const common = (scoringVersion:string, completionMode:"SUBMITTED"|"TIMEOUT"="SUBMITTED") => ({...META, scoringVersion, completionMode});
const genericQuestion = (q:any, overrides:any={}) => ({...q, domain:q.dimension ?? q.subdomain ?? q.domain, subdomain:q.subdomain ?? null, indicator:null,
  type:"V13_7_FIXTURE", scale:[1,2,3,4,5], status:"PUBLISHED", mappingStatus:"APPROVED", version:"1", ...overrides});

const rEngineQuestions = rq.map(q => genericQuestion(q,{answerType:"LIKERT_5",options:null,scoringKey:[1,2,3,4,5]}));
const rEngine = calculateRuntimeAssessmentResult("riasec",rEngineQuestions,rqAnswers,common("RIASEC_SCORE_V2"));
assert.equal(rEngine.assessmentType,"RIASEC"); assert.equal(rEngine.scoringVersion,"RIASEC_SCORE_V2");

const dEngineQuestions = dq.map(q => genericQuestion(q,{domain:"DISC"}));
const dEngine = calculateRuntimeAssessmentResult("disc",dEngineQuestions,dqAnswers,common("DISC_SCORE_V2"));
assert.equal(dEngine.assessmentType,"DISC"); assert.equal(dq.length,80);

const eEngineQuestions = eq.map(q => genericQuestion(q,{domain:q.dimension}));
const eEngine = calculateRuntimeAssessmentResult("eq",eEngineQuestions,eqAnswers,common("EQ_SCORE_V2"));
assert.equal(eEngine.assessmentType,"EQ"); assert.equal(eq.length,50);

const cEngineQuestions = cq.map(q => genericQuestion(q,{domain:q.dimension}));
const cEngine = calculateRuntimeAssessmentResult("cognitive",cEngineQuestions,cqAnswers,common("COGNITIVE_SCORE_V2"));
assert.equal(cEngine.assessmentType,"COGNITIVE"); assert.equal(cq.length,40);

console.log("V13.7 scoring fixture: PASS — actual scoring functions and engine wrappers accept production shapes.");

const half = <T extends {id:string}>(qs:T[]) => qs.slice(0, Math.floor(qs.length/2));
const partialR = scoreRiasec(rq, rqAnswers.slice(0,30));
assert.equal(partialR.isComplete, false);
const partialD = scoreDisc(dq, dqAnswers.slice(0,40)); assert.equal(partialD.dimensionScores.reduce((s,d)=>s+d.answeredCount,0),40);
const partialE = scoreEq(eq, eqAnswers.slice(0,25)); assert.equal(partialE.dimensionScores.reduce((s,d)=>s+d.answeredCount,0),25);
const partialC = scoreCognitive(cq, cqAnswers.slice(0,20)); assert.equal(partialC.dimensionScores.reduce((s,d)=>s+d.answeredCount,0),20);
console.log("V13.7 timeout/partial scoring semantics fixture: PASS — unanswered items remain unanswered.");

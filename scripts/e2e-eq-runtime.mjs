import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
function fail(message){throw new Error(message);}
async function request(pathname, options={}, retries=pathname==="/api/assessment/start"?3:0){
  try{
    const response=await fetch(`${baseUrl}${pathname}`,{headers:{"content-type":"application/json",...(options.headers??{})},...options});
    let body=null; try{body=await response.json();}catch{}
    if(response.status===404&&retries>0){await new Promise(r=>setTimeout(r,500));return request(pathname,options,retries-1);}
    return {response,body};
  }catch(error){
    if(retries>0){await new Promise(r=>setTimeout(r,500));return request(pathname,options,retries-1);}
    throw error;
  }
}

console.log("=== READY SCORE V8.4 EQ INSTRUMENT ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${baseUrl}`);
console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
console.log("Mutation : EQ assessment attempt / answers / result only");

const bank=JSON.parse(fs.readFileSync(path.join(process.cwd(),"data/question-bank/eq/EQ_V2_SJT_PRODUCTION_BANK.json"),"utf8"));
const bankByCode=new Map(bank.map(item=>[item.code,item]));

const start=await request("/api/assessment/start",{method:"POST",body:JSON.stringify({type:"eq"})});
if(!start.response.ok||!start.body?.ok)fail(`Start failed: HTTP ${start.response.status} ${JSON.stringify(start.body)}`);
const attemptId=start.body.attemptId;
const questions=Array.isArray(start.body.questions)?start.body.questions:[];
if(!attemptId)fail("Start response did not return attemptId.");
if(questions.length!==24)fail(`EQ runtime returned ${questions.length} questions; expected exactly 24.`);
console.log("Start + question count    : PASS (24)");

const dims=["EMOTION_AWARENESS","EMOTION_REGULATION","EMPATHY_SOCIAL_AWARENESS","RELATIONSHIP_SOCIAL_RESPONSE"];
const counts=Object.fromEntries(dims.map(d=>[d,0]));
for(const q of questions){
  const d=String(q.domain??"").trim().toUpperCase();
  if(!(d in counts))fail(`Invalid EQ dimension ${d} in ${q.id}`);
  counts[d]++;
  if(q.answerType!=="SINGLE_CHOICE_4")fail(`EQ question ${q.id} answerType mismatch: ${q.answerType}`);
  if(!Array.isArray(q.options)||q.options.length!==4)fail(`EQ question ${q.id} must expose four options.`);
  if("correctOption" in q)fail(`EQ runtime leaked correctOption for ${q.id}.`);
  if("scoringKey" in q)fail(`EQ runtime leaked scoringKey for ${q.id}.`);
  const source=bankByCode.get(q.code);
  if(!source)fail(`Runtime question ${q.code} is absent from V8.4 bank.`);
}
for(const d of dims)if(counts[d]!==6)fail(`${d} runtime count ${counts[d]}; expected 6.`);
console.log("Dimension distribution    : PASS (6/6/6/6)");
console.log("Customer scoring metadata : PASS (keys hidden)");

const invalid=await request(`/api/assessment/${encodeURIComponent(attemptId)}/answer`,{
  method:"POST",body:JSON.stringify({questionId:questions[0].id,value:5})
});
if(invalid.response.ok)fail("EQ accepted invalid answer value 5; expected rejection.");
console.log("Answer boundary 1–4      : PASS");

for(const q of questions){
  const answer=await request(`/api/assessment/${encodeURIComponent(attemptId)}/answer`,{
    method:"POST",body:JSON.stringify({questionId:q.id,value:1})
  });
  if(!answer.response.ok||!answer.body?.ok)fail(`Answer failed for ${q.id}: HTTP ${answer.response.status} ${JSON.stringify(answer.body)}`);
}
console.log("24 answer submissions     : PASS");

const view=await request(`/api/assessment/${encodeURIComponent(attemptId)}`);
if(!view.response.ok||!view.body?.ok)fail(`Reload failed: HTTP ${view.response.status} ${JSON.stringify(view.body)}`);
if(view.body.progress?.answered!==24)fail(`Progress mismatch: ${JSON.stringify(view.body.progress)}`);
console.log("Persistence / reload      : PASS");

const submit=await request(`/api/assessment/${encodeURIComponent(attemptId)}/submit`,{method:"POST"});
if(!submit.response.ok||!submit.body?.ok)fail(`Submit failed: HTTP ${submit.response.status} ${JSON.stringify(submit.body)}`);
const result=submit.body.result;
if(!result)fail("Submit response missing result.");

const measurement=result.eq?.measurement;
if(result.eq?.contractVersion!=="EQ_RESULT_V2")fail(`Unexpected result contract: ${result.eq?.contractVersion}`);
if(!measurement)fail("EQ measurement missing.");
if(measurement.testType!=="EQ")fail(`Unexpected testType: ${measurement.testType}`);
if(measurement.scoringVersion!=="EQ_SCORE_V2")fail(`Unexpected scoring version: ${measurement.scoringVersion}`);
if(!Array.isArray(measurement.dimensionScores)||measurement.dimensionScores.length!==4)fail("Expected four EQ dimension scores.");

const expectedByDimension={};
for(const d of dims){
  const items=questions.filter(q=>q.domain===d).map(q=>bankByCode.get(q.code));
  const expected=Math.round((((items.reduce((sum,item)=>sum+item.scoringKey[0],0)/items.length)-1)/3)*100);
  expectedByDimension[d]=expected;
  const actual=measurement.dimensionScores.find(x=>x.dimension===d);
  if(!actual)fail(`Missing EQ dimension ${d}.`);
  if(actual.answeredCount!==6||actual.questionCount!==6)fail(`Coverage mismatch for ${d}.`);
  if(actual.score!==expected)fail(`EQ keyed score mismatch for ${d}: expected ${expected}, got ${actual.score}`);
}
const expectedOverall=Math.round(Object.values(expectedByDimension).reduce((a,b)=>a+b,0)/4);
if(measurement.overallScore!==expectedOverall)fail(`Overall score mismatch: expected ${expectedOverall}, got ${measurement.overallScore}`);
if(result.interpretation?.interpretationVersion!=="EQ_INTERPRETATION_V2")fail(`Unexpected interpretation version: ${result.interpretation?.interpretationVersion}`);

console.log("Keyed ordinal scoring      : PASS");
console.log("Dimension + overall result : PASS");
console.log("Interpretation             : PASS (EQ_INTERPRETATION_V2)");
console.log("V8.4 EQ INSTRUMENT ACTUAL RUNTIME E2E: PASS");
console.log(`Attempt ID                 : ${attemptId}`);

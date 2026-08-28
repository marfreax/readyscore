const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
function fail(message){throw new Error(message);}
async function request(path, options={}, retries=path==="/api/assessment/start"?3:0){
  try {
    const response=await fetch(`${baseUrl}${path}`,{headers:{"content-type":"application/json",...(options.headers??{})},...options});
    let body=null;try{body=await response.json();}catch{}
    if (response.status===404 && retries>0){await new Promise((resolve)=>setTimeout(resolve,500));return request(path,options,retries-1);}
    return{response,body};
  } catch(error) {
    if(retries>0){await new Promise((resolve)=>setTimeout(resolve,500));return request(path,options,retries-1);}
    throw error;
  }
}
console.log("=== READY SCORE V4 L6 COGNITIVE ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${baseUrl}`);
console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
console.log("Mutation : Cognitive assessment attempt / answers / result only");

const start=await request("/api/assessment/start",{method:"POST",body:JSON.stringify({type:"cognitive"})});
if(!start.response.ok||!start.body?.ok)fail(`Start failed: HTTP ${start.response.status} ${JSON.stringify(start.body)}`);
console.log("Start route reachability : PASS");
const attemptId=start.body.attemptId;
const questions=Array.isArray(start.body.questions)?start.body.questions:[];
if(!attemptId)fail("Start response did not return attemptId.");
if(questions.length!==24)fail(`Cognitive runtime returned ${questions.length} questions; expected exactly 24.`);
const dims=["VERBAL_REASONING","NUMERICAL_REASONING","LOGICAL_REASONING","ABSTRACT_REASONING"];
const counts=Object.fromEntries(dims.map(d=>[d,0]));
for(const q of questions){const d=String(q.domain??"").trim().toUpperCase();if(!(d in counts))fail(`Invalid Cognitive dimension in runtime question ${q.id}: ${d}`);counts[d]++;if(!q.id)fail("Runtime question missing id.");}
for(const d of dims)if(counts[d]!==6)fail(`${d} runtime count is ${counts[d]}; expected 6.`);
console.log("Question selection        : PASS");
console.log("Dimension distribution    : PASS (6/6/6/6)");

for(const q of questions){
  const answer=await request(`/api/assessment/${encodeURIComponent(attemptId)}/answer`,{method:"POST",body:JSON.stringify({questionId:q.id,value:3})});
  if(!answer.response.ok||!answer.body?.ok)fail(`Answer failed for ${q.id}: HTTP ${answer.response.status} ${JSON.stringify(answer.body)}`);
}
console.log("24 answer submissions     : PASS");

const view=await request(`/api/assessment/${encodeURIComponent(attemptId)}`);
if(!view.response.ok||!view.body?.ok)fail(`Attempt reload failed: HTTP ${view.response.status} ${JSON.stringify(view.body)}`);
if(!view.body.progress||view.body.progress.answered!==24)fail(`Attempt progress mismatch: ${JSON.stringify(view.body.progress)}`);
console.log("Persistence / reload      : PASS");

const submit=await request(`/api/assessment/${encodeURIComponent(attemptId)}/submit`,{method:"POST"});
if(!submit.response.ok||!submit.body?.ok)fail(`Submit failed: HTTP ${submit.response.status} ${JSON.stringify(submit.body)}`);
const result=submit.body.result;
if(!result)fail("Submit response did not contain result.");
console.log("Submit + scoring          : PASS");

const cognitive=result.cognitive;
const measurement=cognitive?.measurement;
if(!cognitive||cognitive.contractVersion!=="COGNITIVE_RESULT_V1")fail("Result does not expose COGNITIVE_RESULT_V1.");
if(!measurement)fail("Result does not expose Cognitive measurement.");
if(measurement.testType!=="COGNITIVE")fail(`Unexpected Cognitive testType: ${measurement.testType}`);
if(measurement.scoringVersion!=="COGNITIVE_SCORE_V1")fail(`Unexpected Cognitive scoring version: ${measurement.scoringVersion}`);
if(!Array.isArray(measurement.dimensionScores)||measurement.dimensionScores.length!==4)fail("Cognitive result does not expose exactly four dimension scores.");
for(const d of dims){const item=measurement.dimensionScores.find(x=>x.dimension===d);if(!item)fail(`Missing Cognitive dimension ${d}.`);if(typeof item.score!=="number")fail(`Cognitive dimension ${d} score is not numeric.`);if(item.answeredCount!==6||item.questionCount!==6)fail(`Cognitive dimension ${d} coverage mismatch.`);}
if(typeof measurement.overallScore!=="number")fail("Cognitive overall score is not numeric.");
if(result.interpretation?.interpretationVersion!=="COGNITIVE_INTERPRETATION_V1")fail(`Unexpected Cognitive interpretation version: ${result.interpretation?.interpretationVersion}`);
console.log("Result payload            : PASS");
console.log("Cognitive measurement     : PASS (4 dimensions + overall + scoring version)");
console.log("Cognitive interpretation  : PASS (COGNITIVE_INTERPRETATION_V1)");
console.log("V4 L6 COGNITIVE ACTUAL RUNTIME E2E: PASS");
console.log(`Attempt ID                : ${attemptId}`);

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
function fail(message){throw new Error(message);}
async function request(path, options={}, retries=path==="/api/assessment/start"?3:0){
  try {
    const response=await fetch(`${baseUrl}${path}`,{headers:{"content-type":"application/json",...(options.headers??{})},...options});
    let body=null;try{body=await response.json();}catch{}
    if (response.status===404 && retries>0) {
      await new Promise((resolve)=>setTimeout(resolve,500));
      return request(path,options,retries-1);
    }
    return{response,body};
  } catch (error) {
    if (retries>0) { await new Promise((resolve)=>setTimeout(resolve,500)); return request(path,options,retries-1); }
    throw error;
  }
}

console.log("=== READY SCORE V4 L5 EQ ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${baseUrl}`);
console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
console.log("Mutation : EQ assessment attempt / answers / result only");

const start=await request("/api/assessment/start",{method:"POST",body:JSON.stringify({type:"eq"})});
if(!start.response.ok||!start.body?.ok)fail(`Start failed: HTTP ${start.response.status} ${JSON.stringify(start.body)}`);
console.log("Start route reachability : PASS");
const attemptId=start.body.attemptId;
const questions=Array.isArray(start.body.questions)?start.body.questions:[];
if(!attemptId)fail("Start response did not return attemptId.");
if(questions.length!==24)fail(`EQ runtime returned ${questions.length} questions; expected exactly 24.`);
const dims=["EMOTION_AWARENESS","EMOTION_REGULATION","EMPATHY_SOCIAL_AWARENESS","RELATIONSHIP_SOCIAL_RESPONSE"];
const counts=Object.fromEntries(dims.map(d=>[d,0]));
for(const q of questions){const d=String(q.domain??"").trim().toUpperCase();if(!(d in counts))fail(`Invalid EQ dimension in runtime question ${q.id}: ${d}`);counts[d]++;if(!q.id)fail("Runtime question missing id.");}
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

const eq=result.eq;
const measurement=eq?.measurement;
if(!eq||eq.contractVersion!=="EQ_RESULT_V1")fail("Result does not expose EQ_RESULT_V1.");
if(!measurement)fail("Result does not expose EQ measurement.");
if(measurement.testType!=="EQ")fail(`Unexpected EQ testType: ${measurement.testType}`);
if(measurement.scoringVersion!=="EQ_SCORE_V1")fail(`Unexpected EQ scoring version: ${measurement.scoringVersion}`);
if(!Array.isArray(measurement.dimensionScores)||measurement.dimensionScores.length!==4)fail("EQ result does not expose exactly four dimension scores.");
for(const d of dims){const item=measurement.dimensionScores.find(x=>x.dimension===d);if(!item)fail(`Missing EQ dimension ${d}.`);if(typeof item.score!=="number")fail(`EQ dimension ${d} score is not numeric.`);if(item.answeredCount!==6||item.questionCount!==6)fail(`EQ dimension ${d} coverage mismatch.`);}
if(typeof measurement.overallScore!=="number")fail("EQ overall score is not numeric.");
if(result.interpretation?.interpretationVersion!=="EQ_INTERPRETATION_V1")fail(`Unexpected EQ interpretation version: ${result.interpretation?.interpretationVersion}`);
console.log("Result payload            : PASS");
console.log("EQ measurement            : PASS (4 dimensions + overall + scoring version)");
console.log("EQ interpretation         : PASS (EQ_INTERPRETATION_V1)");
console.log("V4 L5 EQ ACTUAL RUNTIME E2E: PASS");
console.log(`Attempt ID                : ${attemptId}`);

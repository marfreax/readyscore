import { PrismaClient } from "@prisma/client";
const baseUrl=process.env.BASE_URL??"http://localhost:3000"; const prisma=new PrismaClient();
function fail(m){throw new Error(m)}
async function req(path,options={}){const r=await fetch(baseUrl+path,{headers:{"content-type":"application/json",...(options.headers??{})},...options});let b=null;try{b=await r.json()}catch{}return{r,b}}
try{
 console.log("=== READY SCORE V13.3 TIMED ATTEMPT / RESILIENCE E2E ==="); console.log(`Base URL : ${baseUrl}`); console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
 const started=await req("/api/assessment/start",{method:"POST",body:JSON.stringify({type:"disc"})}); if(!started.r.ok||!started.b?.ok)fail(`start failed ${started.r.status} ${JSON.stringify(started.b)}`);
 const id=started.b.attemptId, first=started.b.questions?.[0]; if(!id||!first)fail("start missing attempt/question");
 if(!started.b.timer?.expiresAt||started.b.timer.remainingSeconds<=0)fail("server timer missing");
 const before=started.b.snapshot?.package?.packageVersionId;
 const answer=await req(`/api/assessment/${id}/answer`,{method:"POST",body:JSON.stringify({questionId:first.id,value:1})}); if(!answer.r.ok||!answer.b?.saved)fail(`answer failed ${answer.r.status} ${JSON.stringify(answer.b)}`);
 const resumed=await req(`/api/assessment/${id}`); if(!resumed.r.ok||!resumed.b?.ok)fail("resume GET failed");
 if(resumed.b.attemptId && resumed.b.attemptId!==id)fail("attempt identity changed");
 if(resumed.b.snapshot?.package?.packageVersionId!==before)fail("package changed on resume");
 if(resumed.b.questions?.[0]?.sequence!==first.sequence)fail("question sequence changed on resume");
 if(resumed.b.questions?.find(q=>q.id===first.id)?.answer!==1)fail("saved answer missing on resume");
 console.log("refresh / reconnect / frozen package / answer persistence : PASS");
 await prisma.assessmentAttempt.update({where:{id},data:{expiresAt:new Date(Date.now()-1000)}});
 const expired=await req(`/api/assessment/${id}`); if(!expired.r.ok||!expired.b?.ok)fail(`expired GET failed ${expired.r.status} ${JSON.stringify(expired.b)}`);
 if(expired.b.attempt.status!=="EXPIRED")fail(`expected EXPIRED, got ${expired.b.attempt.status}`);
 if(!expired.b.result)fail("expired attempt did not produce result");
 const afterAnswer=await req(`/api/assessment/${id}/answer`,{method:"POST",body:JSON.stringify({questionId:first.id,value:2})}); if(afterAnswer.r.status!==422||afterAnswer.b?.error?.code!=="ATTEMPT_EXPIRED")fail("expired answer was not rejected authoritatively");
 console.log("server-authoritative timeout / auto-finalization / post-expiry answer rejection : PASS");
 console.log("V13.3 TIMED ATTEMPT / RESILIENCE RUNTIME E2E: PASS");
}finally{await prisma.$disconnect()}

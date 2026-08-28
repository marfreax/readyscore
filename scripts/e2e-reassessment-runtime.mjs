import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const root = process.cwd();
const authFile = path.join(root, "data", "auth-state.json");
const prisma = new PrismaClient();

function fail(message){throw new Error(message);}
async function request(pathname, options={}, cookie=""){
  const response=await fetch(`${baseUrl}${pathname}`,{
    headers:{"content-type":"application/json",...(cookie?{"cookie":cookie}:{}),...(options.headers??{})},
    ...options
  });
  let body=null;try{body=await response.json();}catch{}
  return{response,body};
}

const type="eq";
const suffix=Date.now().toString();
const userId=`e2e_reassessment_${randomBytes(8).toString("hex")}`;
const sessionId=`ses_${randomBytes(24).toString("hex")}`;
const email=`e2e-reassessment-${suffix}@readyscore.local`;
const now=new Date();
let auth;
try{
  auth=fs.existsSync(authFile)?JSON.parse(fs.readFileSync(authFile,"utf8")):{version:1,users:[],sessions:[]};
  auth.users.push({
    id:userId,name:"E2E Reassessment",email,passwordHash:"e2e-only",role:"USER",
    createdAt:now.toISOString(),updatedAt:now.toISOString()
  });
  auth.sessions=auth.sessions.filter(x=>new Date(x.expiresAt)>now);
  auth.sessions.push({id:sessionId,userId,createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+86400000).toISOString()});
  fs.mkdirSync(path.dirname(authFile),{recursive:true});
  fs.writeFileSync(authFile,JSON.stringify(auth,null,2));

  // Mirror the auth-store user into PostgreSQL before creating FK-backed entitlements.
  await prisma.user.create({
    data:{
      id:userId,name:"E2E Reassessment",email,passwordHash:"e2e-only",role:"USER",
      createdAt:now,updatedAt:now
    }
  });

  // Make the test explicitly unlocked and seed one consumable reassessment credit.
  await prisma.userEntitlement.create({
    data:{
      userId,type:"TEST_ACCESS",resourceType:"TEST_TYPE",resourceKey:"EQ",
      source:"E2E_REASSESSMENT",status:"ACTIVE"
    }
  });
  await prisma.reassessmentCredit.create({
    data:{
      userId,addOnProductId:"addon-reassessment-credit-v1",testType:"EQ",
      source:"E2E_REASSESSMENT"
    }
  });

  const cookie=`readyscore_session=${sessionId}`;

  const initial=await request("/api/assessment/start",{method:"POST",body:JSON.stringify({type}),},cookie);
  if(!initial.response.ok||!initial.body?.ok)fail(`Initial start failed: HTTP ${initial.response.status} ${JSON.stringify(initial.body)}`);
  const initialId=initial.body.attemptId;
  const initialQuestions=initial.body.questions??[];
  if(initialQuestions.length!==24)fail(`Initial assessment returned ${initialQuestions.length} questions; expected 24.`);
  for(const q of initialQuestions){
    const a=await request(`/api/assessment/${encodeURIComponent(initialId)}/answer`,{method:"POST",body:JSON.stringify({questionId:q.id,value:3})},cookie);
    if(!a.response.ok||!a.body?.ok)fail(`Initial answer failed for ${q.id}: HTTP ${a.response.status} ${JSON.stringify(a.body)}`);
  }
  const initialSubmit=await request(`/api/assessment/${encodeURIComponent(initialId)}/submit`,{method:"POST"},cookie);
  if(!initialSubmit.response.ok||!initialSubmit.body?.ok)fail(`Initial submit failed: HTTP ${initialSubmit.response.status} ${JSON.stringify(initialSubmit.body)}`);
  console.log("Initial assessment + result    : PASS");

  const reassess=await request("/api/assessment/reassessment/start",{method:"POST",body:JSON.stringify({type})},cookie);
  if(!reassess.response.ok||!reassess.body?.ok)fail(`Reassessment start failed: HTTP ${reassess.response.status} ${JSON.stringify(reassess.body)}`);
  if(reassess.body.mode!=="REASSESSMENT")fail("Reassessment mode marker missing.");
  const reassessmentId=reassess.body.attemptId;
  if(reassessmentId===initialId)fail("Reassessment reused the initial attempt ID.");
  const questions=reassess.body.questions??[];
  if(questions.length!==24)fail(`Reassessment returned ${questions.length} questions; expected 24.`);
  console.log("Reassessment new attempt       : PASS");

  const credit=await prisma.reassessmentCredit.findFirst({where:{userId,testType:"EQ"}});
  if(!credit||credit.status!=="CONSUMED"||credit.consumedAttemptId!==reassessmentId)fail("Reassessment credit was not consumed against the new attempt.");
  console.log("Credit consumption             : PASS");

  for(const q of questions){
    const a=await request(`/api/assessment/${encodeURIComponent(reassessmentId)}/answer`,{method:"POST",body:JSON.stringify({questionId:q.id,value:4})},cookie);
    if(!a.response.ok||!a.body?.ok)fail(`Reassessment answer failed for ${q.id}: HTTP ${a.response.status} ${JSON.stringify(a.body)}`);
  }
  const submit=await request(`/api/assessment/${encodeURIComponent(reassessmentId)}/submit`,{method:"POST"},cookie);
  if(!submit.response.ok||!submit.body?.ok)fail(`Reassessment submit failed: HTTP ${submit.response.status} ${JSON.stringify(submit.body)}`);
  const result=submit.body.result;
  if(!result||result.attemptId!==reassessmentId)fail("Reassessment result snapshot missing or points to the wrong attempt.");
  console.log("Reassessment result snapshot  : PASS");

  const old=await request(`/api/assessment/${encodeURIComponent(initialId)}`,{},cookie);
  if(!old.response.ok||!old.body?.ok||old.body.result?.attemptId!==initialId)fail("Original result was not preserved.");
  console.log("Original result immutable      : PASS");

  await prisma.reassessmentCredit.create({
    data:{
      userId,addOnProductId:"addon-reassessment-credit-v1",testType:"EQ",
      source:"E2E_REASSESSMENT_DAILY_LIMIT"
    }
  });
  const second=await request("/api/assessment/reassessment/start",{method:"POST",body:JSON.stringify({type})},cookie);
  if(second.response.status!==422||second.body?.error?.code!=="REASSESSMENT_DAILY_LIMIT"){
    fail(`Second same-day reassessment should hit the daily limit; got HTTP ${second.response.status} ${JSON.stringify(second.body)}`);
  }
  console.log("Second same-day reassessment   : PASS (daily limit)");

  console.log("=== READY SCORE V5 L8 REASSESSMENT ACTUAL RUNTIME E2E: PASS ===");
  console.log(`Initial Attempt ID             : ${initialId}`);
  console.log(`Reassessment Attempt ID        : ${reassessmentId}`);
} finally {
  await prisma.$disconnect();
}

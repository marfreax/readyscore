import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();

// Match Next.js environment-file discovery without adding a runtime dependency.
// Highest-precedence local files are applied last; an already-exported process
// variable always wins over file values. This keeps the standalone E2E boundary
// aligned with the application's SCALEV_WEBHOOK_SIGNING_SECRET.
function readEnvFile(filename) {
  const file = path.join(root, filename);
  if (!fs.existsSync(file)) return {};
  const values = {};
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.replace(/^\uFEFF/, "").trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    let value = match[2].trim();

    // Strip only a trailing unquoted comment. Preserve # characters inside
    // quoted values because secrets may legally contain them.
    if (!value.startsWith("\"") && !value.startsWith("'")) {
      value = value.replace(/\s+#.*$/, "").trim();
    }

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[match[1]] = value;
  }
  return values;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const envFiles = [
  ".env",
  ".env.local",
  `.env.${nodeEnv}`,
  `.env.${nodeEnv}.local`,
];

const envFileValues = {};
for (const filename of envFiles) {
  Object.assign(envFileValues, readEnvFile(filename));
}

const baseUrl = process.env.BASE_URL ?? envFileValues.BASE_URL ?? "http://localhost:3000";
const authFile = path.join(root, "data", "auth-state.json");
const secret = process.env.SCALEV_WEBHOOK_SIGNING_SECRET ?? envFileValues.SCALEV_WEBHOOK_SIGNING_SECRET;
function fail(message){throw new Error(message);}
if (!secret) fail("SCALEV_WEBHOOK_SIGNING_SECRET is required for paid E2E (set it in environment or .env/.env.local).");
const prisma = new PrismaClient();
async function request(pathname, options={}, cookie=""){
  const response=await fetch(`${baseUrl}${pathname}`,{redirect:"manual",headers:{"content-type":"application/json",...(cookie?{cookie}:{}),...(options.headers??{})},...options});
  let body=null; try{body=await response.json();}catch{}
  return {response,body};
}
function signed(payload){
  const raw=Buffer.from(JSON.stringify(payload));
  const signature=crypto.createHmac("sha256",secret).update(raw).digest("base64");
  return {raw,signature};
}
async function paidOrder({sku,email,name="L11 Paid Customer",phone="081234567890",orderId=`l11-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`}={}){
  const created={event:"order.created",unique_id:`${orderId}-created`,timestamp:new Date().toISOString(),data:{order_id:orderId,customer:{id:`cust-${orderId}`,name,email,phone},orderlines:[{variant_sku:sku,quantity:1}],payment_status:"paid",paid_time:new Date().toISOString()}};
  const c=signed(created);
  let r=await fetch(`${baseUrl}/api/scalev/webhook`,{method:"POST",headers:{"content-type":"application/json","X-Scalev-Hmac-Sha256":c.signature},body:c.raw});
  if(!r.ok) fail(`order.created failed: HTTP ${r.status} ${await r.text()}`);
  const payment={event:"payment.received",unique_id:`${orderId}-payment`,timestamp:new Date().toISOString(),data:{order_id:orderId,payment_status:"paid",paid_time:new Date().toISOString()}};
  const p=signed(payment);
  r=await fetch(`${baseUrl}/api/scalev/webhook`,{method:"POST",headers:{"content-type":"application/json","X-Scalev-Hmac-Sha256":p.signature},body:p.raw});
  const body=await r.json().catch(()=>null);
  if(!r.ok||!body?.ok||body.status!=="PROCESSED") fail(`payment.received failed: HTTP ${r.status} ${JSON.stringify(body)}`);
  return {orderId,body};
}
async function claimHandoff(url){
  const r=await fetch(url,{redirect:"manual"});
  if(r.status!==307&&r.status!==302) fail(`handoff expected redirect, got ${r.status}`);
  const setCookie=r.headers.get("set-cookie")||"";
  const match=setCookie.match(/readyscore_session=([^;]+)/);
  if(!match) fail("handoff did not establish ReadyScore session cookie");
  return `readyscore_session=${match[1]}`;
}
async function runAssessment(type,cookie){
  const s=await request("/api/assessment/start",{method:"POST",body:JSON.stringify({type})},cookie);
  if(!s.response.ok||!s.body?.ok) fail(`${type} start failed: HTTP ${s.response.status} ${JSON.stringify(s.body)}`);
  const questions=s.body.questions??[];
  const expected=type==="riasec"?60:24;
  if(questions.length!==expected) fail(`${type} expected ${expected} questions, got ${questions.length}`);
  for(const q of questions){
    const a=await request(`/api/assessment/${encodeURIComponent(s.body.attemptId)}/answer`,{method:"POST",body:JSON.stringify({questionId:q.id,value:3})},cookie);
    if(!a.response.ok||!a.body?.ok) fail(`${type} answer failed: HTTP ${a.response.status} ${JSON.stringify(a.body)}`);
  }
  const sub=await request(`/api/assessment/${encodeURIComponent(s.body.attemptId)}/submit`,{method:"POST"},cookie);
  if(!sub.response.ok||!sub.body?.ok) fail(`${type} submit failed: HTTP ${sub.response.status} ${JSON.stringify(sub.body)}`);
  const result=await request(`/api/assessment/${encodeURIComponent(s.body.attemptId)}`,{},cookie);
  if(!result.response.ok||!result.body?.ok||!result.body.result) fail(`${type} result reload failed: HTTP ${result.response.status}`);
  return s.body.attemptId;
}

async function main(){
  console.log("=== READY SCORE V6 L11 PAID CUSTOMER ACTUAL RUNTIME E2E ===");
  console.log(`Base URL : ${baseUrl}`);
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  console.log("Payment  : SIGNED SCALEV payment.received boundary");

  const suffix=Date.now();
  const singleEmail=`l11-single-${suffix}@readyscore.local`;
  const single=await paidOrder({sku:"RS-SINGLE-EQ-V1",email:singleEmail});
  const singleSession=await claimHandoff(single.body.handoffUrl);
  const singleAttempt=await runAssessment("eq",singleSession);
  console.log("Scenario A — Single Test        : PASS");

  const allEmail=`l11-all-${suffix}@readyscore.local`;
  const all=await paidOrder({sku:"RS-ASSESSMENT-V1",email:allEmail});
  const allSession=await claimHandoff(all.body.handoffUrl);
  const allAttempts={};
  for(const type of ["cognitive","eq","disc","riasec"]) allAttempts[type]=await runAssessment(type,allSession);
  console.log("Scenario B — All Tests          : PASS");

  const profileEmail=`l11-profile-${suffix}@readyscore.local`;
  const profilePurchase=await paidOrder({sku:"RS-ALL-PROFILING-V1",email:profileEmail});
  const profileSession=await claimHandoff(profilePurchase.body.handoffUrl);
  for(const type of ["cognitive","eq","disc","riasec"]) await runAssessment(type,profileSession);
  const profile=await request("/api/profile/cross-test",{},profileSession);
  if(!profile.response.ok||!profile.body?.ok) fail(`profiling failed: HTTP ${profile.response.status} ${JSON.stringify(profile.body)}`);
  if(profile.body.profile?.contractVersion!=="CROSS_TEST_PROFILE_V1") fail("profiling contract missing");
  if(profile.body.profile?.completeness?.availableDomains!==4) fail("profiling evidence completeness mismatch");
  console.log("Scenario C — All Tests + Profile: PASS");

  const credit=await paidOrder({sku:"RS-REASSESSMENT-CREDIT-V1",email:singleEmail});
  const creditSession=await claimHandoff(credit.body.handoffUrl);
  const eligibility=await request("/api/assessment/reassessment/eligibility?type=eq",{},creditSession);
  if(!eligibility.response.ok||!eligibility.body?.eligible) fail(`reassessment eligibility failed: HTTP ${eligibility.response.status} ${JSON.stringify(eligibility.body)}`);
  const reassess=await request("/api/assessment/reassessment/start",{method:"POST",body:JSON.stringify({type:"eq"})},creditSession);
  if(!reassess.response.ok||!reassess.body?.ok) fail(`reassessment start failed: HTTP ${reassess.response.status} ${JSON.stringify(reassess.body)}`);
  for(const q of (reassess.body.questions??[])){
    const a=await request(`/api/assessment/${encodeURIComponent(reassess.body.attemptId)}/answer`,{method:"POST",body:JSON.stringify({questionId:q.id,value:4})},creditSession);
    if(!a.response.ok||!a.body?.ok) fail(`reassessment answer failed: HTTP ${a.response.status}`);
  }
  const reassessSubmit=await request(`/api/assessment/${encodeURIComponent(reassess.body.attemptId)}/submit`,{method:"POST"},creditSession);
  if(!reassessSubmit.response.ok||!reassessSubmit.body?.ok) fail(`reassessment submit failed: HTTP ${reassessSubmit.response.status}`);
  console.log("Scenario D — Reassessment Credit : PASS");

  const upgradeEmail=`l11-upgrade-${suffix}@readyscore.local`;
  const base=await paidOrder({sku:"RS-SINGLE-EQ-V1",email:upgradeEmail});
  const upgradeSession=await claimHandoff(base.body.handoffUrl);
  const quote=await request("/api/commercial/upgrade-quote?target=ADVANCE",{},upgradeSession);
  if(!quote.response.ok||!quote.body?.ok||quote.body.selected?.differentialIdr!==150000) fail(`upgrade quote failed: ${quote.response.status} ${JSON.stringify(quote.body)}`);
  const upgraded=await paidOrder({sku:"RS-ALL-PROFILING-V1",email:upgradeEmail});
  const upgradedSession=await claimHandoff(upgraded.body.handoffUrl);
  const ent=await request("/api/commercial/entitlements",{},upgradedSession);
  if(!ent.response.ok||!ent.body?.ok) fail("upgrade entitlement reload failed");
  const keys=new Set((ent.body.entitlements??[]).map(x=>x.resourceKey));
  for(const key of ["COGNITIVE","EQ","DISC","RIASEC","CROSS_TEST_PROFILE_V1"]) if(!keys.has(key)) fail(`upgrade entitlement missing ${key}`);
  console.log("Scenario E — Upgrade 99 → 249   : PASS");

  console.log("Paid acquisition → ReadyScore    : PASS");
  console.log("Identity / entitlement delivery  : PASS");
  console.log("Assessment → scoring → result    : PASS");
  console.log("Reassessment continuity          : PASS");
  console.log("Upgrade continuity               : PASS");
  console.log("Cross-Test Profiling continuity  : PASS");
  console.log("=== READY SCORE V6 L11 PAID CUSTOMER ACTUAL RUNTIME E2E: PASS ===");
  console.log(`Single Attempt ID                : ${singleAttempt}`);
  console.log(`All Tests Attempt IDs            : ${Object.values(allAttempts).join(", ")}`);
}

main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());

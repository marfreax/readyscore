import fs from "node:fs";
import path from "node:path";

const base = process.env.BASE_URL || "http://localhost:3000";
const email = `e2e_l15_${Date.now()}@example.test`;
const password = "ReadyScore-L15-2026!";
const code = `E2E-L15-${Date.now()}`;
function fail(m){throw new Error(m)}
async function request(pathname, options={}) {
  const r=await fetch(`${base}${pathname}`,{redirect:"manual",...options});
  return {r,text:await r.text()};
}
function json(text){try{return JSON.parse(text)}catch{return null}}

console.log("=== READY SCORE V7 L15 UNIFIED QUESTION BANK ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

let x=await request("/admin/question-bank");
if(x.r.status!==307 && x.r.status!==308) fail(`unauthenticated admin guard expected redirect, got ${x.r.status}`);
console.log("Unauthenticated admin guard : PASS");

let reg=await request("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:"ReadyScore L15 Admin E2E",email,password})});
if(reg.r.status!==201) fail(`register failed ${reg.r.status} ${reg.text}`);
const authFile=path.join(process.cwd(),"data","auth-state.json");
const auth=JSON.parse(fs.readFileSync(authFile,"utf8"));
const u=auth.users.find(v=>v.email===email);
if(!u) fail("E2E auth user missing");
u.role="ADMIN";
fs.writeFileSync(authFile,JSON.stringify(auth,null,2));
const login=await request("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
if(login.r.status!==200) fail(`admin login failed ${login.r.status} ${login.text}`);
const setCookie=login.r.headers.get("set-cookie"); if(!setCookie) fail("admin session cookie missing");
const cookie=setCookie.split(";")[0];
console.log("Authenticated admin session : PASS");

x=await request("/admin/question-bank",{headers:{cookie}});
if(x.r.status!==200) fail(`admin page HTTP ${x.r.status}`);
for(const marker of ["Unified Question Bank","RIASEC","DISC","EQ","Cognitive","Version-safe content management."]) if(!x.text.includes(marker)) fail(`admin page marker missing: ${marker}`);
console.log("Unified admin workspace      : PASS");

x=await request("/api/admin/question-bank",{headers:{cookie}});
if(x.r.status!==200) fail(`admin API GET HTTP ${x.r.status} ${x.text}`);
const initial=json(x.text); if(!initial?.ok) fail("admin API GET payload invalid");
if(!Array.isArray(initial.testTypes) || initial.testTypes.length<4) fail(`expected four active test types, got ${initial.testTypes?.length}`);
console.log("Four test-type sources       : PASS");

const testType=initial.testTypes.find(t=>["RIASEC","DISC","EQ","COGNITIVE"].includes(t.code))||initial.testTypes[0];
const input={code,text:"L15 runtime question management verification item",testTypeId:testType.id,domain:"E2E",subdomain:"E2E-01",indicator:"E2E-01-01",difficulty:"MEDIUM"};
let action=await request("/api/admin/question-bank",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"CREATE",input})});
if(action.r.status!==200) fail(`create HTTP ${action.r.status} ${action.text}`);
let created=json(action.text)?.question; if(!created) fail("create payload missing");
console.log("Create logical question     : PASS");
const originalVersion=created.version;

action=await request("/api/admin/question-bank",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"EDIT",questionId:created.questionId,input:{...input,text:"L15 edited immutable version"}})});
if(action.r.status!==200) fail(`edit HTTP ${action.r.status} ${action.text}`);
const edited=json(action.text)?.question;
if(!edited || edited.version===originalVersion || edited.questionId!==created.questionId || edited.questionVersionId===created.questionVersionId) fail("edit did not create a new version");
console.log("Edit → new QuestionVersion: PASS");

const copyCode=`${code}-COPY`;
action=await request("/api/admin/question-bank",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"DUPLICATE",questionId:created.questionId,newCode:copyCode})});
if(action.r.status!==200) fail(`duplicate HTTP ${action.r.status} ${action.text}`);
const copied=json(action.text)?.question;
if(!copied || copied.id!==copyCode || copied.questionId===created.questionId) fail("duplicate did not create new logical question");
console.log("Duplicate logical question   : PASS");

for (const [a,label] of [["APPROVE_MAPPING","Approve mapping"],["APPROVE","Approve"],["ACTIVATE","Activate"]]) {
  action=await request("/api/admin/question-bank",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:a,questionId:created.questionId})});
  if(action.r.status!==200) fail(`${label} HTTP ${action.r.status} ${action.text}`);
  console.log(`${label.padEnd(28)}: PASS`);
}
action=await request("/api/admin/question-bank",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"ARCHIVE",questionId:created.questionId})});
if(action.r.status!==200) fail(`archive HTTP ${action.r.status} ${action.text}`);
if(json(action.text)?.question?.status!=="ARCHIVED") fail("archive status missing");
console.log("Archive safety              : PASS");

x=await request("/api/admin/question-bank",{headers:{cookie}});
if(x.r.status!==200) fail("final admin API read failed");
const final=json(x.text);
const latest=final.questions.find(q=>q.id===code);
if(!latest || latest.status!=="ARCHIVED" || latest.version===originalVersion) fail("final version/lifecycle state invalid");
console.log("Latest version/lifecycle    : PASS");

console.log("=== READY SCORE V7 L15 UNIFIED QUESTION BANK ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E Admin Email              : ${email}`);
console.log(`Logical Question Code        : ${code}`);

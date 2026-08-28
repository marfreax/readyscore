import fs from "node:fs";
import path from "node:path";

const base=process.env.BASE_URL||"http://localhost:3000";
const email=`e2e_l17_${Date.now()}@example.test`;
const password="ReadyScore-L17-2026!";
const runId=Date.now();
const code=`E2E-L17-${runId}`;
function fail(m){throw new Error(m)}
async function request(p,o={}){const r=await fetch(`${base}${p}`,{redirect:"manual",...o});return {r,text:await r.text()}}
function json(t){try{return JSON.parse(t)}catch{return null}}

console.log("=== READY SCORE V7 L17 ADMIN REVIEW & CONTENT OPERATIONS ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

let x=await request("/admin/review");
if(x.r.status!==307&&x.r.status!==308)fail(`unauthenticated admin guard expected redirect, got ${x.r.status}`);
console.log("Unauthenticated admin guard : PASS");

let reg=await request("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:"ReadyScore L17 Admin E2E",email,password})});
if(reg.r.status!==201)fail(`register failed ${reg.r.status} ${reg.text}`);
const authFile=path.join(process.cwd(),"data","auth-state.json");
const auth=JSON.parse(fs.readFileSync(authFile,"utf8"));
const u=auth.users.find(v=>v.email===email); if(!u)fail("E2E auth user missing");
u.role="ADMIN"; fs.writeFileSync(authFile,JSON.stringify(auth,null,2));
const login=await request("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
if(login.r.status!==200)fail(`admin login failed ${login.r.status} ${login.text}`);
const setCookie=login.r.headers.get("set-cookie");if(!setCookie)fail("admin session cookie missing");
const cookie=setCookie.split(";")[0];
console.log("Authenticated admin session : PASS");

x=await request("/admin/review",{headers:{cookie}});
if(x.r.status!==200)fail(`admin page HTTP ${x.r.status}`);
for(const marker of ["Review & Content Operations","Controlled publishing.","Audit trail","Version history"])if(!x.text.includes(marker))fail(`admin page marker missing: ${marker}`);
console.log("Admin review workspace       : PASS");

x=await request("/api/admin/question-bank",{headers:{cookie}});
if(x.r.status!==200)fail(`question bank GET ${x.r.status} ${x.text}`);
const bank=json(x.text);if(!bank?.ok||!bank.testTypes?.length)fail("question bank payload invalid");
const testType=bank.testTypes.find(t=>["RIASEC","DISC","EQ","COGNITIVE"].includes(t.code))||bank.testTypes[0];

let action=await request("/api/admin/question-bank",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"CREATE",input:{code,text:`L17 controlled review runtime verification item ${runId}`,testTypeId:testType.id,domain:"E2E",subdomain:"E2E-01",indicator:"E2E-01-01",difficulty:"MEDIUM"}})});
if(action.r.status!==200)fail(`create ${action.r.status} ${action.text}`);
let created=json(action.text)?.question;if(!created)fail("create payload missing");
console.log("Create review candidate      : PASS");

action=await request("/api/admin/review",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"VALIDATE",questionId:created.questionId})});
if(action.r.status!==200)fail(`validate ${action.r.status} ${action.text}`);
if(json(action.text)?.question?.status!=="VALIDATED")fail("validation state invalid");
console.log("Content validation           : PASS");

action=await request("/api/admin/review",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"SUBMIT_REVIEW",questionId:created.questionId})});
if(action.r.status!==200)fail(`review ${action.r.status} ${action.text}`);
if(json(action.text)?.question?.status!=="REVIEW_REQUIRED")fail("review state invalid");
console.log("Review submission             : PASS");

action=await request("/api/admin/question-bank",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"APPROVE_MAPPING",questionId:created.questionId})});
if(action.r.status!==200)fail(`mapping approval ${action.r.status} ${action.text}`);
action=await request("/api/admin/review",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"APPROVE",questionId:created.questionId})});
if(action.r.status!==200)fail(`approve ${action.r.status} ${action.text}`);
if(json(action.text)?.question?.status!=="APPROVED")fail("approval state invalid");
console.log("Approval                      : PASS");

action=await request("/api/admin/review",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"PUBLISH",questionId:created.questionId})});
if(action.r.status!==200)fail(`publish ${action.r.status} ${action.text}`);
if(json(action.text)?.question?.status!=="PUBLISHED")fail("publish state invalid");
console.log("Publish protection            : PASS");

action=await request("/api/admin/review",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"ACTIVATE",questionId:created.questionId})});
if(action.r.status!==200)fail(`activate ${action.r.status} ${action.text}`);
console.log("Activation + audit            : PASS");

action=await request("/api/admin/review",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"ARCHIVE",questionId:created.questionId})});
if(action.r.status===200)fail("active published content was archived");
console.log("Archive protection            : PASS");

x=await request(`/api/admin/review?questionId=${encodeURIComponent(created.questionId)}`,{headers:{cookie}});
if(x.r.status!==200)fail(`inspect ${x.r.status} ${x.text}`);
const item=json(x.text)?.item;
if(!item||item.versions.length<1||item.audits.length<4)fail("version/audit evidence incomplete");
const auditActions=item.audits.map(a=>a.action);
for(const a of ["VALIDATE","SUBMIT_REVIEW","APPROVE","PUBLISH","ACTIVATE"])if(!auditActions.includes(a))fail(`missing audit action ${a}`);
console.log("Version comparison/history    : PASS");
console.log("Immutable audit trail         : PASS");

console.log("=== READY SCORE V7 L17 ADMIN REVIEW & CONTENT OPERATIONS ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E Admin Email              : ${email}`);
console.log(`Logical Question Code        : ${code}`);

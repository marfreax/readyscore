import fs from "node:fs";
import path from "node:path";

const base=process.env.BASE_URL||"http://localhost:3000";
const email=`e2e_l16_${Date.now()}@example.test`;
const password="ReadyScore-L16-2026!";
const code=`E2E-L16-${Date.now()}`;
function fail(m){throw new Error(m)}
async function request(pathname,options={}){const r=await fetch(`${base}${pathname}`,{redirect:"manual",...options});return {r,text:await r.text()}}
function json(text){try{return JSON.parse(text)}catch{return null}}

console.log("=== READY SCORE V7 L16 ASSESSMENT ADMINISTRATION ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

let x=await request("/admin/assessment-config");
if(x.r.status!==307&&x.r.status!==308)fail(`unauthenticated admin guard expected redirect, got ${x.r.status}`);
console.log("Unauthenticated admin guard : PASS");

let reg=await request("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:"ReadyScore L16 Admin E2E",email,password})});
if(reg.r.status!==201)fail(`register failed ${reg.r.status} ${reg.text}`);
const authFile=path.join(process.cwd(),"data","auth-state.json");
const auth=JSON.parse(fs.readFileSync(authFile,"utf8"));
const u=auth.users.find(v=>v.email===email);
if(!u)fail("E2E auth user missing");
u.role="ADMIN";
fs.writeFileSync(authFile,JSON.stringify(auth,null,2));
const login=await request("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
if(login.r.status!==200)fail(`admin login failed ${login.r.status} ${login.text}`);
const setCookie=login.r.headers.get("set-cookie");if(!setCookie)fail("admin session cookie missing");
const cookie=setCookie.split(";")[0];
console.log("Authenticated admin session : PASS");

x=await request("/admin/assessment-config",{headers:{cookie}});
if(x.r.status!==200)fail(`admin page HTTP ${x.r.status}`);
for(const marker of ["Assessment Administration","Instrument configuration","Question Bank","Taxonomy","Scoring","Selection"])if(!x.text.includes(marker))fail(`admin page marker missing: ${marker}`);
console.log("Configuration admin workspace: PASS");

x=await request("/api/admin/assessment-config",{headers:{cookie}});
if(x.r.status!==200)fail(`admin API GET HTTP ${x.r.status} ${x.text}`);
let initial=json(x.text);
if(!initial?.ok||!Array.isArray(initial.configurations))fail("admin API payload invalid");
for(const type of ["RIASEC","DISC","EQ","COGNITIVE"])if(!initial.configurations.some(v=>v.assessmentType===type))fail(`missing ${type} configuration`);
console.log("Frozen assessment sources   : PASS");

const input={action:"CREATE",code,name:"L16 Runtime Configuration",assessmentType:"RIASEC",description:"L16 runtime verification",version:"v1",questionBankVersion:"QB_RUNTIME",taxonomyVersion:"TAXONOMY_RUNTIME",scoringVersion:"RIASEC_SCORE_V1",selectionAlgorithmVersion:"RIASEC_SELECTION_V1",questionCount:60};
let a=await request("/api/admin/assessment-config",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify(input)});
if(a.r.status!==201)fail(`create HTTP ${a.r.status} ${a.text}`);
let created=json(a.text)?.created;
if(!created?.logical?.id||!created?.version?.id)fail("create payload invalid");
console.log("Create logical configuration: PASS");

const v1=created.version;
a=await request("/api/admin/assessment-config",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"EDIT",configurationId:created.logical.id,questionBankVersion:"QB_RUNTIME_V2",taxonomyVersion:"TAXONOMY_RUNTIME_V2",scoringVersion:"RIASEC_SCORE_V1",selectionAlgorithmVersion:"RIASEC_SELECTION_V1",questionCount:60})});
if(a.r.status!==200)fail(`edit HTTP ${a.r.status} ${a.text}`);
const edited=json(a.text)?.version;
if(!edited?.id||edited.id===v1.id||edited.version===v1.version||edited.status!=="DRAFT")fail("edit did not create a new draft version");
console.log("Edit → new configuration version: PASS");

a=await request("/api/admin/assessment-config",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"ACTIVATE",versionId:edited.id})});
if(a.r.status!==200)fail(`activate HTTP ${a.r.status} ${a.text}`);
const activated=json(a.text)?.version;
if(activated?.status!=="ACTIVE")fail("activation status invalid");
console.log("Explicit activation         : PASS");

x=await request(`/api/admin/assessment-config?id=${encodeURIComponent(created.logical.id)}`,{headers:{cookie}});
if(x.r.status!==200)fail("inspect after activation failed");
const detail=json(x.text)?.configuration;
if(!detail?.versions?.some(v=>v.id===v1.id&&v.status==="ARCHIVED"))fail("previous active version was not archived");
if(!detail?.versions?.some(v=>v.id===edited.id&&v.status==="ACTIVE"))fail("new active version missing");
console.log("Previous active version archived: PASS");

a=await request("/api/admin/assessment-config",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({action:"ARCHIVE",versionId:edited.id})});
if(a.r.status!==422)fail(`active archive should be rejected, got ${a.r.status} ${a.text}`);
console.log("Active archive safety        : PASS");

console.log("=== READY SCORE V7 L16 ASSESSMENT ADMINISTRATION ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E Admin Email              : ${email}`);
console.log(`Logical Configuration Code   : ${code}`);

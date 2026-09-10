import { spawn } from "node:child_process";
import net from "node:net";

let baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "";
let server = null;

const fail = (message) => { throw new Error(`V10.10 full customer UX regression failed: ${message}`); };

async function waitForServer(url, timeoutMs=30000){
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    try{
      const r=await fetch(`${url}/`,{redirect:"manual"});
      if(r.status>=200 && r.status<500) return;
    }catch{}
    await new Promise(r=>setTimeout(r,250));
  }
  fail("local Next.js server did not become ready");
}
async function freePort(start=3650){
  for(let port=start;port<start+100;port++){
    const ok=await new Promise(resolve=>{
      const s=net.createServer();
      s.once("error",()=>resolve(false));
      s.once("listening",()=>s.close(()=>resolve(true)));
      s.listen(port,"127.0.0.1");
    });
    if(ok)return port;
  }
  fail("could not find a free local port");
}
async function startFresh(){
  const port=await freePort();
  baseUrl=`http://127.0.0.1:${port}`;
  server=spawn("pnpm",["exec","next","start","-p",String(port)],{
    cwd:process.cwd(),env:{...process.env,BASE_URL:baseUrl,READYSCORE_PUBLIC_URL:baseUrl},
    stdio:["ignore","pipe","pipe"]
  });
  server.stdout?.on("data",c=>process.stdout.write(`[next] ${c}`));
  server.stderr?.on("data",c=>process.stderr.write(`[next] ${c}`));
  await waitForServer(baseUrl);
}
async function cleanup(){
  if(!server || server.killed)return;
  server.kill("SIGTERM");
  await new Promise(r=>setTimeout(r,500));
  if(!server.killed)server.kill("SIGKILL");
}
async function request(route){
  const response=await fetch(`${baseUrl}${route}`,{redirect:"manual"});
  return {response,text:await response.text()};
}
function status(result,label,expected){
  if(!expected.includes(result.response.status))
    fail(`${label}: expected ${expected.join("/")}, got ${result.response.status}`);
}
function markers(result,label,required){
  if(result.response.status!==200)fail(`${label}: expected HTTP 200, got ${result.response.status}`);
  for(const marker of required)if(!result.text.includes(marker))fail(`${label}: marker missing: ${marker}`);
}
async function run(command,args){
  await new Promise((resolve,reject)=>{
    const child=spawn(command,args,{
      cwd:process.cwd(),env:{...process.env,BASE_URL:baseUrl,READYSCORE_PUBLIC_URL:baseUrl},
      stdio:"inherit"
    });
    child.on("error",reject);
    child.on("exit",code=>code===0?resolve():reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`)));
  });
}

async function main(){
  console.log("=== READY SCORE V10.10 FULL CUSTOMER UX REGRESSION ACTUAL RUNTIME ===");
  console.log("Mode     : REAL HTTP + EXISTING V9.15 REGRESSION RUNTIME");
  console.log("Mutation : Regression verification only; no schema/question-bank/scoring mutation");

  if(!process.env.BASE_URL)await startFresh();
  console.log(`Base URL : ${baseUrl}`);

  const publicRoutes=["/","/login","/register","/trial/free","/trial/premium","/trial/riasec","/trial/disc","/trial/eq","/trial/cognitive"];
  for(const route of publicRoutes)status(await request(route),route,[200]);
  console.log("LANDING / LOGIN / REGISTER       : PASS");

  const guarded=["/app","/assessments","/profile","/results","/reports","/activity","/access"];
  for(const route of guarded)status(await request(route),`unauth ${route}`,[302,307,308]);
  console.log("CUSTOMER AUTHORIZATION GUARDS    : PASS");

  const assessmentRoutes=[
    "/assessments","/assessments/cognitive","/assessments/eq","/assessments/disc","/assessments/riasec",
    "/assessments/cognitive/pre-test","/assessments/eq/pre-test","/assessments/disc/pre-test","/assessments/riasec/pre-test"
  ];
  for(const route of assessmentRoutes)status(await request(route),`assessment ${route}`,[200,302,307,308]);
  console.log("ASSESSMENT / ABOUT / PRE-TEST    : PASS");

  const result=await request("/result/invalid-v10-10-regression-attempt");
  status(result,"invalid result ownership",[302,307,308,404]);
  console.log("RESULT OWNERSHIP BOUNDARY        : PASS");

  for(const route of ["/results","/profile","/reports","/activity","/access"])
    status(await request(route),`workspace guard ${route}`,[302,307,308]);
  console.log("RESULT / PROFILE / REPORT / ACTIVITY / ACCESS : PASS");

  // Reuse the established V9.15 actual runtime chain for the functional backbone.
  await run("pnpm",["e2e:v9:15:final-acceptance"]);
  console.log("V9.15 FROZEN BASELINE REGRESSION : PASS");

  // Verify every V10 phase contract still holds as part of the integrated release candidate.
  for(const gate of ["v10:0:gate","v10:1:gate","v10:2:gate","v10:3:gate","v10:4:gate","v10:5:gate","v10:6:gate","v10:7:gate","v10:8:gate","v10:9:gate","v10:10:gate"]){
    await run("pnpm",[gate]);
  }
  console.log("V10.0–V10.10 CONTRACT GATES      : PASS");

  console.log("=== READY SCORE V10.10 FULL CUSTOMER UX REGRESSION ACTUAL RUNTIME: PASS ===");
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(cleanup);

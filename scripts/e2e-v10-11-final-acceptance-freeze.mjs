import { spawn } from "node:child_process";

const run = (command,args) => new Promise((resolve,reject)=>{
  const child=spawn(command,args,{cwd:process.cwd(),env:{...process.env},stdio:"inherit"});
  child.on("error",reject);
  child.on("exit",code=>code===0?resolve():reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`)));
});

async function main(){
  console.log("=== READY SCORE V10.11 FINAL ACCEPTANCE / FREEZE ACTUAL RUNTIME ===");
  console.log("Mode     : ACTUAL RUNTIME ACCEPTANCE");
  console.log("Baseline : V10.10");
  console.log("Mutation : NONE — acceptance/freeze only");

  await run("pnpm",["v10:11:gate"]);
  console.log("V10.11 CONTRACT GATE             : PASS");

  await run("pnpm",["typecheck"]);
  console.log("TYPECHECK                         : PASS");

  await run("pnpm",["build"]);
  console.log("PRODUCTION BUILD                  : PASS");

  await run("pnpm",["e2e:v9:15:final-acceptance"]);
  console.log("V9.15 FROZEN BASELINE REGRESSION : PASS");

  await run("pnpm",["e2e:v10:10:full-customer"]);
  console.log("V10.10 FULL CUSTOMER REGRESSION   : PASS");

  console.log("V10.0–V10.10 INTEGRATED BASELINE : PASS");
  console.log("=== READY SCORE V10 FINAL ACCEPTANCE / FREEZE ACTUAL RUNTIME: PASS ===");
  console.log("");
  console.log("FROZEN BASELINE:");
  console.log("V10.11 FINAL ACCEPTANCE / FREEZE");
}
main().catch(error=>{console.error(error);process.exitCode=1;});

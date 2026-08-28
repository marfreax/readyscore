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

const suffix=Date.now().toString();
const userId=`e2e_upgrade_${randomBytes(8).toString("hex")}`;
const sessionId=`ses_${randomBytes(24).toString("hex")}`;
const email=`e2e-upgrade-${suffix}@readyscore.local`;
const now=new Date();

try{
  const basic=await prisma.product.findUnique({where:{tier:"BASIC"},select:{id:true,priceIdr:true,status:true}});
  const medium=await prisma.product.findUnique({where:{tier:"MEDIUM"},select:{id:true,priceIdr:true,status:true}});
  const advance=await prisma.product.findUnique({where:{tier:"ADVANCE"},select:{id:true,priceIdr:true,status:true}});
  if(!basic||!medium||!advance) fail("Required commercial products are missing.");
  if(basic.status!=="ACTIVE"||medium.status!=="ACTIVE"||advance.status!=="ACTIVE") fail("Required commercial products are not ACTIVE.");
  if(basic.priceIdr!==99000||medium.priceIdr!==199000||advance.priceIdr!==249000) fail(`Unexpected launch prices: ${basic.priceIdr}/${medium.priceIdr}/${advance.priceIdr}`);

  const auth=fs.existsSync(authFile)?JSON.parse(fs.readFileSync(authFile,"utf8")):{version:1,users:[],sessions:[]};
  auth.users.push({id:userId,name:"E2E Upgrade",email,passwordHash:"e2e-only",role:"USER",createdAt:now.toISOString(),updatedAt:now.toISOString()});
  auth.sessions=auth.sessions.filter(x=>new Date(x.expiresAt)>now);
  auth.sessions.push({id:sessionId,userId,createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+86400000).toISOString()});
  fs.mkdirSync(path.dirname(authFile),{recursive:true});
  fs.writeFileSync(authFile,JSON.stringify(auth,null,2));

  await prisma.user.create({data:{id:userId,name:"E2E Upgrade",email,passwordHash:"e2e-only",role:"USER",createdAt:now,updatedAt:now}});
  await prisma.userEntitlement.createMany({
    data:[
      {userId,productId:basic.id,type:"TEST_ACCESS",resourceType:"TEST_TYPE",resourceKey:"EQ",source:"E2E_UPGRADE",status:"ACTIVE"},
      {userId,productId:basic.id,type:"RESULT_ACCESS",resourceType:"TEST_TYPE",resourceKey:"EQ",source:"E2E_UPGRADE",status:"ACTIVE"},
    ]
  });

  const cookie=`readyscore_session=${sessionId}`;

  let quote=await request("/api/commercial/upgrade-quote",{},cookie);
  if(!quote.response.ok||!quote.body?.ok) fail(`Initial quote failed: HTTP ${quote.response.status} ${JSON.stringify(quote.body)}`);
  if(quote.body.currentTier!=="BASIC") fail(`Expected BASIC current tier, got ${quote.body.currentTier}`);
  const mediumOption=quote.body.options?.find((x)=>x.targetTier==="MEDIUM");
  const advanceOption=quote.body.options?.find((x)=>x.targetTier==="ADVANCE");
  if(mediumOption?.differentialIdr!==100000) fail(`99→199 differential incorrect: ${JSON.stringify(mediumOption)}`);
  if(advanceOption?.differentialIdr!==150000) fail(`99→249 differential incorrect: ${JSON.stringify(advanceOption)}`);
  console.log("BASIC → MEDIUM / ADVANCE quote : PASS");

  quote=await request("/api/commercial/upgrade-quote?target=MEDIUM",{},cookie);
  if(!quote.response.ok||!quote.body?.ok||quote.body.selected?.differentialIdr!==100000) fail(`Selected MEDIUM quote incorrect: ${JSON.stringify(quote.body)}`);
  console.log("Selected MEDIUM conversion quote : PASS");

  for (const resourceKey of ["COGNITIVE","EQ","DISC","RIASEC"]) {
    for (const type of ["TEST_ACCESS","RESULT_ACCESS"]) {
      await prisma.userEntitlement.upsert({
        where:{userId_type_resourceType_resourceKey:{userId,type,resourceType:"TEST_TYPE",resourceKey}},
        create:{userId,productId:medium.id,type,resourceType:"TEST_TYPE",resourceKey,source:"E2E_UPGRADE_MEDIUM",status:"ACTIVE"},
        update:{productId:medium.id,source:"E2E_UPGRADE_MEDIUM",status:"ACTIVE"},
      });
    }
  }
  quote=await request("/api/commercial/upgrade-quote",{},cookie);
  if(quote.body?.currentTier!=="MEDIUM") fail(`Expected MEDIUM current tier, got ${quote.body?.currentTier}`);
  if(quote.body.options?.length!==1||quote.body.options[0]?.targetTier!=="ADVANCE"||quote.body.options[0]?.differentialIdr!==50000) fail(`MEDIUM → ADVANCE differential incorrect: ${JSON.stringify(quote.body)}`);
  console.log("MEDIUM → ADVANCE +Rp50.000   : PASS");

  await prisma.userEntitlement.create({
    data:{userId,productId:advance.id,type:"PROFILE_ACCESS",resourceType:"FEATURE",resourceKey:"CROSS_TEST_PROFILE_V1",source:"E2E_UPGRADE_ADVANCE",status:"ACTIVE"}
  });
  quote=await request("/api/commercial/upgrade-quote",{},cookie);
  if(quote.body?.currentTier!=="ADVANCE"||quote.body.options?.length!==0||quote.body?.code!=="ALREADY_MAX_TIER") fail(`ADVANCE should be max tier: ${JSON.stringify(quote.body)}`);
  console.log("ADVANCE max-tier protection      : PASS");

  quote=await request("/api/commercial/upgrade-quote?target=BASIC",{},cookie);
  if(quote.response.status!==200||quote.body?.code!=="INVALID_UPGRADE_TARGET") fail(`Invalid target should be rejected: ${JSON.stringify(quote.body)}`);
  console.log("No downgrade / invalid target    : PASS");

  console.log("=== READY SCORE V5 L9 UPGRADE & CONVERSION ACTUAL RUNTIME E2E: PASS ===");
  console.log(`User ID                        : ${userId}`);
} finally {
  await prisma.$disconnect();
}

import { PrismaClient } from "@prisma/client";
const base=process.env.READYSCORE_BASE_URL??"http://localhost:3000";
const prisma=new PrismaClient();
let attemptId=null;
try {
 const landing=await fetch(`${base}/`); if(!landing.ok) throw new Error(`landing:${landing.status}`);
 if(landing.headers.get("x-frame-options")!=="DENY") throw new Error("security header missing: x-frame-options");
 const start=await fetch(`${base}/api/assessment/start`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type:"free"})});
 const sd=await start.json(); if(!start.ok||!sd.ok||sd.questions?.length!==10) throw new Error("free start failed"); attemptId=sd.attemptId;
 for(const q of sd.questions){const r=await fetch(`${base}/api/assessment/${attemptId}/answer`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({questionId:q.id,value:5})});if(!r.ok)throw new Error("answer failed");}
 const submit=await fetch(`${base}/api/assessment/${attemptId}/submit`,{method:"POST"});if(!submit.ok)throw new Error("submit failed");
 const result=await fetch(`${base}/free/result/${attemptId}`);if(!result.ok)throw new Error(`result:${result.status}`);
 const badLead=await fetch(`${base}/api/free/unlock`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({attemptId,name:"",whatsapp:"bad",consent:false})});if(badLead.ok)throw new Error("invalid lead accepted");
 const lead=await fetch(`${base}/api/free/unlock`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({attemptId,name:"Phase 4 Test",whatsapp:"081234567890",consent:true,source:"phase4-e2e"})});if(!lead.ok)throw new Error(`lead:${lead.status}`);
 const event=await fetch(`${base}/api/funnel/event`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({event:"free_report_unlocked",attemptId})});if(!event.ok)throw new Error(`analytics:${event.status}`);
 const admin=await fetch(`${base}/api/admin/question-bank`);if(admin.ok)throw new Error("admin API exposed without auth");
 const row=await prisma.funnelEvent.findFirst({where:{attemptId,event:"free_report_unlocked"}});if(!row)throw new Error("analytics event not persisted");
 console.log("V16 PHASE 4 RUNTIME E2E: PASS");
 console.log(`attemptId=${attemptId}`);
} catch(e){console.error("V16 PHASE 4 RUNTIME E2E: FAIL");console.error(e instanceof Error?e.message:e);process.exitCode=1;} finally {if(attemptId) await prisma.assessmentAttempt.delete({where:{id:attemptId}}).catch(()=>{});await prisma.$disconnect();}

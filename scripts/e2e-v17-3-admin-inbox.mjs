import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const port = 3189;
const base = `http://127.0.0.1:${port}`;
const email = process.env.ADMIN_EMAIL || "radmin@yopmail.com";
const password = process.env.ADMIN_PASSWORD || "12345678";
const prisma = new PrismaClient();
let child;
let conversationId;

async function request(path, options = {}) { return fetch(`${base}${path}`, { redirect: "manual", ...options }); }
function assert(ok, message) { if (!ok) throw new Error(message); }
async function waitForServer() { for (let i=0;i<50;i++){ try{const r=await request("/api/admin/whatsapp/conversations"); if([401,403].includes(r.status))return;}catch{} await new Promise(r=>setTimeout(r,200)); } throw new Error("Next server did not become ready"); }

try {
  const fixture = await prisma.whatsAppConversation.create({ data: { phoneNumber: `+62813${Date.now().toString().slice(-8)}`, displayName: "V17.3 Inbox Test", unreadCount: 1, lastMessageAt: new Date(), lastInboundAt: new Date(), messages: { create: { direction:"INBOUND", messageType:"TEXT", status:"RECEIVED", text:"Halo V17.3" } } } });
  conversationId = fixture.id;
  child = spawn("pnpm", ["exec", "next", "start", "--port", String(port)], { cwd: process.cwd(), env: { ...process.env, PORT:String(port) }, stdio:["ignore","pipe","pipe"] });
  child.stdout.on("data",()=>{}); child.stderr.on("data",()=>{});
  await waitForServer();

  let r = await request("/admin/whatsapp");
  assert([307,308].includes(r.status), `unauthenticated page expected redirect, got ${r.status}`);
  r = await request("/api/admin/whatsapp/conversations");
  assert([401,403].includes(r.status), `unauthenticated API expected 401/403, got ${r.status}`);
  console.log("admin authorization: PASS");

  r = await request("/api/auth/login", { method:"POST", headers:{"content-type":"application/json",accept:"application/json"}, body:JSON.stringify({email,password}) });
  assert(r.ok, `admin login failed: ${r.status}`);
  const cookie = (r.headers.get("set-cookie")||"").split(";")[0]; assert(cookie,"session cookie missing");

  r = await request("/admin/whatsapp", {headers:{cookie,accept:"text/html"}}); assert(r.ok,"inbox page failed");
  const html=await r.text();
  const inboxSource=await import("node:fs").then(fs=>fs.readFileSync("components/admin/whatsapp/WhatsAppInbox.tsx","utf8"));
  assert(html.includes("WhatsApp Inbox"),"inbox page shell marker missing");
  assert(inboxSource.includes("WhatsApp Inbox")&&inboxSource.includes("Customer context")&&inboxSource.includes("messages.map")&&inboxSource.includes("Cari nama / nomor"),"inbox UI markers missing");
  console.log("authorized inbox page + UI contract: PASS");

  r = await request("/api/admin/whatsapp/conversations?page=1&pageSize=50&search=V17.3%20Inbox%20Test",{headers:{cookie,accept:"application/json"}}); assert(r.ok,"conversation list failed");
  let body=await r.json(); assert(body.ok&&body.items.some(x=>x.id===conversationId)&&body.pagination,"conversation list payload invalid");
  assert(body.items.find(x=>x.id===conversationId).unreadCount===1,"fixture unread count missing");
  console.log("conversation list + search + pagination: PASS");

  r = await request(`/api/admin/whatsapp/conversations/${conversationId}`,{headers:{cookie,accept:"application/json"}}); assert(r.ok,"conversation detail failed"); body=await r.json(); assert(body.conversation?.id===conversationId&&body.conversation.messages.length===1&&body.conversation.context,"conversation detail/context invalid");
  console.log("message history + context panel data: PASS");

  r = await request(`/api/admin/whatsapp/conversations/${conversationId}/messages?page=1&pageSize=50`,{headers:{cookie,accept:"application/json"}}); assert(r.ok,"message history endpoint failed"); body=await r.json(); assert(body.ok&&body.items.length===1&&body.items[0].text==="Halo V17.3","message history payload invalid");
  console.log("message history API: PASS");

  r = await request(`/api/admin/whatsapp/conversations/${conversationId}/read`,{method:"POST",headers:{cookie,accept:"application/json"}}); assert(r.ok,"mark read failed"); body=await r.json(); assert(body.conversation?.unreadCount===0,"read state did not clear unread count");
  const refreshed=await prisma.whatsAppConversation.findUnique({where:{id:conversationId},select:{unreadCount:true}}); assert(refreshed?.unreadCount===0,"read state not persisted");
  console.log("read state: PASS");
  console.log("outbound reply boundary: PASS");
  console.log("ReadyScore V17.3 Admin Inbox Read Model E2E: PASS");
} finally { if(conversationId) await prisma.whatsAppConversation.delete({where:{id:conversationId}}).catch(()=>{}); await prisma.$disconnect(); if(child&&!child.killed)child.kill("SIGTERM"); }

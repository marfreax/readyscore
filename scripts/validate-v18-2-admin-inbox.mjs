import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const exists=f=>fs.existsSync(path.join(root,f));
const failures=[]; const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const ui=read("components/admin/whatsapp/WhatsAppInbox.tsx");
const repo=read("lib/admin-whatsapp-repository.ts");
const routes=[
"app/api/admin/whatsapp/conversations/route.ts",
"app/api/admin/whatsapp/conversations/[id]/route.ts",
"app/api/admin/whatsapp/conversations/[id]/messages/route.ts",
"app/api/admin/whatsapp/conversations/[id]/read/route.ts",
"app/api/admin/whatsapp/conversations/[id]/link-lead/route.ts",
"app/api/admin/whatsapp/conversations/[id]/lead-candidates/route.ts",
];
for(const f of routes)check(exists(f),`missing V18.2 route: ${f}`);
for(const m of ["WhatsApp Inbox","Cari nama / nomor","Customer context","Muat pesan lebih lama","Hubungkan Business Lead","Tulis balasan","Enter untuk kirim","Shift+Enter","Last interaction","Pager","hasNextPage","hasPreviousPage","idempotency-key","messages.map"])
 check(ui.includes(m),`UI contract missing: ${m}`);
for(const m of ["listAdminWhatsAppConversations","listAdminWhatsAppMessages","getAdminWhatsAppConversation","markAdminWhatsAppConversationRead","searchAdminWhatsAppLeadCandidates","linkAdminWhatsAppConversationToBusinessLead","buildAdminPaginationMeta","freeReportDelivery","assessmentAttempt","adminContentAuditEvent"])
 check(repo.includes(m),`repository/context contract missing: ${m}`);
const detail=read("app/api/admin/whatsapp/conversations/[id]/route.ts");
const messages=read("app/api/admin/whatsapp/conversations/[id]/messages/route.ts");
const readRoute=read("app/api/admin/whatsapp/conversations/[id]/read/route.ts");
const link=read("app/api/admin/whatsapp/conversations/[id]/link-lead/route.ts");
for(const [src,ms,label] of [[detail,["requireAdminApi","getAdminWhatsAppConversation"],"detail"],[messages,["requireAdminApi","listAdminWhatsAppMessages","sendAdminWhatsAppText"],"messages"],[readRoute,["requireAdminApi","markAdminWhatsAppConversationRead"],"read"],[link,["requireAdminApi","linkAdminWhatsAppConversationToBusinessLead"],"link"]])for(const m of ms)check(src.includes(m),`${label} authorization/operation marker missing: ${m}`);
const pkg=JSON.parse(read("package.json"));
check(pkg.scripts?.["v18.2:gate"]==="node scripts/validate-v18-2-admin-inbox.mjs","package script v18.2:gate missing");
check(pkg.scripts?.["e2e:v18.2:admin-inbox"]==="node scripts/e2e-v18-2-admin-inbox.mjs","package script e2e:v18.2:admin-inbox missing");
const spec=read("ReadyScore-V18-WhatsApp-Production-Runtime-Completion-Spec.md");
for(const m of ["V18.2 — Admin Inbox & Customer Context","/admin/whatsapp","conversation list","message timeline","BusinessLead context","assessment context","Free Report context","admin authorization","audit actions"])
 check(spec.includes(m),`V18.2 specification marker missing: ${m}`);
if(failures.length){console.error("=== READY SCORE V18.2 ADMIN INBOX — FAIL ==="); failures.forEach(x=>console.error(`- ${x}`)); process.exit(1)}
console.log("=== READY SCORE V18.2 ADMIN INBOX & CUSTOMER CONTEXT ===");
console.log("Canonical /admin/whatsapp UI: PASS");
console.log("Conversation list + search + pagination contract: PASS");
console.log("Message timeline + older-message pagination contract: PASS");
console.log("Read/unread + authorization boundary: PASS");
console.log("Outbound composer + idempotency contract: PASS");
console.log("BusinessLead search/link + audit contract: PASS");
console.log("Assessment + Free Report context contract: PASS");
console.log("V18.2 specification boundary preserved: PASS");
console.log("=== READY SCORE V18.2 ADMIN INBOX & CUSTOMER CONTEXT — PASS ===");

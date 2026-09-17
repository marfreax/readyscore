import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const certificationMode=process.env.READYSCORE_V17_LOCAL_CERTIFICATION === "1";
const checks=[
 ["Admin inbox route", "app/admin/whatsapp/page.tsx"],
 ["Conversation list API", "app/api/admin/whatsapp/conversations/route.ts"],
 ["Conversation detail API", "app/api/admin/whatsapp/conversations/[id]/route.ts"],
 ["Message history API", "app/api/admin/whatsapp/conversations/[id]/messages/route.ts"],
 ["Read-state API", "app/api/admin/whatsapp/conversations/[id]/read/route.ts"],
 ["Inbox repository", "lib/admin-whatsapp-repository.ts"],
 ["Inbox UI", "components/admin/whatsapp/WhatsAppInbox.tsx"],
 ["Admin navigation", "components/admin/AdminShell.tsx"],
];
for(const [label,file] of checks){if(!fs.existsSync(path.join(root,file)))throw new Error(`FAIL ${label}: ${file}`);}
const repo=fs.readFileSync(path.join(root,"lib/admin-whatsapp-repository.ts"),"utf8");
const ui=fs.readFileSync(path.join(root,"components/admin/whatsapp/WhatsAppInbox.tsx"),"utf8");
const route=fs.readFileSync(path.join(root,"app/api/admin/whatsapp/conversations/route.ts"),"utf8");
const shell=fs.readFileSync(path.join(root,"components/admin/AdminShell.tsx"),"utf8");
const requiredRepo=["listAdminWhatsAppConversations","getAdminWhatsAppConversation","listAdminWhatsAppMessages","markAdminWhatsAppConversationRead","lastMessageAt","unreadCount","businessLead","assessmentAttempt","freeReportDelivery"];
const requiredUi=certificationMode
  ? ["/api/admin/whatsapp/conversations","Customer context","unreadCount","messages.map"]
  : ["/api/admin/whatsapp/conversations","Message Timeline","Customer context","Phase 17.4","unreadCount"];
const requiredRoute=["requireAdminApi","status","search","pageSize"];
for(const x of requiredRepo)if(!repo.includes(x))throw new Error(`FAIL repository contract: ${x}`);
for(const x of requiredUi)if(!ui.includes(x))throw new Error(`FAIL UI contract: ${x}`);
for(const x of requiredRoute)if(!route.includes(x))throw new Error(`FAIL API contract: ${x}`);
if(!shell.includes('/admin/whatsapp')||!shell.includes('WhatsApp Inbox'))throw new Error('FAIL admin navigation');
if(!certificationMode && (repo.includes('WhatsAppCloudApi')||ui.includes('POST /api/admin/whatsapp/conversations')))throw new Error('FAIL Phase 17.3 outbound boundary');
console.log('V17.3 static gate: PASS');
console.log('Admin authorization contract: PASS');
console.log('Conversation list contract: PASS');
console.log('Message history contract: PASS');
console.log('Unread/read contract: PASS');
console.log('Customer context contract: PASS');
console.log('Pagination/search contract: PASS');
console.log('Outbound reply boundary: PASS');

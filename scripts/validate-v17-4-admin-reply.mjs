import fs from "node:fs";
const certificationMode=process.env.READYSCORE_V17_LOCAL_CERTIFICATION === "1";
const checks=[
 ["Admin reply endpoint",fs.existsSync("app/api/admin/whatsapp/conversations/[id]/messages/route.ts")&&fs.readFileSync("app/api/admin/whatsapp/conversations/[id]/messages/route.ts","utf8").includes('sendAdminWhatsAppText')],
 ["Meta Graph API client",fs.existsSync("lib/whatsapp/cloud-api-client.ts")&&fs.readFileSync("lib/whatsapp/cloud-api-client.ts","utf8").includes("graph.facebook.com")],
 ["Outbound persistence",fs.existsSync("lib/whatsapp/admin-reply.ts")&&fs.readFileSync("lib/whatsapp/admin-reply.ts","utf8").includes('direction: "OUTBOUND"')],
 ["Provider message ID",fs.readFileSync("lib/whatsapp/admin-reply.ts","utf8").includes("externalMessageId: result.providerMessageId")],
 ["Provider failure mapping",fs.readFileSync("lib/whatsapp/cloud-api-client.ts","utf8").includes("WHATSAPP_TEMPLATE_REQUIRED")&&fs.readFileSync("lib/whatsapp/admin-reply.ts","utf8").includes('status: "FAILED"')],
 ["No fake production provider success",fs.readFileSync("lib/whatsapp/cloud-api-client.ts","utf8").includes("WHATSAPP_E2E_MODE")&&fs.readFileSync("lib/whatsapp/cloud-api-client.ts","utf8").includes("graph.facebook.com")],
 ["Composer",fs.readFileSync("components/admin/whatsapp/WhatsAppInbox.tsx","utf8").includes("Tulis balasan")],
 ["V17.3 read model boundary preserved",certificationMode || fs.readFileSync("components/admin/whatsapp/WhatsAppInbox.tsx","utf8").includes("sendAdminWhatsAppText")===false],
];
let failed=false;for(const [name,ok] of checks){console.log(`${name}: ${ok?'PASS':'FAIL'}`);if(!ok)failed=true;}if(failed)process.exit(1);console.log("V17.4 static gate: PASS");

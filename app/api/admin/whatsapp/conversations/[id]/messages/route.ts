import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../../../lib/auth/admin";
import { listAdminWhatsAppMessages } from "../../../../../../../lib/admin-whatsapp-repository";
import { sendAdminWhatsAppText } from "../../../../../../../lib/whatsapp/admin-reply";
import { checkWhatsAppAdminSendRateLimit } from "../../../../../../../lib/whatsapp/admin-rate-limit";

export const runtime = "nodejs";

function positive(value:string|null){if(!value)return undefined;const n=Number(value);if(!Number.isInteger(n)||n<1)throw new Error("INVALID_PAGINATION");return n;}
function errorResponse(error:unknown){const code=error instanceof Error?error.message:"ADMIN_WHATSAPP_MESSAGE_FAILED";const status=code==="UNAUTHENTICATED"?401:code==="FORBIDDEN"?403:code==="WHATSAPP_RATE_LIMITED"?429:code.includes("NOT_FOUND")?404:400;return NextResponse.json({ok:false,error:{code}},{status});}

export async function GET(request:Request,context:{params:Promise<{id:string}>}){try{await requireAdminApi();const {id}=await context.params;const url=new URL(request.url);const result=await listAdminWhatsAppMessages(id,{page:positive(url.searchParams.get("page")),pageSize:positive(url.searchParams.get("pageSize"))});if(!result)return NextResponse.json({ok:false,error:{code:"WHATSAPP_CONVERSATION_NOT_FOUND"}},{status:404});return NextResponse.json({ok:true,...result});}catch(error){return errorResponse(error);}}

export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{const actor=await requireAdminApi();const limit=checkWhatsAppAdminSendRateLimit(actor.id);if(!limit.allowed)return NextResponse.json({ok:false,error:{code:"WHATSAPP_RATE_LIMITED"}},{status:429,headers:{"Retry-After":String(limit.retryAfterSeconds),"X-RateLimit-Limit":String(limit.limit)}});const {id}=await context.params;const body=await request.json().catch(()=>({}));const message=await sendAdminWhatsAppText(id,body.text,actor.id);return NextResponse.json({ok:true,message},{status:201});}catch(error){return errorResponse(error);}}

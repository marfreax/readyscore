import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../../lib/auth/admin";
import { getAdminWhatsAppConversation } from "../../../../../../lib/admin-whatsapp-repository";
export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireAdminApi(); const { id } = await context.params; const conversation = await getAdminWhatsAppConversation(id); if (!conversation) return NextResponse.json({ ok:false, error:{code:"WHATSAPP_CONVERSATION_NOT_FOUND"} }, {status:404}); return NextResponse.json({ok:true, conversation}); }
  catch(error){ const code=error instanceof Error?error.message:"ADMIN_WHATSAPP_CONVERSATION_FAILED"; const status=code==="UNAUTHENTICATED"?401:code==="FORBIDDEN"?403:400; return NextResponse.json({ok:false,error:{code}},{status}); }
}

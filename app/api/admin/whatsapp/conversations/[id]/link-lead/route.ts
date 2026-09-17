import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../../../lib/auth/admin";
import { linkAdminWhatsAppConversationToBusinessLead } from "../../../../../../../lib/admin-whatsapp-repository";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdminApi();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const businessLeadId = typeof body?.businessLeadId === "string" ? body.businessLeadId.trim() : "";
    if (!businessLeadId) throw new Error("BUSINESS_LEAD_ID_REQUIRED");
    const result = await linkAdminWhatsAppConversationToBusinessLead({ conversationId: id, businessLeadId, actorUserId: actor.id });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "WHATSAPP_BUSINESS_LEAD_LINK_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : code === "WHATSAPP_CONVERSATION_NOT_FOUND" || code === "BUSINESS_LEAD_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../../../lib/auth/admin";
import { searchAdminWhatsAppLeadCandidates } from "../../../../../../../lib/admin-whatsapp-repository";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi();
    const { id } = await context.params;
    const search = new URL(request.url).searchParams.get("search") ?? "";
    const result = await searchAdminWhatsAppLeadCandidates(id, search);
    if (!result) return NextResponse.json({ ok: false, error: { code: "WHATSAPP_CONVERSATION_NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "WHATSAPP_BUSINESS_LEAD_CANDIDATES_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

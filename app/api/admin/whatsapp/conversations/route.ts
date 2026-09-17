import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/auth/admin";
import { listAdminWhatsAppConversations } from "../../../../../lib/admin-whatsapp-repository";
export const runtime = "nodejs";
function positive(value: string | null) { if (!value) return undefined; const n = Number(value); if (!Number.isInteger(n) || n < 1) throw new Error("INVALID_PAGINATION"); return n; }
export async function GET(request: Request) {
  try {
    await requireAdminApi(); const url = new URL(request.url);
    const status = url.searchParams.get("status");
    if (status && status !== "OPEN" && status !== "CLOSED") throw new Error("INVALID_STATUS");
    const result = await listAdminWhatsAppConversations({ page: positive(url.searchParams.get("page")), pageSize: positive(url.searchParams.get("pageSize")), search: url.searchParams.get("search") ?? undefined, status: status as "OPEN" | "CLOSED" | undefined });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) { const code = error instanceof Error ? error.message : "ADMIN_WHATSAPP_CONVERSATIONS_FAILED"; const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400; return NextResponse.json({ ok: false, error: { code } }, { status }); }
}

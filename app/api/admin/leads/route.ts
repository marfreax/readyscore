import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { listAdminBusinessLeadsPaginated } from "../../../../lib/admin-business-leads-repository";

export const runtime = "nodejs";

function parsePositiveInteger(value: string | null, fallback: number) {
  if (value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("INVALID_PAGINATION");
  return parsed;
}

export async function GET(request: Request) {
  try {
    await requireAdminApi();
    const url = new URL(request.url);
    const page = parsePositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = parsePositiveInteger(url.searchParams.get("pageSize"), 25);
    const result = await listAdminBusinessLeadsPaginated({ page, pageSize });
    return NextResponse.json({ ok: true, leads: result.items, pagination: result.pagination, summary: result.summary });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADMIN_LEADS_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

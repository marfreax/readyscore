import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { listAdminUsersPaginated, performUserAccessAction } from "../../../../lib/admin-users-repository";

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
    const result = await listAdminUsersPaginated({ page, pageSize });
    return NextResponse.json({
      ok: true,
      users: result.items,
      pagination: result.pagination,
      summary: result.summary,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADMIN_USERS_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdminApi();
    const body = await request.json() as { targetUserId?:string; action?:"SET_STATUS"|"SET_ROLE"; value?:string; confirmed?:boolean; reason?:string };
    if (!body.targetUserId || !body.action || !body.value) throw new Error("INVALID_USER_OPERATION");
    const user = await performUserAccessAction({ actorUserId:actor.id, actorRole:actor.role, targetUserId:body.targetUserId, action:body.action, value:body.value as never, confirmed:body.confirmed === true, reason:body.reason });
    return NextResponse.json({ ok:true, user:{ id:user.id, name:user.name, email:user.email, role:user.role, status:user.status } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADMIN_USERS_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ ok:false, error:{code} }, { status });
  }
}

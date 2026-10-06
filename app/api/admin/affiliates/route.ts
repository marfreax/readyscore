import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { listAffiliateOperations, processAffiliatePayout, updateAffiliateRate } from "../../../../lib/affiliate/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminApi();
    return NextResponse.json({ ok: true, ...(await listAffiliateOperations()) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADMIN_AFFILIATES_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "UNAUTHENTICATED" ? 401 : 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi();
    const body = await request.json().catch(() => ({}));
    const profile = await updateAffiliateRate({ userEmail: body.userEmail, ratePercent: body.ratePercent, status: body.status, adminUserId: admin.id });
    return NextResponse.json({ ok: true, profile }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADMIN_AFFILIATE_UPDATE_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApi();
    const body = await request.json().catch(() => ({}));
    if (body.action !== "MARK_PAID" && body.action !== "REJECT") throw new Error("INVALID_PAYOUT_ACTION");
    const payout = await processAffiliatePayout({ payoutId: String(body.payoutId ?? ""), adminUserId: admin.id, action: body.action === "MARK_PAID" ? "PAID" : "REJECTED", transferReference: typeof body.transferReference === "string" ? body.transferReference : undefined, note: typeof body.note === "string" ? body.note : undefined });
    return NextResponse.json({ ok: true, payout });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADMIN_AFFILIATE_PAYOUT_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400 });
  }
}

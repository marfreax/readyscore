import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import { requestAffiliatePayout } from "../../../../lib/affiliate/service";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const body = await request.json().catch(() => ({}));
    const payout = await requestAffiliatePayout(session.user.id, body.amountIdr);
    return NextResponse.json({ ok: true, payout }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "AFFILIATE_PAYOUT_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "INSUFFICIENT_AFFILIATE_BALANCE" ? 409 : 400;
    return NextResponse.json({ ok: false, error: { code, message: code === "PAYOUT_DETAILS_REQUIRED" ? "Lengkapi rekening pencairan terlebih dahulu." : "Permintaan pencairan tidak dapat dibuat." } }, { status });
  }
}

import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../lib/auth/session";
import { createAffiliateProfile, getAffiliateSummary, updateAffiliatePayoutDetails } from "../../../lib/affiliate/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    return NextResponse.json({ ok: true, summary: await getAffiliateSummary(session.user.id) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "AFFILIATE_READ_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "UNAUTHENTICATED" ? 401 : 400 });
  }
}

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const profile = await createAffiliateProfile(session.user.id);
    return NextResponse.json({ ok: true, profile }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "AFFILIATE_ENROLLMENT_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "UNAUTHENTICATED" ? 401 : 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    const body = await request.json().catch(() => ({}));
    const profile = await updateAffiliatePayoutDetails(session.user.id, { bankName: body.bankName, accountName: body.accountName, accountNumber: body.accountNumber });
    return NextResponse.json({ ok: true, profile: { payoutBankName: profile.payoutBankName, payoutAccountName: profile.payoutAccountName, payoutAccountNumber: profile.payoutAccountNumber } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "AFFILIATE_PROFILE_UPDATE_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "UNAUTHENTICATED" ? 401 : 400 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getV15CustomerReportState } from "../../../../lib/v15/customer-service";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in diperlukan." } }, { status: 401 });
  try {
    const state = await getV15CustomerReportState(session.user.id);
    if (!state.access) return NextResponse.json({ ok: true, state }, { status: 200 });
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Personalized report tidak dapat dimuat." } }, { status: 500 });
  }
}

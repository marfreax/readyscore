import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import { CrossTestProfileAccessError, getCrossTestProfile } from "../../../../lib/profile/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "Login diperlukan untuk melihat Cross-Test Profile." } }, { status: 401 });
  }

  try {
    return NextResponse.json({ ok: true, ...(await getCrossTestProfile(session.user.id)) });
  } catch (error) {
    if (error instanceof CrossTestProfileAccessError) {
      return NextResponse.json({ ok: false, error: { code: error.code, message: "Akses Cross-Test Profile belum tersedia untuk akun ini." } }, { status: 403 });
    }
    console.error(error);
    return NextResponse.json({ ok: false, error: { code: "PROFILE_UNAVAILABLE", message: "Cross-Test Profile tidak tersedia." } }, { status: 500 });
  }
}

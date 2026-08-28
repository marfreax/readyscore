import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getUpgradeQuote } from "../../../../lib/commercial/upgrade-service";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "AUTH_REQUIRED", message: "Login diperlukan untuk melihat opsi upgrade." } },
      { status: 401 },
    );
  }

  try {
    const target = new URL(request.url).searchParams.get("target") ?? undefined;
    const quote = await getUpgradeQuote(session.user.id, target);
    return NextResponse.json({ ok: true, ...quote });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: { code: "UPGRADE_QUOTE_UNAVAILABLE", message: "Opsi upgrade tidak tersedia." } },
      { status: 500 },
    );
  }
}

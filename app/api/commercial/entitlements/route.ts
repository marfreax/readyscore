import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import {
  getActiveProductsForUser,
  listUserEntitlements,
} from "../../../../lib/commercial/entitlement-service";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "Login diperlukan untuk melihat entitlement.",
        },
      },
      { status: 401 },
    );
  }

  try {
    const [products, entitlements] = await Promise.all([
      getActiveProductsForUser(session.user.id),
      listUserEntitlements(session.user.id),
    ]);

    return NextResponse.json({
      ok: true,
      architectureVersion: "V3_COMMERCIAL_3.1",
      userId: session.user.id,
      products,
      entitlements,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ENTITLEMENT_UNAVAILABLE",
          message: "Entitlement pengguna tidak tersedia.",
        },
      },
      { status: 500 },
    );
  }
}

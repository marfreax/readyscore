import { NextResponse } from "next/server";
import { getMyCommercialOrders } from "../../../../lib/commercial/v14-1";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, orders: await getMyCommercialOrders() });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ORDERS_UNAVAILABLE";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "UNAUTHENTICATED" ? 401 : 500 });
  }
}

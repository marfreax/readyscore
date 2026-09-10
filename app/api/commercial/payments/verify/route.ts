import { NextResponse } from "next/server";
import { verifyProviderPayment } from "../../../../../lib/commercial/v14-2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) return NextResponse.json({ ok: false, error: { code: "INVALID_PAYMENT_REQUEST" } }, { status: 400 });
    return NextResponse.json({ ok: true, payment: await verifyProviderPayment(orderId) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_VERIFY_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "ORDER_NOT_FOUND" ? 404 : 409;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

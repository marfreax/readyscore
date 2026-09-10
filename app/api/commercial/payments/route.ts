import { NextResponse } from "next/server";
import { createProviderPayment } from "../../../../lib/commercial/v14-2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) return NextResponse.json({ ok: false, error: { code: "INVALID_PAYMENT_REQUEST" } }, { status: 400 });
    return NextResponse.json({ ok: true, payment: await createProviderPayment(orderId) }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_CREATE_FAILED";
    const status =
      code === "UNAUTHENTICATED" ? 401 :
      ["ORDER_NOT_FOUND", "PAYMENT_NOT_CREATED", "ORDER_NOT_PAYABLE"].includes(code) ? 409 :
      code.startsWith("MIDTRANS_API_ERROR") || code === "PAYMENT_PROVIDER_NOT_CONFIGURED" ? 502 : 500;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

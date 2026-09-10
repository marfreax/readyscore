import { NextResponse } from "next/server";
import {
  getMyCommercialDelivery,
  retryPaidOrderFulfillment,
} from "../../../../../../lib/commercial/v14-3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    return NextResponse.json({ ok: true, delivery: await getMyCommercialDelivery(orderId) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "DELIVERY_UNAVAILABLE";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "ORDER_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const delivery = await getMyCommercialDelivery(orderId);
    if (delivery.paymentStatus !== "PAID") {
      return NextResponse.json({ ok: false, error: { code: "PAYMENT_NOT_PAID" } }, { status: 409 });
    }
    const result = await retryPaidOrderFulfillment(orderId);
    return NextResponse.json({ ok: true, fulfillment: result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "FULFILLMENT_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "ORDER_NOT_FOUND" ? 404 : code === "PAYMENT_NOT_PAID" ? 409 : 500;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

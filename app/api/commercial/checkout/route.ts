import { NextResponse } from "next/server";
import { createCheckoutOrder } from "../../../../lib/commercial/v14-1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createCheckoutOrder({
      productId: typeof body?.productId === "string" ? body.productId : "",
      quantity: typeof body?.quantity === "number" ? body.quantity : 1,
      testType: typeof body?.testType === "string" ? body.testType : undefined,
      couponCode: typeof body?.couponCode === "string" ? body.couponCode : undefined,
    });
    return NextResponse.json({ ok: true, order: result }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHECKOUT_FAILED";
    const status =
      code === "UNAUTHENTICATED" ? 401 :
      code === "PRODUCT_NOT_AVAILABLE" || code === "PRODUCT_PRICE_NOT_CONFIGURED" || code === "SINGLE_TEST_SELECTION_REQUIRED" || code === "INVALID_SINGLE_TEST_TYPE" || code === "INVALID_SINGLE_TEST_SELECTION" || code === "INVALID_OFFER" || code === "OFFER_CONFIGURATION_INVALID" || code === "OFFER_NOT_CONFIGURED" || code === "OFFER_EXPIRED" ? 409 :
      code === "INVALID_CHECKOUT" ? 400 : 500;
    return NextResponse.json({
      ok: false,
      error: { code, message: code === "UNAUTHENTICATED" ? "Login diperlukan." : "Checkout tidak dapat dibuat." },
    }, { status });
  }
}

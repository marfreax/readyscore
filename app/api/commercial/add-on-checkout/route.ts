import { NextResponse } from "next/server";
import { createReassessmentCreditCheckoutOrder } from "../../../../lib/commercial/v14-1";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const testType = typeof body?.testType === "string" ? body.testType : "";
    const result = await createReassessmentCreditCheckoutOrder({ testType });
    return NextResponse.json({ ok: true, order: result }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADD_ON_CHECKOUT_FAILED";
    const status =
      code === "UNAUTHENTICATED" ? 401 :
      ["REASSESSMENT_CREDIT_PRODUCT_NOT_ACTIVE", "PRODUCT_NOT_AVAILABLE", "ADD_ON_PRICE_NOT_CONFIGURED", "INVALID_REASSESSMENT_TEST_TYPE"].includes(code) ? 409 :
      500;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

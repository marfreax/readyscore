import { NextResponse } from "next/server";
import { verifyMidtransNotificationSignature } from "../../../../../lib/commercial/midtrans-security";
import { processProviderWebhook } from "../../../../../lib/commercial/v14-2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody.toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON" } }, { status: 400 });
  }

  if (!verifyMidtransNotificationSignature(payload)) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_MIDTRANS_SIGNATURE" } }, { status: 401 });
  }

  try {
    const result = await processProviderWebhook({ rawBody, payload });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "MIDTRANS_WEBHOOK_FAILED";
    const status =
      code === "WEBHOOK_ORDER_NOT_FOUND" ? 404 :
      code.includes("MISMATCH") || code.includes("AMOUNT") || code.includes("CURRENCY") ? 422 : 500;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}

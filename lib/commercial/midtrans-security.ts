import crypto from "node:crypto";

export function verifyMidtransNotificationSignature(payload: Record<string, unknown>) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  const orderId = String(payload.order_id ?? "");
  const statusCode = String(payload.status_code ?? "");
  const grossAmount = String(payload.gross_amount ?? "");
  const received = String(payload.signature_key ?? "").trim().toLowerCase();

  if (!serverKey || !orderId || !statusCode || !grossAmount || !received) return false;

  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`, "utf8")
    .digest("hex");

  if (!/^[0-9a-f]{128}$/.test(received)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}

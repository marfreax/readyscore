import crypto from "node:crypto";

export function verifyScalevWebhookSignature(
  rawBody: Buffer,
  signature: string | null,
): boolean {
  const secret = process.env.SCALEV_WEBHOOK_SIGNING_SECRET?.trim();
  if (!secret || !signature) return false;

  const normalizedSignature = signature.trim();
  if (!normalizedSignature || normalizedSignature.length % 4 !== 0) {
    return false;
  }

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalizedSignature)) {
    return false;
  }

  let received: Buffer;
  try {
    received = Buffer.from(normalizedSignature, "base64");
  } catch {
    return false;
  }

  // Node's base64 decoder is intentionally permissive and silently ignores
  // invalid trailing characters. Re-encoding guarantees that the supplied
  // signature is a canonical base64 representation of exactly these bytes.
  if (received.toString("base64") !== normalizedSignature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest();

  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}

export function createHandoffToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashHandoffToken(token: string) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string | null | undefined) {
  return value ? value.replace(/[^\d+]/g, "") : "";
}

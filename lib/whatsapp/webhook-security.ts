import { createHmac, timingSafeEqual } from "node:crypto";

const VERIFY_TOKEN_ENV = "WHATSAPP_VERIFY_TOKEN";
const APP_SECRET_ENV = "WHATSAPP_APP_SECRET";

export function getWhatsAppVerifyToken(): string | null {
  const value = process.env[VERIFY_TOKEN_ENV]?.trim();
  return value || null;
}

export function getWhatsAppAppSecret(): string | null {
  const value = process.env[APP_SECRET_ENV]?.trim();
  return value || null;
}

function safeEqualText(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function verifyWhatsAppChallenge(
  mode: string | null,
  verifyToken: string | null,
  expectedToken: string | null,
): boolean {
  if (!mode || mode !== "subscribe") return false;
  if (!verifyToken || !expectedToken) return false;
  return safeEqualText(expectedToken, verifyToken);
}

export function verifyWhatsAppSignature(
  rawBody: Uint8Array,
  signatureHeader: string | null,
  appSecret = getWhatsAppAppSecret(),
): boolean {
  if (!appSecret || !signatureHeader) return false;

  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;

  const providedHex = signatureHeader.slice(prefix.length).trim();
  if (!/^[a-fA-F0-9]{64}$/.test(providedHex)) return false;

  const expectedHex = createHmac("sha256", appSecret)
    .update(Buffer.from(rawBody))
    .digest("hex");

  return safeEqualText(expectedHex.toLowerCase(), providedHex.toLowerCase());
}

export function createWhatsAppTestSignature(
  rawBody: Uint8Array,
  appSecret: string,
): string {
  const digest = createHmac("sha256", appSecret)
    .update(Buffer.from(rawBody))
    .digest("hex");
  return `sha256=${digest}`;
}

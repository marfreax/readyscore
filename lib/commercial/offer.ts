export const V16_OFFER_CODE = (process.env.READYSCORE_OFFER_CODE?.trim().toUpperCase() || "READY20");
export const V16_OFFER_PERCENT = Number.parseInt(process.env.READYSCORE_OFFER_PERCENT ?? "20", 10);

export function validateV16Offer(code: unknown, now = new Date()) {
  const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (!normalized || normalized !== V16_OFFER_CODE) return { valid: false as const, code: "INVALID_OFFER" as const };
  if (!Number.isInteger(V16_OFFER_PERCENT) || V16_OFFER_PERCENT <= 0 || V16_OFFER_PERCENT >= 100) return { valid: false as const, code: "OFFER_CONFIGURATION_INVALID" as const };
  const expiresRaw = process.env.READYSCORE_OFFER_EXPIRES_AT?.trim();
  if (!expiresRaw) return { valid: false as const, code: "OFFER_NOT_CONFIGURED" as const };
  const expiresAt = new Date(expiresRaw);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now) return { valid: false as const, code: "OFFER_EXPIRED" as const };
  return { valid: true as const, code: normalized, percent: V16_OFFER_PERCENT, expiresAt };
}

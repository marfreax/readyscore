/** Campaign metadata only. Never accept contact details, URLs, or assessment data. */
export const PROMO_CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "placement", "site_source_name", "fbclid"] as const;
export type PromoAttribution = Partial<Record<(typeof PROMO_CAMPAIGN_KEYS)[number], string>>;

export function parsePromoAttribution(input: unknown): PromoAttribution {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const values = input as Record<string, unknown>;
  const result: PromoAttribution = {};
  for (const key of PROMO_CAMPAIGN_KEYS) {
    const raw = values[key];
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value || value.length > (key === "fbclid" ? 500 : 160)) continue;
    if (key === "fbclid" ? !/^[A-Za-z0-9_-]+$/.test(value) : !/^[\p{L}\p{N} ._~:+()|-]+$/u.test(value)) continue;
    result[key] = value;
  }
  return result;
}

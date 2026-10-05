const CHECKOUT_SKUS = [
  "RS-SINGLE-IQ-V1",
  "RS-SINGLE-EQ-V1",
  "RS-SINGLE-DISC-V1",
  "RS-SINGLE-RIASEC-V1",
  "RS-ASSESSMENT-V1",
  "RS-ALL-PROFILING-V1",
  "RS-REASSESSMENT-CREDIT-V1",
  "RS-REASSESSMENT-CREDIT-COGNITIVE-V1",
  "RS-REASSESSMENT-CREDIT-EQ-V1",
  "RS-REASSESSMENT-CREDIT-DISC-V1",
  "RS-REASSESSMENT-CREDIT-RIASEC-V1",
  "RS-REASSESSMENT-CREDIT-WORK_ATTITUDE-V1",
  "RS-REASSESSMENT-CREDIT-LEARNING_PREFERENCE-V1",
] as const;

export type ScalevCheckoutSku = (typeof CHECKOUT_SKUS)[number];

const ENV_URL_BY_SKU: Record<ScalevCheckoutSku, string> = {
  "RS-SINGLE-IQ-V1": "SCALEV_CHECKOUT_SINGLE_IQ_URL",
  "RS-SINGLE-EQ-V1": "SCALEV_CHECKOUT_SINGLE_EQ_URL",
  "RS-SINGLE-DISC-V1": "SCALEV_CHECKOUT_SINGLE_DISC_URL",
  "RS-SINGLE-RIASEC-V1": "SCALEV_CHECKOUT_SINGLE_RIASEC_URL",
  "RS-ASSESSMENT-V1": "SCALEV_CHECKOUT_ALL_TESTS_URL",
  "RS-ALL-PROFILING-V1": "SCALEV_CHECKOUT_ALL_PROFILING_URL",
  "RS-REASSESSMENT-CREDIT-V1": "SCALEV_CHECKOUT_REASSESSMENT_CREDIT_EQ_URL",
  "RS-REASSESSMENT-CREDIT-COGNITIVE-V1": "SCALEV_CHECKOUT_REASSESSMENT_CREDIT_COGNITIVE_URL",
  "RS-REASSESSMENT-CREDIT-EQ-V1": "SCALEV_CHECKOUT_REASSESSMENT_CREDIT_EQ_URL",
  "RS-REASSESSMENT-CREDIT-DISC-V1": "SCALEV_CHECKOUT_REASSESSMENT_CREDIT_DISC_URL",
  "RS-REASSESSMENT-CREDIT-RIASEC-V1": "SCALEV_CHECKOUT_REASSESSMENT_CREDIT_RIASEC_URL",
  "RS-REASSESSMENT-CREDIT-WORK_ATTITUDE-V1": "SCALEV_CHECKOUT_REASSESSMENT_CREDIT_WORK_ATTITUDE_URL",
  "RS-REASSESSMENT-CREDIT-LEARNING_PREFERENCE-V1": "SCALEV_CHECKOUT_REASSESSMENT_CREDIT_LEARNING_PREFERENCE_URL",
};

function checkoutUrlAllowed(url: URL): boolean {
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const loopback =
    hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "::1" ||
    hostname === "0.0.0.0" || /^127(?:\.\d{1,3}){3}$/.test(hostname);
  if (process.env.NODE_ENV === "production") return url.protocol === "https:" && !loopback;
  return url.protocol === "https:" || (url.protocol === "http:" && loopback);
}

export function isScalevCheckoutSku(value: string): value is ScalevCheckoutSku {
  return (CHECKOUT_SKUS as readonly string[]).includes(value);
}

function readCheckoutMap(): Partial<Record<ScalevCheckoutSku, string>> {
  const raw = process.env.SCALEV_CHECKOUT_URL_MAP_JSON?.trim();
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("SCALEV_CHECKOUT_URL_MAP_JSON_INVALID");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("SCALEV_CHECKOUT_URL_MAP_JSON_INVALID");
  }

  const result: Partial<Record<ScalevCheckoutSku, string>> = {};
  for (const [sku, value] of Object.entries(parsed)) {
    if (!isScalevCheckoutSku(sku)) continue;
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`SCALEV_CHECKOUT_URL_INVALID:${sku}`);
    }
    let url: URL;
    try {
      url = new URL(value.trim());
    } catch {
      throw new Error(`SCALEV_CHECKOUT_URL_INVALID:${sku}`);
    }
    if (!checkoutUrlAllowed(url)) {
      throw new Error(`SCALEV_CHECKOUT_URL_HTTPS_REQUIRED:${sku}`);
    }
    result[sku] = url.toString();
  }

  return result;
}

export function getScalevCheckoutUrl(sku: ScalevCheckoutSku): string | null {
  const configured = readCheckoutMap()[sku];
  if (configured) return configured;
  const envName = ENV_URL_BY_SKU[sku];
  const raw = process.env[envName]?.trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (!checkoutUrlAllowed(url)) {
    throw new Error(`SCALEV_CHECKOUT_URL_HTTPS_REQUIRED:${sku}`);
  }
  return url.toString();
}

export function getScalevCheckoutConfiguration() {
  return {
    configuredSkus: CHECKOUT_SKUS.filter((sku) => Boolean(getScalevCheckoutUrl(sku))),
    supportedSkus: [...CHECKOUT_SKUS],
  };
}

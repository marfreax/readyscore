const CHECKOUT_SKUS = [
  "RS-SINGLE-IQ-V1",
  "RS-SINGLE-EQ-V1",
  "RS-SINGLE-DISC-V1",
  "RS-SINGLE-RIASEC-V1",
  "RS-ASSESSMENT-V1",
  "RS-ALL-PROFILING-V1",
] as const;

export type ScalevCheckoutSku = (typeof CHECKOUT_SKUS)[number];

const ENV_URL_BY_SKU: Record<ScalevCheckoutSku, string> = {
  "RS-SINGLE-IQ-V1": "SCALEV_CHECKOUT_SINGLE_IQ_URL",
  "RS-SINGLE-EQ-V1": "SCALEV_CHECKOUT_SINGLE_EQ_URL",
  "RS-SINGLE-DISC-V1": "SCALEV_CHECKOUT_SINGLE_DISC_URL",
  "RS-SINGLE-RIASEC-V1": "SCALEV_CHECKOUT_SINGLE_RIASEC_URL",
  "RS-ASSESSMENT-V1": "SCALEV_CHECKOUT_ALL_TESTS_URL",
  "RS-ALL-PROFILING-V1": "SCALEV_CHECKOUT_ALL_PROFILING_URL",
};

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
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
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
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
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

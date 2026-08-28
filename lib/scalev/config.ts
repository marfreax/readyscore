import type { CommercialTier } from "@prisma/client";

export type ScalevProductMapping =
  | { kind?: "PRODUCT"; tier: CommercialTier; testType?: "IQ" | "EQ" | "DISC" | "RIASEC" }
  | { kind: "REASSESSMENT_CREDIT"; addOnProductId: "addon-reassessment-credit-v1"; reassessmentTestType: "IQ" | "EQ" | "DISC" | "RIASEC" };

const DEFAULT_SCALEV_SKU_MAP: Record<string, ScalevProductMapping> = {
  "RS-ASSESSMENT-V1": { kind: "PRODUCT", tier: "MEDIUM" },
  "RS-SINGLE-EQ-V1": { kind: "PRODUCT", tier: "BASIC", testType: "EQ" },
  "RS-SINGLE-DISC-V1": { kind: "PRODUCT", tier: "BASIC", testType: "DISC" },
  "RS-SINGLE-RIASEC-V1": { kind: "PRODUCT", tier: "BASIC", testType: "RIASEC" },
  "RS-SINGLE-IQ-V1": { kind: "PRODUCT", tier: "BASIC", testType: "IQ" },
  "RS-ALL-PROFILING-V1": { kind: "PRODUCT", tier: "ADVANCE" },
  "RS-REASSESSMENT-CREDIT-V1": { kind: "REASSESSMENT_CREDIT", addOnProductId: "addon-reassessment-credit-v1", reassessmentTestType: "EQ" },
};

export function getScalevProductSkuMap(): Record<string, ScalevProductMapping> {
  const raw = process.env.SCALEV_PRODUCT_SKU_MAP_JSON?.trim();
  if (!raw) return DEFAULT_SCALEV_SKU_MAP;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("SCALEV_PRODUCT_SKU_MAP_JSON_INVALID");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("SCALEV_PRODUCT_SKU_MAP_JSON_INVALID");
  }

  const result: Record<string, ScalevProductMapping> = {};
  for (const [sku, value] of Object.entries(parsed)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("SCALEV_PRODUCT_SKU_MAP_JSON_INVALID");
    }
    const kind = (value as { kind?: unknown }).kind ?? "PRODUCT";
    if (kind === "REASSESSMENT_CREDIT") {
      const addOnProductId = (value as { addOnProductId?: unknown }).addOnProductId;
      const reassessmentTestType = (value as { reassessmentTestType?: unknown }).reassessmentTestType;
      if (addOnProductId !== "addon-reassessment-credit-v1") throw new Error(`SCALEV_ADDON_PRODUCT_INVALID:${sku}`);
      if (!["IQ", "EQ", "DISC", "RIASEC"].includes(String(reassessmentTestType))) throw new Error(`SCALEV_REASSESSMENT_TEST_TYPE_INVALID:${sku}`);
      result[sku.trim()] = { kind: "REASSESSMENT_CREDIT", addOnProductId, reassessmentTestType: reassessmentTestType as "IQ" | "EQ" | "DISC" | "RIASEC" };
      continue;
    }
    if (kind !== "PRODUCT") throw new Error(`SCALEV_PRODUCT_KIND_INVALID:${sku}`);
    const tier = (value as { tier?: unknown }).tier;
    const testType = (value as { testType?: unknown }).testType;
    if (!["BASIC", "MEDIUM", "ADVANCE"].includes(String(tier))) throw new Error(`SCALEV_PRODUCT_SKU_TIER_INVALID:${sku}`);
    if (testType !== undefined && !["IQ", "EQ", "DISC", "RIASEC"].includes(String(testType))) throw new Error(`SCALEV_PRODUCT_SKU_TEST_TYPE_INVALID:${sku}`);
    result[sku.trim()] = { kind: "PRODUCT", tier: tier as CommercialTier, ...(testType ? { testType: testType as "IQ" | "EQ" | "DISC" | "RIASEC" } : {}) };
  }

  return result;
}

export function resolveScalevSku(sku: string): ScalevProductMapping | null {
  const normalized = sku.trim();
  if (!normalized) return null;
  return getScalevProductSkuMap()[normalized] ?? null;
}

export function getScalevPublicBaseUrl(): string {
  return (
    process.env.READYSCORE_PUBLIC_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

export function getScalevHandoffTtlMinutes(): number {
  const raw = Number(process.env.SCALEV_HANDOFF_TTL_MINUTES ?? "15");
  if (!Number.isInteger(raw) || raw < 1 || raw > 120) {
    throw new Error("SCALEV_HANDOFF_TTL_MINUTES_INVALID");
  }
  return raw;
}

export function getScalevApiBaseUrl(): string {
  return (
    process.env.SCALEV_API_BASE_URL?.trim().replace(/\/+$/, "") ||
    "https://api.scalev.com"
  );
}

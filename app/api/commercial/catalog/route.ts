import { NextResponse } from "next/server";
import {
  COMMERCIAL_ARCHITECTURE_VERSION,
  COMMERCIAL_MATRIX_VERSION,
  COMMERCIAL_PRICING_STATUS,
  getCommercialCatalog,
  getCommercialEntitlementMatrix,
} from "../../../../lib/commercial/catalog";

export async function GET() {
  try {
    const products = await getCommercialCatalog();

    return NextResponse.json({
      ok: true,
      architectureVersion: COMMERCIAL_ARCHITECTURE_VERSION,
      matrixVersion: COMMERCIAL_MATRIX_VERSION,
      pricingStatus: COMMERCIAL_PRICING_STATUS,
      products,
      entitlementMatrix: getCommercialEntitlementMatrix(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "COMMERCIAL_CATALOG_UNAVAILABLE",
          message: "Commercial catalog tidak tersedia.",
        },
      },
      { status: 500 },
    );
  }
}

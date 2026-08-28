import { NextResponse } from "next/server";
import {
  B2C_ADD_ON_CATALOG_VERSION,
  B2C_CONVERSION_VERSION,
  B2C_PRICING_STATUS,
  getB2CAddOnCatalog,
} from "../../../../lib/commercial/add-on-catalog";

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      conversionVersion: B2C_CONVERSION_VERSION,
      catalogVersion: B2C_ADD_ON_CATALOG_VERSION,
      pricingStatus: B2C_PRICING_STATUS,
      purchase: { implemented: false, mode: "PLANNING_ONLY" },
      addOns: await getB2CAddOnCatalog(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: { code: "B2C_ADD_ON_CATALOG_UNAVAILABLE", message: "Add-on catalog tidak tersedia." } },
      { status: 500 },
    );
  }
}

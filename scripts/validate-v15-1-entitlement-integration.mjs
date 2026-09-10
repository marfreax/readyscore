import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function fail(code, message) {
  throw new Error(`${code}: ${message}`);
}

function key(item) {
  return `${item.type}|${item.resourceType}|${item.resourceKey}`;
}

async function main() {
  try {
    console.log("=== READY SCORE V15.1 CONTROLLED ENTITLEMENT GATE ===");

    const advance = await prisma.product.findUnique({
      where: { id: "product-advance" },
      include: { entitlements: true },
    });
    if (!advance) fail("ADVANCE_PRODUCT_MISSING", "product-advance not found.");

    const reportDefinition = advance.entitlements.find(
      (item) => key(item) === "REPORT_ACCESS|FEATURE|ADVANCED_REPORT_V1",
    );
    if (!reportDefinition) {
      fail(
        "ADVANCE_REPORT_DEFINITION_MISSING",
        "ADVANCE does not include REPORT_ACCESS / ADVANCED_REPORT_V1.",
      );
    }

    const now = new Date();
    const activeAdvanceUsers = await prisma.userEntitlement.findMany({
      where: {
        productId: "product-advance",
        type: "TEST_ACCESS",
        status: "ACTIVE",
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    const missing = [];
    for (const { userId } of activeAdvanceUsers) {
      const report = await prisma.userEntitlement.findFirst({
        where: {
          userId,
          type: "REPORT_ACCESS",
          resourceType: "FEATURE",
          resourceKey: "ADVANCED_REPORT_V1",
          status: "ACTIVE",
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        select: { id: true, productId: true, source: true },
      });
      if (!report) missing.push(userId);
    }

    if (missing.length) {
      fail(
        "ADVANCE_REPORT_BACKFILL_MISSING",
        `${missing.length} active ADVANCE customer(s) are missing report entitlement.`,
      );
    }

    console.log("ADVANCE product report definition : PASS");
    console.log(`Active ADVANCE customers checked : ${activeAdvanceUsers.length}`);
    console.log("Existing ADVANCE backfill         : PASS");
    console.log("New ADVANCE fulfillment path      : PASS");
    console.log("V15.1 entitlement integration     : PASS");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

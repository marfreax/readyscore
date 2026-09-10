import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db/prisma";
import { getCurrentSession } from "../../../../../lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  const { orderId } = await params;
  const order = await prisma.commercialOrder.findFirst({
    where: { id: orderId, userId: session.user.id },
    select: {
      id: true, orderNumber: true, productNameSnapshot: true, assessmentTypeSnapshot: true,
      quantity: true, unitPriceIdrSnapshot: true, totalAmountIdr: true, currency: true,
      status: true, paymentStatus: true, fulfillmentStatus: true, createdAt: true, updatedAt: true,
    },
  });
  if (!order) return NextResponse.json({ ok: false, error: { code: "ORDER_NOT_FOUND" } }, { status: 404 });
  return NextResponse.json({ ok: true, order });
}

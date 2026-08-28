import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db/prisma";
import { verifyScalevWebhookSignature } from "../../../../lib/scalev/security";
import { fulfillScalevPayment } from "../../../../lib/scalev/service";
import type { ScalevWebhookEnvelope } from "../../../../lib/scalev/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("X-Scalev-Hmac-Sha256");

  if (!verifyScalevWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_SCALEV_SIGNATURE" } },
      { status: 401 },
    );
  }

  let envelope: ScalevWebhookEnvelope;
  try {
    envelope = JSON.parse(rawBody.toString("utf8")) as ScalevWebhookEnvelope;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON" } },
      { status: 400 },
    );
  }

  if (
    !envelope ||
    typeof envelope.event !== "string" ||
    typeof envelope.unique_id !== "string" ||
    !envelope.unique_id.trim() ||
    !envelope.data ||
    typeof envelope.data !== "object" ||
    Array.isArray(envelope.data)
  ) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_SCALEV_ENVELOPE" } },
      { status: 400 },
    );
  }

  const orderIdValue = envelope.data.order_id ?? envelope.data.id;
  const orderId =
    typeof orderIdValue === "string" && orderIdValue.trim()
      ? orderIdValue.trim()
      : null;

  const eventTime = new Date(envelope.timestamp);
  const parsedEventTime = Number.isNaN(eventTime.getTime())
    ? null
    : eventTime;

  try {
    const existing = await prisma.scalevWebhookEvent.findUnique({
      where: { uniqueId: envelope.unique_id },
      select: { id: true, status: true },
    });

    if (existing && existing.status !== "FAILED") {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        eventId: existing.id,
        status: existing.status,
      });
    }

    if (existing?.status === "FAILED") {
      await prisma.scalevWebhookEvent.update({
        where: { id: existing.id },
        data: {
          status: "RECEIVED",
          errorCode: null,
          errorMessage: null,
          processedAt: null,
          payload: JSON.parse(JSON.stringify(envelope)) as Prisma.InputJsonValue,
          orderId,
          eventTime: parsedEventTime,
        },
      });
    }

    let eventRecord;
    if (existing?.status === "FAILED") {
      eventRecord = await prisma.scalevWebhookEvent.findUniqueOrThrow({
        where: { id: existing.id },
      });
    } else {
      try {
        eventRecord = await prisma.scalevWebhookEvent.create({
          data: {
            uniqueId: envelope.unique_id,
            event: envelope.event,
            orderId,
            eventTime: parsedEventTime,
            payload: JSON.parse(JSON.stringify(envelope)) as Prisma.InputJsonValue,
            status: "RECEIVED",
          },
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code?: unknown }).code === "P2002"
        ) {
          const raced = await prisma.scalevWebhookEvent.findUniqueOrThrow({
            where: { uniqueId: envelope.unique_id },
          });
          return NextResponse.json({
            ok: true,
            duplicate: true,
            eventId: raced.id,
            status: raced.status,
          });
        }
        throw error;
      }
    }

    if (envelope.event === "order.created" || envelope.event === "order.updated") {
      await prisma.scalevWebhookEvent.update({
        where: { id: eventRecord.id },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        eventId: eventRecord.id,
        event: envelope.event,
        status: "PROCESSED",
      });
    }

    if (envelope.event === "payment.failed") {
      await prisma.scalevWebhookEvent.update({
        where: { id: eventRecord.id },
        data: {
          status: "IGNORED",
          processedAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        eventId: eventRecord.id,
        event: envelope.event,
        status: "IGNORED",
      });
    }

    if (envelope.event !== "payment.received") {
      await prisma.scalevWebhookEvent.update({
        where: { id: eventRecord.id },
        data: {
          status: "IGNORED",
          processedAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        eventId: eventRecord.id,
        event: envelope.event,
        status: "IGNORED",
      });
    }

    if (!orderId) {
      throw new Error("SCALEV_ORDER_ID_MISSING");
    }

    const paymentStatus = String(envelope.data.payment_status ?? "").toLowerCase();
    if (!["paid", "settled"].includes(paymentStatus)) {
      await prisma.scalevWebhookEvent.update({
        where: { id: eventRecord.id },
        data: {
          status: "IGNORED",
          processedAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        eventId: eventRecord.id,
        event: envelope.event,
        status: "IGNORED",
        reason: "PAYMENT_STATUS_NOT_FULFILLABLE",
      });
    }

    const result = await fulfillScalevPayment({
      eventId: eventRecord.id,
      orderId,
      paymentData: envelope.data,
    });

    await prisma.scalevWebhookEvent.update({
      where: { id: eventRecord.id },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      eventId: eventRecord.id,
      event: envelope.event,
      status: "PROCESSED",
      purchaseId: result.purchaseId,
      userId: result.userId,
      tier: result.tier,
      duplicate: result.duplicate,
      ...(result.handoffUrl ? { handoffUrl: result.handoffUrl } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const eventId = envelope.unique_id;

    await prisma.scalevWebhookEvent.updateMany({
      where: { uniqueId: eventId },
      data: {
        status: "FAILED",
        errorCode: message.split(":")[0] || "SCALEV_WEBHOOK_PROCESSING_FAILED",
        errorMessage: message.slice(0, 500),
      },
    });

    console.error("Scalev webhook processing failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SCALEV_WEBHOOK_PROCESSING_FAILED",
          message: "Webhook processing failed.",
        },
      },
      { status: 500 },
    );
  }
}

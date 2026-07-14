import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getOrder, updateOrder } from "../../../lib/order-store";
import type { OrderStatus } from "../../../lib/orders";

export const runtime = "nodejs";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const username = process.env.WORLDPAY_WEBHOOK_USERNAME;
  const password = process.env.WORLDPAY_WEBHOOK_PASSWORD;
  if (username && password) {
    const expected = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
    if (!safeEqual(request.headers.get("authorization") || "", expected)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Worldpay webhook authentication is not configured." }, { status: 503 });
  }

  const event = await request.json() as Record<string, unknown>;
  const details = event.eventDetails && typeof event.eventDetails === "object" ? event.eventDetails as Record<string, unknown> : event;
  const orderId = [details.transactionReference, event.transactionReference].find((value) => typeof value === "string") as string | undefined;
  const eventId = [event.eventId, event.id].find((value) => typeof value === "string") as string | undefined;
  const eventType = String(details.type || event.type || details.outcome || "unknown");
  if (!orderId) return NextResponse.json({ received: true });
  const order = await getOrder(orderId);
  if (!order || (eventId && order.processedWebhookIds?.includes(eventId))) return NextResponse.json({ received: true });

  const lowered = eventType.toLowerCase();
  let status: OrderStatus | undefined;
  if (lowered.includes("authorized") || lowered.includes("settled") || lowered.includes("captured")) status = "paid";
  else if (lowered.includes("refused") || lowered.includes("failed") || lowered.includes("error")) status = "payment_failed";
  else if (lowered.includes("cancel")) status = "cancelled";
  else if (lowered.includes("expire")) status = "expired";
  if (status) await updateOrder(orderId, { status, providerOutcome: eventType, processedWebhookIds: eventId ? [...(order.processedWebhookIds || []), eventId].slice(-50) : order.processedWebhookIds });
  return NextResponse.json({ received: true });
}

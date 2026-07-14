import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getOrder, updateOrder } from "../../../lib/order-store";
import type { OrderStatus } from "../../../lib/orders";

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const values = signatureHeader.split(",").reduce<Record<string, string[]>>((all, part) => {
    const [key, value] = part.split("=");
    if (key && value) (all[key] ||= []).push(value);
    return all;
  }, {});
  const timestamp = values.t?.[0];
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return (values.v1 || []).some((candidate) => {
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(expected, "hex"));
  });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!verifyStripeSignature(payload, signature, secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });

  const event = JSON.parse(payload) as { id: string; type: string; data?: { object?: { client_reference_id?: string; metadata?: { orderId?: string } } } };
  const object = event.data?.object;
  const orderId = object?.client_reference_id || object?.metadata?.orderId;
  if (!orderId) return NextResponse.json({ received: true });
  const order = await getOrder(orderId);
  if (!order || order.processedWebhookIds?.includes(event.id)) return NextResponse.json({ received: true });

  const statuses: Record<string, OrderStatus> = {
    "checkout.session.completed": "paid",
    "checkout.session.async_payment_succeeded": "paid",
    "checkout.session.async_payment_failed": "payment_failed",
    "checkout.session.expired": "expired",
  };
  const status = statuses[event.type];
  if (status) await updateOrder(orderId, { status, processedWebhookIds: [...(order.processedWebhookIds || []), event.id].slice(-50), providerOutcome: event.type });
  return NextResponse.json({ received: true });
}

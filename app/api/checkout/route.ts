import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createOrder, getOrder, updateOrder } from "../../lib/order-store";
import { CheckoutValidationError, type OrderRecord, validateCheckout } from "../../lib/orders";
import { createStripeCheckout } from "../../lib/payments/stripe";
import { authorizeWorldpay } from "../../lib/payments/worldpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let order: OrderRecord | undefined;
  try {
    const checkout = validateCheckout(await request.json());
    const requestedKey = request.headers.get("idempotency-key") || "";
    const orderId = /^[a-zA-Z0-9_-]{16,80}$/.test(requestedKey) ? requestedKey : randomUUID();
    const existing = await getOrder(orderId);
    if (existing?.providerCheckoutUrl) return NextResponse.json({ orderId: existing.id, redirectUrl: existing.providerCheckoutUrl });
    if (existing) return NextResponse.json({ error: "This checkout request is already being processed.", orderId: existing.id }, { status: 409 });
    const now = new Date().toISOString();
    const createdOrder: OrderRecord = {
      id: orderId, createdAt: now, updatedAt: now, status: "pending_payment", provider: checkout.provider,
      customer: checkout.customer, fulfilment: checkout.fulfilment, requestedTime: checkout.requestedTime,
      deliveryAddress: checkout.deliveryAddress, orderNote: checkout.orderNote, lines: checkout.lines,
      subtotalPence: checkout.subtotalPence, deliveryFeePence: checkout.deliveryFeePence,
      totalPence: checkout.totalPence, currency: "GBP",
    };
    order = createdOrder;
    await createOrder(createdOrder);
    const configuredBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const baseUrl = configuredBase || new URL(request.url).origin;

    if (createdOrder.provider === "stripe") {
      const payment = await createStripeCheckout(createdOrder, baseUrl);
      await updateOrder(createdOrder.id, { providerReference: payment.providerReference, providerCheckoutUrl: payment.redirectUrl });
      return NextResponse.json({ orderId: createdOrder.id, redirectUrl: payment.redirectUrl });
    }

    const payment = await authorizeWorldpay(createdOrder, checkout.worldpaySessions);
    await updateOrder(createdOrder.id, {
      providerReference: payment.providerReference,
      providerOutcome: payment.outcome,
      status: payment.paid ? "paid" : "pending_payment",
    });
    if (payment.paid) return NextResponse.json({ orderId: createdOrder.id, redirectUrl: `${baseUrl}/checkout/success?order_id=${createdOrder.id}&provider=worldpay` });
    if (payment.actionUrl) return NextResponse.json({ orderId: createdOrder.id, actionRequired: true, actionUrl: payment.actionUrl, outcome: payment.outcome }, { status: 202 });
    await updateOrder(createdOrder.id, { status: "payment_failed" });
    return NextResponse.json({ error: `Worldpay returned ${payment.outcome}. Please try another card or Stripe.`, orderId: createdOrder.id }, { status: 402 });
  } catch (error) {
    if (order) await updateOrder(order.id, { status: "payment_failed", providerOutcome: error instanceof Error ? error.message.slice(0, 180) : "Payment failed" }).catch(() => null);
    const status = error instanceof CheckoutValidationError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout could not be started." }, { status });
  }
}

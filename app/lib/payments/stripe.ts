import type { OrderRecord } from "../orders";

export async function createStripeCheckout(order: OrderRecord, baseUrl: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe is not configured.");

  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${baseUrl}/checkout/success?order_id=${order.id}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/cancelled?order_id=${order.id}`,
    client_reference_id: order.id,
    customer_email: order.customer.email,
    "metadata[orderId]": order.id,
    "payment_intent_data[metadata][orderId]": order.id,
  });

  order.lines.forEach((line, index) => {
    params.set(`line_items[${index}][quantity]`, String(line.quantity));
    params.set(`line_items[${index}][price_data][currency]`, "gbp");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(line.unitPricePence));
    params.set(`line_items[${index}][price_data][product_data][name]`, line.name);
    if (line.note) params.set(`line_items[${index}][price_data][product_data][description]`, `Note: ${line.note}`);
  });
  if (order.deliveryFeePence > 0) {
    const index = order.lines.length;
    params.set(`line_items[${index}][quantity]`, "1");
    params.set(`line_items[${index}][price_data][currency]`, "gbp");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(order.deliveryFeePence));
    params.set(`line_items[${index}][price_data][product_data][name]`, "Delivery");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": order.id },
    body: params,
  });
  const result = await response.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !result.id || !result.url) throw new Error(result.error?.message || "Stripe could not start checkout.");
  return { providerReference: result.id, redirectUrl: result.url };
}
